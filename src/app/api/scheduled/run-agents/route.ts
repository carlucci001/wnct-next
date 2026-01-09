import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { getDueScheduledAgents, updateAgentAfterRun, getAIJournalist } from '@/lib/aiJournalists';
import { getCategoryBySlug, getCategory } from '@/lib/categories';
import { getUnprocessedItems, markItemProcessed } from '@/lib/contentSources';
import { createScheduledTask, updateTaskStatus } from '@/lib/scheduledTasks';
import { formatArticleContent, formatExcerpt } from '@/lib/articles';
import { AIJournalist } from '@/types/aiJournalist';
import { Category } from '@/types/category';

export const dynamic = 'force-dynamic';
import { ContentItem } from '@/types/contentSource';

/**
 * Persist an external image URL to Firebase Storage
 * Returns the Firebase Storage URL, or empty string if persistence fails
 */
async function persistImageToStorage(imageUrl: string): Promise<string> {
  if (!imageUrl) return '';

  // Skip if already a Firebase Storage URL
  if (imageUrl.includes('firebasestorage.googleapis.com')) {
    return imageUrl;
  }

  try {
    // Dynamic import to avoid server-side issues
    const { storageService } = await import('@/lib/storage');
    const persistedUrl = await storageService.uploadAssetFromUrl(imageUrl);
    console.log('[Agent] Image persisted:', imageUrl.substring(0, 50), '->', persistedUrl.substring(0, 50));
    return persistedUrl;
  } catch (error) {
    console.error('[Agent] Failed to persist image:', error);
    // Return original URL as fallback (better than nothing)
    return imageUrl;
  }
}

/**
 * POST /api/scheduled/run-agents
 * Checks for agents due to run and generates articles
 * Should be called by cron job or Cloud Scheduler
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify request is from authorized source
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SCHEDULED_RUNNER_API_KEY;

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { agentId, force } = body; // Optional: run specific agent or force run

    // Get agents that are due
    let dueAgents: AIJournalist[];

    if (agentId) {
      // Run specific agent
      const agent = await getAIJournalist(agentId);
      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }
      dueAgents = [agent];
    } else if (force) {
      // Force run all scheduled agents
      const { getScheduledAgents } = await import('@/lib/aiJournalists');
      dueAgents = await getScheduledAgents();
    } else {
      // Normal: only agents that are due
      dueAgents = await getDueScheduledAgents();
    }

    if (dueAgents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No agents due to run',
        agentsProcessed: 0,
      });
    }

    // Get Gemini API key from settings
    const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
    const settings = settingsDoc.data();
    const geminiApiKey = settings?.geminiApiKey;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 503 }
      );
    }

    const results: {
      agentId: string;
      agentName: string;
      success: boolean;
      articleId?: string;
      error?: string;
    }[] = [];

    // Process each due agent
    for (const agent of dueAgents) {
      const agentStartTime = Date.now();

      // Create a scheduled task record
      const taskId = await createScheduledTask({
        agentId: agent.id,
        agentName: agent.name,
        taskType: 'generate-article',
        status: 'running',
        scheduledFor: new Date().toISOString(),
        maxRetries: 3,
      });

      try {
        // Get category for this agent
        const categorySlug = agent.taskConfig?.categoryId
          ? (await getCategory(agent.taskConfig.categoryId))?.slug
          : agent.beat;

        const category = categorySlug ? await getCategoryBySlug(categorySlug) : null;

        // Get unprocessed content items for this category
        const contentItems = await getUnprocessedItems(categorySlug, 5);

        if (contentItems.length === 0) {
          throw new Error('No content items available for article generation');
        }

        // Pick the most relevant item
        const selectedItem = contentItems[0];

        // Generate article using Gemini
        const article = await generateArticle(
          geminiApiKey,
          agent,
          category,
          selectedItem
        );

        // Persist image to Firebase Storage before saving article
        const persistedImageUrl = await persistImageToStorage(selectedItem.imageUrl || '');

        // Save article to Firestore
        const articleData = {
          title: article.title,
          content: formatArticleContent(article.content),
          excerpt: formatExcerpt(article.content.replace(/<[^>]+>/g, ''), 200),
          slug: generateSlug(article.title),
          author: agent.name,
          authorId: agent.id,
          authorPhotoURL: agent.photoURL || '',
          category: category?.name || agent.beat || 'News',
          categoryColor: category?.color || '#2563eb',
          tags: article.tags || [],
          status: agent.taskConfig?.autoPublish ? 'published' : 'draft',
          publishedAt: agent.taskConfig?.autoPublish ? new Date().toISOString() : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          featuredImage: persistedImageUrl,
          imageUrl: persistedImageUrl,
          isFeatured: agent.taskConfig?.isFeatured ?? false,
          isBreakingNews: agent.taskConfig?.isBreakingNews ?? false,
          breakingNewsTimestamp: agent.taskConfig?.isBreakingNews ? new Date().toISOString() : null,
          views: 0,
          // Source tracking
          sourceUrl: selectedItem.url,
          sourceItemId: selectedItem.id,
          generatedBy: 'ai-agent',
        };

        const articleRef = await addDoc(collection(getDb(), 'articles'), articleData);

        // Mark content item as processed
        await markItemProcessed(selectedItem.id, articleRef.id);

        // Update task status
        const generationTime = Date.now() - agentStartTime;
        await updateTaskStatus(taskId, 'completed', {
          articleId: articleRef.id,
          generationTime,
        });

        // Update agent metrics
        await updateAgentAfterRun(agent.id, true, generationTime);

        results.push({
          agentId: agent.id,
          agentName: agent.name,
          success: true,
          articleId: articleRef.id,
        });
      } catch (error) {
        console.error(`Error running agent ${agent.name}:`, error);

        // Update task status
        await updateTaskStatus(taskId, 'failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Update agent metrics (failed)
        await updateAgentAfterRun(agent.id, false);

        results.push({
          agentId: agent.id,
          agentName: agent.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      agentsProcessed: results.length,
      successCount,
      failedCount: results.length - successCount,
      totalTimeMs: totalTime,
      results,
    });
  } catch (error) {
    console.error('Scheduled runner error:', error);
    return NextResponse.json(
      { error: 'Failed to run scheduled agents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Generate an article using Gemini AI
 */
async function generateArticle(
  apiKey: string,
  agent: AIJournalist,
  category: Category | null,
  sourceItem: ContentItem
): Promise<{ title: string; content: string; tags: string[] }> {
  const model = 'gemini-2.0-flash';

  // Build the prompt with category directive and source material
  const prompt = buildArticlePrompt(agent, category, sourceItem);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Gemini API error:', errorData);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error('No response from Gemini API');
  }

  // Parse the response to extract title, content, and tags
  return parseArticleResponse(responseText, sourceItem);
}

/**
 * Build the prompt for article generation
 */
function buildArticlePrompt(
  agent: AIJournalist,
  category: Category | null,
  sourceItem: ContentItem
): string {
  let prompt = `You are ${agent.name}, ${agent.title}`;

  if (agent.beat) {
    prompt += ` covering the ${agent.beat} beat`;
  }

  prompt += ` for the WNC Times, a local news website covering Western North Carolina.\n\n`;

  if (agent.bio) {
    prompt += `About you: ${agent.bio}\n\n`;
  }

  // Add category directive if available
  if (category?.editorialDirective) {
    prompt += `EDITORIAL DIRECTIVE for ${category.name} articles:\n${category.editorialDirective}\n\n`;
  }

  prompt += `SOURCE MATERIAL:\n`;
  prompt += `Title: ${sourceItem.title}\n`;
  prompt += `Source: ${sourceItem.sourceName}\n`;
  prompt += `Published: ${new Date(sourceItem.publishedAt).toLocaleDateString()}\n`;

  if (sourceItem.description) {
    prompt += `Summary: ${sourceItem.description}\n`;
  }

  prompt += `URL: ${sourceItem.url}\n\n`;

  prompt += `TASK: Write a news article based on the source material above. The article should:
1. Be written in your voice and style as ${agent.name}
2. Be relevant to Western North Carolina readers
3. Follow the editorial directive if provided
4. Be informative, accurate, and engaging
5. Include attribution to the original source

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

TITLE: [Your headline here]

CONTENT:
[Your article content here - use multiple paragraphs, each separated by blank lines]

TAGS: [comma-separated tags]

Important:
- Write 3-5 paragraphs
- Use a journalistic tone appropriate for local news
- Include relevant local context when possible
- Keep the article factual and avoid speculation`;

  return prompt;
}

/**
 * Parse the Gemini response to extract article components
 */
function parseArticleResponse(
  response: string,
  sourceItem: ContentItem
): { title: string; content: string; tags: string[] } {
  let title = '';
  let content = '';
  let tags: string[] = [];

  // Extract title
  const titleMatch = response.match(/TITLE:\s*(.+?)(?:\n|CONTENT:)/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  } else {
    // Fallback: use source title with modification
    title = `Local Update: ${sourceItem.title}`;
  }

  // Extract content (using [\s\S] instead of . with s flag for multiline matching)
  const contentMatch = response.match(/CONTENT:\s*([\s\S]+?)(?:TAGS:|$)/i);
  if (contentMatch) {
    content = contentMatch[1].trim();
    // Convert paragraphs to HTML
    content = content
      .split(/\n\n+/)
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('\n');
  } else {
    // Fallback: use the whole response as content
    content = `<p>${response.replace(/TITLE:.*\n/i, '').replace(/TAGS:.*$/i, '').trim()}</p>`;
  }

  // Extract tags
  const tagsMatch = response.match(/TAGS:\s*(.+?)$/im);
  if (tagsMatch) {
    tags = tagsMatch[1]
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
  } else {
    // Use keywords from source item
    tags = sourceItem.keywords || [];
  }

  return { title, content, tags };
}

/**
 * Generate a URL-friendly slug from a title
 */
function generateSlug(title: string): string {
  const timestamp = Date.now().toString(36);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 50);
  return `${slug}-${timestamp}`;
}

/**
 * GET /api/scheduled/run-agents
 * When called by Vercel cron, runs due agents
 * Otherwise returns status of scheduled agents
 */
export async function GET(request: NextRequest) {
  try {
    // Check if this is a Vercel cron request
    const isCronRequest = request.headers.get('x-vercel-cron') === '1';

    if (isCronRequest) {
      // Run due agents (same logic as POST but without body params)
      const dueAgents = await getDueScheduledAgents();

      if (dueAgents.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No agents due to run',
          agentsProcessed: 0,
        });
      }

      // Get Gemini API key from settings
      const settingsDoc = await getDoc(doc(getDb(), 'settings', 'config'));
      const settings = settingsDoc.data();
      const geminiApiKey = settings?.geminiApiKey;

      if (!geminiApiKey) {
        return NextResponse.json(
          { error: 'Gemini API key not configured' },
          { status: 503 }
        );
      }

      const results: {
        agentId: string;
        agentName: string;
        success: boolean;
        articleId?: string;
        error?: string;
      }[] = [];

      // Process each due agent
      for (const agent of dueAgents) {
        const agentStartTime = Date.now();

        const taskId = await createScheduledTask({
          agentId: agent.id,
          agentName: agent.name,
          taskType: 'generate-article',
          status: 'running',
          scheduledFor: new Date().toISOString(),
          maxRetries: 3,
        });

        try {
          const categorySlug = agent.taskConfig?.categoryId
            ? (await getCategory(agent.taskConfig.categoryId))?.slug
            : agent.beat;

          const category = categorySlug ? await getCategoryBySlug(categorySlug) : null;
          const contentItems = await getUnprocessedItems(categorySlug, 5);

          if (contentItems.length === 0) {
            throw new Error('No content items available for article generation');
          }

          const selectedItem = contentItems[0];
          const article = await generateArticleCron(geminiApiKey, agent, category, selectedItem);

          // Persist image to Firebase Storage before saving article
          const persistedImageUrl = await persistImageToStorage(selectedItem.imageUrl || '');

          const articleData = {
            title: article.title,
            content: formatArticleContent(article.content),
            excerpt: formatExcerpt(article.content.replace(/<[^>]+>/g, ''), 200),
            slug: generateSlugCron(article.title),
            author: agent.name,
            authorId: agent.id,
            authorPhotoURL: agent.photoURL || '',
            category: category?.name || agent.beat || 'News',
            categoryColor: category?.color || '#2563eb',
            tags: article.tags || [],
            status: agent.taskConfig?.autoPublish ? 'published' : 'draft',
            publishedAt: agent.taskConfig?.autoPublish ? new Date().toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            featuredImage: persistedImageUrl,
            imageUrl: persistedImageUrl,
            isFeatured: agent.taskConfig?.isFeatured ?? false,
            isBreakingNews: agent.taskConfig?.isBreakingNews ?? false,
            breakingNewsTimestamp: agent.taskConfig?.isBreakingNews ? new Date().toISOString() : null,
            views: 0,
            sourceUrl: selectedItem.url,
            sourceItemId: selectedItem.id,
            generatedBy: 'ai-agent',
          };

          const articleRef = await addDoc(collection(getDb(), 'articles'), articleData);
          await markItemProcessed(selectedItem.id, articleRef.id);

          const generationTime = Date.now() - agentStartTime;
          await updateTaskStatus(taskId, 'completed', {
            articleId: articleRef.id,
            generationTime,
          });
          await updateAgentAfterRun(agent.id, true, generationTime);

          results.push({
            agentId: agent.id,
            agentName: agent.name,
            success: true,
            articleId: articleRef.id,
          });
        } catch (error) {
          console.error(`Error running agent ${agent.name}:`, error);
          await updateTaskStatus(taskId, 'failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          await updateAgentAfterRun(agent.id, false);
          results.push({
            agentId: agent.id,
            agentName: agent.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return NextResponse.json({
        success: true,
        agentsProcessed: results.length,
        successCount: results.filter((r) => r.success).length,
        results,
      });
    }

    // Normal GET: return status
    const dueAgents = await getDueScheduledAgents();
    const { getScheduledAgents } = await import('@/lib/aiJournalists');
    const allScheduled = await getScheduledAgents();

    return NextResponse.json({
      success: true,
      totalScheduledAgents: allScheduled.length,
      dueToRun: dueAgents.length,
      agents: allScheduled.map((a) => ({
        id: a.id,
        name: a.name,
        beat: a.beat,
        scheduleEnabled: a.schedule?.isEnabled,
        frequency: a.schedule?.frequency,
        nextRunAt: a.nextRunAt,
        lastRunAt: a.lastRunAt,
        totalArticles: a.metrics?.totalArticlesGenerated || 0,
      })),
    });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// Helper functions for cron (duplicated to avoid scope issues)
async function generateArticleCron(
  apiKey: string,
  agent: AIJournalist,
  category: Category | null,
  sourceItem: ContentItem
): Promise<{ title: string; content: string; tags: string[] }> {
  const model = 'gemini-2.0-flash';
  let prompt = `You are ${agent.name}, ${agent.title}`;
  if (agent.beat) prompt += ` covering the ${agent.beat} beat`;
  prompt += ` for the WNC Times, a local news website covering Western North Carolina.\n\n`;
  if (agent.bio) prompt += `About you: ${agent.bio}\n\n`;
  if (category?.editorialDirective) {
    prompt += `EDITORIAL DIRECTIVE for ${category.name} articles:\n${category.editorialDirective}\n\n`;
  }
  prompt += `SOURCE MATERIAL:\nTitle: ${sourceItem.title}\nSource: ${sourceItem.sourceName}\nPublished: ${new Date(sourceItem.publishedAt).toLocaleDateString()}\n`;
  if (sourceItem.description) prompt += `Summary: ${sourceItem.description}\n`;
  prompt += `URL: ${sourceItem.url}\n\n`;
  prompt += `TASK: Write a news article based on the source material above.\n\nFORMAT YOUR RESPONSE:\nTITLE: [headline]\n\nCONTENT:\n[article]\n\nTAGS: [comma-separated]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) throw new Error('No response from Gemini API');

  // Parse response
  const titleMatch = responseText.match(/TITLE:\s*(.+?)(?:\n|CONTENT:)/i);
  const title = titleMatch ? titleMatch[1].trim() : `Local Update: ${sourceItem.title}`;

  const contentMatch = responseText.match(/CONTENT:\s*([\s\S]+?)(?:TAGS:|$)/i);
  let content = '';
  if (contentMatch) {
    content = contentMatch[1].trim().split(/\n\n+/).filter((p: string) => p.trim()).map((p: string) => `<p>${p.trim()}</p>`).join('\n');
  }

  const tagsMatch = responseText.match(/TAGS:\s*(.+?)$/im);
  const tags = tagsMatch ? tagsMatch[1].split(',').map((t: string) => t.trim().toLowerCase()).filter((t: string) => t.length > 0) : [];

  return { title, content, tags };
}

function generateSlugCron(title: string): string {
  const timestamp = Date.now().toString(36);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').substring(0, 50);
  return `${slug}-${timestamp}`;
}
