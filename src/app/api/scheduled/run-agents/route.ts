import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { getDueScheduledAgents, getAIJournalist } from '@/lib/aiJournalists';
import { updateAgentAfterRun } from '@/lib/aiJournalists.server';
import { getCategoryBySlug, getCategory } from '@/lib/categories';
import { getUnprocessedItems } from '@/lib/contentSources';
import { markItemProcessed } from '@/lib/contentSources.server';
import { createScheduledTask, updateTaskStatus } from '@/lib/scheduledTasks.server';
import { formatArticleContent, formatExcerpt } from '@/lib/articles';
import { AIJournalist } from '@/types/aiJournalist';
import { Category } from '@/types/category';
import { searchWithPerplexity, PerplexitySearchResult } from '@/lib/perplexitySearch';
import { initializeArticleCosts, addCost, API_PRICING } from '@/lib/costs';

export const dynamic = 'force-dynamic';
import { ContentItem } from '@/types/contentSource';

/**
 * Generate intelligent search query based on agent's beat and location
 */
function generateSearchQuery(beat: string, agentName: string): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Base location (could be made configurable per agent)
  const location = 'Western North Carolina';

  // Customize query based on beat
  const beatQueries: Record<string, string> = {
    'news': `latest breaking news in ${location} today ${today}`,
    'local': `local ${location} news and community stories ${today}`,
    'sports': `${location} sports news and high school athletics ${today}`,
    'business': `${location} business news, economic development, and local commerce ${today}`,
    'politics': `${location} politics, government decisions, and policy news ${today}`,
    'education': `${location} schools, colleges, and education news ${today}`,
    'weather': `${location} weather forecast, severe weather alerts ${today}`,
    'arts': `${location} arts, culture, and entertainment events ${today}`,
    'health': `${location} health care, medical news, and wellness ${today}`,
    'environment': `${location} environmental news, conservation, outdoor recreation ${today}`,
  };

  return beatQueries[beat.toLowerCase()] || `${location} ${beat} news ${today}`;
}

/**
 * Generate article image using hybrid strategy: Stock photos first, then AI
 * This ensures we use high-quality, relevant images while avoiding copyrighted news photos
 */
async function generateArticleImage(
  title: string,
  content: string,
  category: string | undefined,
  openaiApiKey: string,
  geminiApiKey: string,
  settings: Record<string, unknown> | undefined
): Promise<{ url: string; attribution?: string; method: string }> {
  // STEP 1: Try stock photos first (Unsplash → Pexels)
  try {
    const { extractPhotoKeywords, findStockPhoto } = await import('@/lib/stockPhotos');
    const keywords = extractPhotoKeywords(title, content, category);
    console.log(`[Image] Searching stock photos for: "${keywords}"`);

    const pexelsApiKey = settings?.pexelsApiKey as string;
    const stockPhoto = await findStockPhoto(keywords, category, pexelsApiKey);
    if (stockPhoto) {
      console.log(`[Image] ✓ Using ${stockPhoto.source} photo by ${stockPhoto.photographer}`);

      // Persist stock photo to Firebase Storage
      const { storageService } = await import('@/lib/storage');
      const persistedUrl = await storageService.uploadAssetFromUrl(stockPhoto.url);

      return {
        url: persistedUrl,
        attribution: stockPhoto.attribution,
        method: stockPhoto.source
      };
    }
  } catch (error) {
    console.error('[Image] Stock photo search failed:', error);
  }

  // STEP 2: Fall back to AI generation with improved prompts
  if (!openaiApiKey) {
    console.log('[Image] No OpenAI API key - cannot generate AI image');
    return { url: '', method: 'none' };
  }

  try {
    console.log('[Image] No stock photos found, generating with DALL-E');

    // Extract visual elements from article
    let visualElements: string | null = null;
    if (geminiApiKey && content) {
      const { extractVisualElements } = await import('@/lib/imageGeneration');
      visualElements = await extractVisualElements(title, content, category || 'news', geminiApiKey);
      if (visualElements) {
        console.log(`[Image] Visual elements extracted: ${visualElements.substring(0, 100)}`);
      }
    }

    // Build detailed prompt
    const { buildDetailedImagePrompt } = await import('@/lib/imageGeneration');
    const imagePrompt = buildDetailedImagePrompt(title, visualElements || undefined, category);

    console.log('[Image] Generating with improved prompt...');

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imagePrompt.substring(0, 1000),
        n: 1,
        size: (settings?.dalleSize as string) || '1792x1024',
        quality: (settings?.dalleQuality as string) || 'hd',
        style: (settings?.dalleStyle as string) || 'natural'
      })
    });

    const data = await response.json();
    const tempImageUrl = data.data?.[0]?.url;

    if (!tempImageUrl) {
      console.error('[Image] DALL-E returned no image:', data.error?.message);
      return { url: '', method: 'failed' };
    }

    // Persist to Firebase Storage
    const { storageService } = await import('@/lib/storage');
    const persistedUrl = await storageService.uploadAssetFromUrl(tempImageUrl);

    console.log('[Image] ✓ AI image generated and persisted');
    return {
      url: persistedUrl,
      attribution: 'AI-generated image',
      method: 'dall-e'
    };
  } catch (error) {
    console.error('[Image] Failed to generate AI image:', error);
    return { url: '', method: 'error' };
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
    const { agentId, force, preview } = body; // Optional: run specific agent, force run, or preview mode

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

        let selectedItem: ContentItem;
        let isWebSearchGenerated = false;

        // PRIMARY SOURCE SELECTION: Web search if enabled, otherwise RSS
        if (agent.useWebSearch) {
          // WEB SEARCH PRIMARY MODE: Skip RSS entirely, use Perplexity to find current news
          console.log(`[${agent.name}] Web search mode enabled - using Perplexity as primary source (skipping RSS)`);

          const perplexityApiKey = settings?.perplexityApiKey as string;
          if (!perplexityApiKey) {
            throw new Error('Web search mode enabled but Perplexity API key not configured');
          }

          // Generate search query based on agent's beat and location
          const searchQuery = generateSearchQuery(agent.beat, agent.name);
          console.log(`[${agent.name}] Web search query: "${searchQuery}"`);

          // Build search instruction - incorporate category editorial directive if available
          let searchInstruction = 'Find the most newsworthy and current story to report on';
          if (category?.editorialDirective) {
            searchInstruction = `Find the most newsworthy and current story to report on. ${category.editorialDirective}`;
            console.log(`[${agent.name}] Using editorial directive: "${category.editorialDirective}"`);
          }

          // Search for current news
          const searchResults = await searchWithPerplexity(
            searchQuery,
            searchInstruction,
            perplexityApiKey
          );

          // Strip citation markers [1], [2], etc. from Perplexity response
          const cleanAnswer = (searchResults.answer || '').replace(/\[\d+\]/g, '').trim();

          // Create content item from web search results
          selectedItem = {
            id: `web-search-${Date.now()}`,
            title: `Breaking: ${agent.beat.charAt(0).toUpperCase() + agent.beat.slice(1)} News in Western North Carolina`,
            description: cleanAnswer.substring(0, 200) || 'Current news report.',
            url: searchResults.citations?.[0] || '',
            sourceName: 'News Reports',
            sourceUrl: searchResults.citations?.[0] || '',
            category: categorySlug || agent.beat,
            publishedAt: new Date().toISOString(),
            fetchedAt: new Date().toISOString(),
            isProcessed: false,
            fullContent: cleanAnswer,
          };

          isWebSearchGenerated = true;
          console.log(`[${agent.name}] Created article from web search: "${selectedItem.title}"`);

        } else {
          // RSS MODE: Traditional RSS feed approach
          console.log(`[${agent.name}] RSS mode - checking for unprocessed content items`);
          const contentItems = await getUnprocessedItems(categorySlug, 5);

          if (contentItems.length === 0) {
            throw new Error('No RSS content items available and web search is disabled');
          }

          selectedItem = contentItems[0];
          console.log(`[${agent.name}] Using RSS item: "${selectedItem.title}"`);

          // Try to fetch full article content if enabled
          if (agent.useFullArticleContent && selectedItem.url && !selectedItem.fullContent) {
            try {
              console.log(`[${agent.name}] Fetching full article content from ${selectedItem.url}`);
              const { fetchFullArticle } = await import('@/lib/contentSources');
              const fullContent = await fetchFullArticle(selectedItem.url);
              if (fullContent) {
                selectedItem.fullContent = fullContent;
                console.log(`[${agent.name}] Full article content fetched: ${fullContent.length} characters`);
              } else {
                console.log(`[${agent.name}] Could not extract full content, will use description only`);
              }
            } catch (error) {
              console.error(`[${agent.name}] Failed to fetch full content:`, error);
            }
          }
        }

        // Optional: Perform web search verification (ONLY for RSS mode, not for web search primary mode)
        let webSearchResults: PerplexitySearchResult | undefined;
        if (agent.useWebSearch && !isWebSearchGenerated) {
          try {
            console.log(`[${agent.name}] Web search enabled - fetching current information via Perplexity`);
            const perplexityApiKey = settings?.perplexityApiKey as string;

            if (perplexityApiKey) {
              const searchQuery = `Latest information about: ${selectedItem.title}`;
              webSearchResults = await searchWithPerplexity(
                searchQuery,
                selectedItem.description,
                perplexityApiKey
              );
              console.log(`[${agent.name}] Web search completed - confidence: ${webSearchResults.confidence}`);
            } else {
              console.log(`[${agent.name}] Web search enabled but Perplexity API key not configured`);
            }
          } catch (error) {
            console.error(`[${agent.name}] Web search failed, proceeding without current info:`, error);
          }
        } else {
          console.log(`[${agent.name}] Web search disabled - using Gemini-only approach`);
        }

        // MANDATORY SAFETY CHECKS for auto-published articles
        if (agent.taskConfig?.autoPublish) {
          if (!agent.useFullArticleContent) {
            throw new Error(`[${agent.name}] BLOCKED: Auto-publish requires useFullArticleContent=true`);
          }
          if (!agent.useWebSearch) {
            console.warn(`[${agent.name}] WARNING: Auto-publish without web search - accuracy may be reduced`);
          }
        }

        // Validate source material quality
        const validation = validateSourceMaterial(selectedItem, agent.name);

        if (!validation.valid) {
          console.error(`[${agent.name}] ${validation.reason}`);
          throw new Error(`Source validation failed: ${validation.reason}`);
        }

        console.log(`[${agent.name}] Source material validated: ${validation.wordCount} words available`);

        // Generate article using Gemini (with optional web search results)
        const article = await generateArticle(
          geminiApiKey,
          agent,
          category,
          selectedItem,
          webSearchResults
        );

        // Generate article image using hybrid strategy (stock photos → AI)
        const openaiApiKey = settings?.openaiApiKey as string;
        const imageResult = await generateArticleImage(
          article.title,
          article.content,
          category?.name,
          openaiApiKey,
          geminiApiKey,
          settings
        );

        // MANDATORY fact-check for auto-published articles
        let factCheckResult = null;

        if (agent.taskConfig?.autoPublish) {
          console.log(`[${agent.name}] Running mandatory fact-check before publication...`);

          try {
            // Use request origin to construct proper URL (works in both local and production)
            const baseUrl = new URL(request.url).origin;
            const factCheckResponse = await fetch(
              `${baseUrl}/api/fact-check`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  mode: 'quick',
                  title: article.title,
                  content: article.content,
                  sourceTitle: selectedItem.title,
                  sourceSummary: selectedItem.description,
                  sourceUrl: selectedItem.url,
                }),
              }
            );

            if (factCheckResponse.ok) {
              factCheckResult = await factCheckResponse.json();

              // BLOCK publication if high-risk
              if (factCheckResult.status === 'high_risk') {
                console.error(`[${agent.name}] BLOCKED: High-risk fact-check - ${factCheckResult.summary}`);
                throw new Error(`Article blocked due to high-risk fact-check: ${factCheckResult.summary}`);
              }

              // FORCE DRAFT if caution or review recommended (unless autopilot mode with high confidence)
              if (factCheckResult.status === 'caution' ||
                  factCheckResult.status === 'review_recommended') {

                // Check if autopilot mode is enabled with confidence threshold
                if (agent.taskConfig?.autopilotMode) {
                  const threshold = agent.taskConfig.autopilotConfidenceThreshold || 70;

                  if (factCheckResult.confidence >= threshold) {
                    console.log(`[${agent.name}] ✈️ AUTOPILOT: Publishing despite ${factCheckResult.status} status (confidence ${factCheckResult.confidence}% >= threshold ${threshold}%)`);
                    // Keep autoPublish=true, continue to publication

                  } else {
                    console.log(`[${agent.name}] ⚠️ AUTOPILOT: Confidence too low (${factCheckResult.confidence}% < ${threshold}%) - saving as DRAFT for review`);
                    agent.taskConfig.autoPublish = false; // Force draft
                  }
                } else {
                  // Standard mode - force draft (current behavior)
                  console.log(`[${agent.name}] Fact-check flagged issues - forcing DRAFT status`);
                  agent.taskConfig.autoPublish = false;
                }
              }

              console.log(`[${agent.name}] Fact-check: ${factCheckResult.status} (confidence: ${factCheckResult.confidence}%)`);

            } else {
              console.error(`[${agent.name}] Fact-check API failed - forcing DRAFT mode for safety`);
              agent.taskConfig.autoPublish = false;
            }
          } catch (fcError) {
            console.error(`[${agent.name}] Fact-check error - forcing DRAFT mode for safety:`, fcError);
            agent.taskConfig.autoPublish = false;
          }
        }

        // Prepare article data
        const formattedContent = formatArticleContent(article.content);
        const articleData = {
          title: article.title,
          content: formattedContent,
          excerpt: formatExcerpt(article.content.replace(/<[^>]+>/g, ''), 200),
          slug: generateSlug(article.title),
          author: agent.name,
          authorId: agent.id,
          authorPhotoURL: agent.photoURL || '',
          category: category?.name || agent.beat || 'News',
          categoryId: category?.id || '',
          categoryColor: category?.color || '#2563eb',
          tags: article.tags || [],
          status: agent.taskConfig?.autoPublish ? 'published' : 'draft',
          publishedAt: agent.taskConfig?.autoPublish ? new Date().toISOString() : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          featuredImage: imageResult.url,
          imageUrl: imageResult.url,
          imageAttribution: imageResult.attribution || null,
          isFeatured: agent.taskConfig?.isFeatured ?? false,
          isBreakingNews: agent.taskConfig?.isBreakingNews ?? false,
          breakingNewsTimestamp: agent.taskConfig?.isBreakingNews ? new Date().toISOString() : null,
          views: 0,
          // Source tracking
          sourceUrl: selectedItem.url,
          sourceTitle: selectedItem.title,
          sourceSummary: selectedItem.description,
          sourceItemId: selectedItem.id,
          generatedBy: 'ai-agent',
          // Fact-check results (explicit null checks to prevent undefined values)
          factCheckStatus: (factCheckResult?.status) ? factCheckResult.status : null,
          factCheckSummary: (factCheckResult?.summary) ? factCheckResult.summary : null,
          factCheckConfidence: (factCheckResult?.confidence !== undefined) ? factCheckResult.confidence : null,
          factCheckedAt: factCheckResult ? new Date().toISOString() : null,
          // A/B Testing metadata
          metadata: {
            usedWebSearch: agent.useWebSearch || false,
            usedFullContent: !!selectedItem.fullContent,
            generationApproach: agent.useWebSearch ? 'perplexity+gemini' : 'gemini-only',
            imageMethod: imageResult.method,
            // Quality metrics
            sourceWordCount: validation.wordCount,
            articleWordCount: article.content.split(/\s+/).length,
            expansionRatio: article.content.split(/\s+/).length / validation.wordCount,
            // Fact-check integration
            wasAutoPublished: agent.taskConfig?.autoPublish || false,
            blockedByFactCheck: factCheckResult?.status === 'high_risk',
            // Autopilot tracking
            autopilotMode: agent.taskConfig?.autopilotMode || false,
            autopilotOverride: agent.taskConfig?.autopilotMode &&
                               (factCheckResult?.status === 'caution' || factCheckResult?.status === 'review_recommended') &&
                               (factCheckResult?.confidence >= (agent.taskConfig?.autopilotConfidenceThreshold || 70)),
          },
          // Cost tracking
          generationCosts: (() => {
            let costs = initializeArticleCosts();

            // Article generation cost (Gemini)
            costs = addCost(costs, 'articleGeneration', API_PRICING.GEMINI_ARTICLE_GENERATION);

            // Perplexity web search cost (if used)
            if (webSearchResults) {
              costs = addCost(costs, 'other', API_PRICING.PERPLEXITY_SEARCH, 'Perplexity Web Search');
            }

            // Image generation cost
            if (imageResult.method === 'ai') {
              costs = addCost(costs, 'imageGeneration', API_PRICING.DALLE_3_STANDARD);
            } else if (imageResult.method === 'stock') {
              costs = addCost(costs, 'stockPhotoSearch', 0);
            }

            // Fact-check cost
            if (factCheckResult) {
              costs = addCost(costs, 'factCheck', API_PRICING.GEMINI_FACT_CHECK_QUICK);
            }

            return costs;
          })(),
        };

        // PREVIEW MODE: Run fact-check and return data without saving
        if (preview) {
          // Run quick fact-check
          let factCheckResult = null;
          try {
            const factCheckResponse = await fetch(new URL('/api/fact-check', request.url).toString(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mode: 'quick',
                title: article.title,
                content: formattedContent,
                sourceTitle: selectedItem.title,
                sourceSummary: selectedItem.description,
                sourceUrl: selectedItem.url,
              }),
            });
            if (factCheckResponse.ok) {
              factCheckResult = await factCheckResponse.json();
            }
          } catch (fcError) {
            console.error('Fact-check failed:', fcError);
          }

          // Return preview data without saving (don't update task status for previews)
          return NextResponse.json({
            success: true,
            preview: true,
            article: articleData,
            factCheck: factCheckResult,
            sourceItem: {
              id: selectedItem.id,
              title: selectedItem.title,
              description: selectedItem.description,
              url: selectedItem.url,
            },
            agent: {
              id: agent.id,
              name: agent.name,
              photoURL: agent.photoURL,
            },
          });
        }

        // DUPLICATE DETECTION: Check if article with same title already exists
        const { getAdminFirestore } = await import('@/lib/firebase-admin');
        const db = getAdminFirestore();

        // Query for articles with the exact same title
        const duplicateCheck = await db.collection('articles')
          .where('title', '==', article.title)
          .limit(1)
          .get();

        if (!duplicateCheck.empty) {
          const existingArticle = duplicateCheck.docs[0];
          console.log(`[${agent.name}] ⚠️ DUPLICATE DETECTED: Article with title "${article.title}" already exists (ID: ${existingArticle.id})`);

          // Update task status
          await updateTaskStatus(taskId, 'completed', {
            articleId: existingArticle.id,
            wasDuplicate: true,
            generationTime: Date.now() - agentStartTime,
          });

          // Update agent metrics (count as success but note duplicate)
          await updateAgentAfterRun(agent.id, true, Date.now() - agentStartTime);

          results.push({
            agentId: agent.id,
            agentName: agent.name,
            success: true,
            articleId: existingArticle.id,
            status: 'duplicate',
            message: `Skipped duplicate article: "${article.title}"`,
          });

          console.log(`[${agent.name}] ✅ Skipped duplicate article, returning existing article ID`);
          continue; // Skip to next agent
        }

        // NORMAL MODE: Save article to Firestore using Admin SDK (bypasses auth requirements)
        const articleRef = await db.collection('articles').add(articleData);

        // Mark content item as processed (skip for web-search-generated items)
        if (!isWebSearchGenerated) {
          await markItemProcessed(selectedItem.id, articleRef.id);
        }

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
 * Validate that source material is sufficient for article generation
 */
function validateSourceMaterial(
  sourceItem: ContentItem,
  agentName: string
): { valid: boolean; reason?: string; wordCount: number } {

  // Calculate total available content
  const sourceText = [
    sourceItem.title || '',
    sourceItem.description || '',
    sourceItem.fullContent || ''
  ].join(' ');

  const wordCount = sourceText.trim().split(/\s+/).filter(w => w.length > 0).length;

  // MINIMUM: 100 words for ANY generation
  if (wordCount < 100) {
    return {
      valid: false,
      reason: `Insufficient source material (${wordCount} words, need 100+ minimum)`,
      wordCount
    };
  }

  // RECOMMENDED: 300+ words for quality articles
  if (wordCount < 300) {
    console.warn(`[${agentName}] Low source material (${wordCount} words) - article may be brief`);
  }

  return { valid: true, wordCount };
}

/**
 * Generate an article using Gemini AI
 */
async function generateArticle(
  apiKey: string,
  agent: AIJournalist,
  category: Category | null,
  sourceItem: ContentItem,
  webSearchResults?: PerplexitySearchResult
): Promise<{ title: string; content: string; tags: string[] }> {
  const model = 'gemini-2.0-flash';

  // Build the prompt with category directive, source material, and optional web search results
  const prompt = buildArticlePrompt(agent, category, sourceItem, webSearchResults);

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
          temperature: 0.1,  // PHASE 2: Further lowered from 0.3 to 0.1 for maximum factual accuracy
          topP: 0.8,         // Limit token sampling diversity
          topK: 20,          // Further constrain output choices
        },
        systemInstruction: {
          parts: [{
            text: "You are a factual news writing assistant. You NEVER fabricate information. You ONLY write about facts explicitly stated in provided sources. You MUST attribute every claim to sources. If information is missing, you acknowledge gaps rather than inventing details. Accuracy is more important than article length. You follow AP style guidelines strictly."
          }]
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
 * Build the prompt for article generation with anti-hallucination rules
 */
function buildArticlePrompt(
  agent: AIJournalist,
  category: Category | null,
  sourceItem: ContentItem,
  webSearchResults?: PerplexitySearchResult
): string {
  let prompt = `You are ${agent.name}, ${agent.title}`;

  if (agent.beat) {
    prompt += ` covering the ${agent.beat} beat`;
  }

  prompt += ` for WNC Times.\n\n`;

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

  // Include full content if available
  if (sourceItem.fullContent) {
    prompt += `\nFull Article Content:\n${sourceItem.fullContent.substring(0, 3000)}\n`;
  }

  prompt += `\nSource URL: ${sourceItem.url}\n`;

  // Add web search results if available (for RSS verification mode only)
  if (webSearchResults) {
    prompt += `\nADDITIONAL VERIFIED INFORMATION:\n${webSearchResults.answer}\n`;
    if (webSearchResults.citations.length > 0) {
      prompt += `\nAdditional sources for verification:\n${webSearchResults.citations.join('\n')}\n`;
    }
  }

  prompt += `\n
MANDATORY ANTI-FABRICATION PROTOCOL (PHASE 2 ENHANCED):

You MUST follow these HARD CONSTRAINTS (violations will block publication):

1. SOURCE-ONLY FACTS:
   - You can ONLY state facts that appear in the source material above${webSearchResults ? ' or verified web search results' : ''}
   - If a detail is not explicitly in the source, you CANNOT mention it
   - Do not expand, infer, or assume anything beyond what's written
   - EVERY sentence must be traceable to source material

2. ATTRIBUTION REQUIREMENTS:
   ${sourceItem.sourceName === 'News Reports'
     ? `- Write in professional journalistic style WITHOUT forced attribution phrases
   - DO NOT write "According to sources" or "sources say" - write directly and naturally
   - Present facts as reported news, using active voice and clear statements
   - Attribution is IMPLIED through professional news writing style
   - Example: "A major winter storm warning was issued for..." NOT "According to reports, a major winter storm..."`
     : `- EVERY paragraph must include source attribution
   - Use: "According to ${sourceItem.sourceName}..."
   - Or: "As reported by ${sourceItem.sourceName}..."
   - Or: "${sourceItem.sourceName} reports that..."
   - Minimum: One clear attribution per paragraph`}

3. STRICTLY PROHIBITED:
   - ❌ Adding names not in source
   - ❌ Adding job titles/positions not in source
   - ❌ Creating or paraphrasing quotes not in source
   - ❌ Inventing statistics, numbers, or data
   - ❌ Making predictions or speculation
   - ❌ Adding background information not in source
   - ❌ Assuming current events or context not mentioned in source

4. LENGTH CONSTRAINT:
   - Write ONLY what the source supports
   - Target 3-5 paragraphs (300-500 words)
   - If source is brief (under 200 words), write 2-3 paragraphs maximum
   - DO NOT pad with filler or unsupported background

5. WHEN INFORMATION IS MISSING:
   - If source lacks critical details (who, what, when, where), ACKNOWLEDGE IT
   - Use: "Details about [X] were not provided in the report"
   - Use: "Further information was not available"
   - It is BETTER to admit gaps than to fabricate

6. VERIFICATION STATUS:
${webSearchResults
  ? `   - You have VERIFIED CURRENT INFORMATION from web search
   - Cross-reference against web search results
   - If conflict exists, DEFER to web search citations
   - Include web search citations: "according to recent reports..."`
  : `   - You DO NOT have real-time verification
   - You CANNOT verify current information
   - Stick strictly to source material provided
   - Do not reference current events or recent context`}

TASK: Write a factual news article based STRICTLY on the source material above${webSearchResults ? ' and verified web search results' : ''}.

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

TITLE: [Factual, compelling headline directly from source material]

CONTENT:
${sourceItem.sourceName === 'News Reports'
  ? `[First paragraph - Strong lead with the most important facts, written in active voice]

[Second paragraph - Supporting details and context from source material]

[Additional paragraphs ONLY if source material supports them]`
  : `[First paragraph - MUST start with "According to ${sourceItem.sourceName}..." or similar attribution]

[Second paragraph - continue with source attribution]

[Additional paragraphs ONLY if source material supports them - each with attribution]`}

TAGS: [keywords extracted from source only]

Article Requirements:
- 3-5 paragraphs (or 2-3 if source is brief)
- Professional journalistic tone appropriate for local news
- Include relevant local context ONLY if mentioned in sources
${sourceItem.sourceName === 'News Reports'
  ? `- Write in active, engaging news style WITHOUT repetitive attribution phrases
- Present facts directly and confidently as verified reporting
- Use varied sentence structures and natural transitions`
  : `- Attribute ALL facts to sources (mandatory in every paragraph)
- Cite the original source for all claims`}
- Use direct quotes ONLY if they appear verbatim in source material
- When in doubt, stick to what's verifiable - accuracy over length`;

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

          let selectedItem: ContentItem;
          let isWebSearchGenerated = false;

          // PRIMARY SOURCE SELECTION: Web search if enabled, otherwise RSS
          if (agent.useWebSearch) {
            // WEB SEARCH PRIMARY MODE: Skip RSS entirely, use Perplexity to find current news
            console.log(`[Cron][${agent.name}] Web search mode enabled - using Perplexity as primary source (skipping RSS)`);

            const perplexityApiKey = settings?.perplexityApiKey as string;
            if (!perplexityApiKey) {
              throw new Error('Web search mode enabled but Perplexity API key not configured');
            }

            // Generate search query based on agent's beat and location
            const searchQuery = generateSearchQuery(agent.beat, agent.name);
            console.log(`[Cron][${agent.name}] Web search query: "${searchQuery}"`);

            // Build search instruction - incorporate category editorial directive if available
            let searchInstruction = 'Find the most newsworthy and current story to report on';
            if (category?.editorialDirective) {
              searchInstruction = `Find the most newsworthy and current story to report on. ${category.editorialDirective}`;
              console.log(`[Cron][${agent.name}] Using editorial directive: "${category.editorialDirective}"`);
            }

            // Search for current news
            const searchResults = await searchWithPerplexity(
              searchQuery,
              searchInstruction,
              perplexityApiKey
            );

            // Create content item from web search results
            selectedItem = {
              id: `web-search-${Date.now()}`,
              title: `Breaking: ${agent.beat.charAt(0).toUpperCase() + agent.beat.slice(1)} News in Western North Carolina`,
              description: searchResults.answer?.substring(0, 200) || 'Current news report.',
              url: searchResults.citations?.[0] || '',
              sourceName: 'News Reports',
              sourceUrl: searchResults.citations?.[0] || '',
              category: categorySlug || agent.beat,
              publishedAt: new Date().toISOString(),
              fetchedAt: new Date().toISOString(),
              isProcessed: false,
              fullContent: searchResults.answer || '',
            };

            isWebSearchGenerated = true;
            console.log(`[Cron][${agent.name}] Created article from web search: "${selectedItem.title}"`);

          } else {
            // RSS MODE: Traditional RSS feed approach
            console.log(`[Cron][${agent.name}] RSS mode - checking for unprocessed content items`);
            const contentItems = await getUnprocessedItems(categorySlug, 5);

            if (contentItems.length === 0) {
              throw new Error('No RSS content items available and web search is disabled');
            }

            selectedItem = contentItems[0];
            console.log(`[Cron][${agent.name}] Using RSS item: "${selectedItem.title}"`);
          }

          // Optional: Perform web search verification (ONLY for RSS mode, not for web search primary mode)
          let webSearchResults: PerplexitySearchResult | undefined;
          if (agent.useWebSearch && !isWebSearchGenerated) {
            try {
              console.log(`[Cron][${agent.name}] Web search enabled - fetching current information via Perplexity`);
              const perplexityApiKey = settings?.perplexityApiKey as string;

              if (perplexityApiKey) {
                const searchQuery = `Latest information about: ${selectedItem.title}`;
                webSearchResults = await searchWithPerplexity(
                  searchQuery,
                  selectedItem.description,
                  perplexityApiKey
                );
                console.log(`[Cron][${agent.name}] Web search completed - confidence: ${webSearchResults.confidence}`);
              } else {
                console.log(`[Cron][${agent.name}] Web search enabled but Perplexity API key not configured`);
              }
            } catch (error) {
              console.error(`[Cron][${agent.name}] Web search failed, proceeding without current info:`, error);
            }
          }

          const article = await generateArticle(geminiApiKey, agent, category, selectedItem, webSearchResults);

          // Generate AI image using DALL-E (never use copyrighted RSS feed images)
          const openaiApiKey = settings?.openaiApiKey as string;
          const persistedImageUrl = await generateAIImage(openaiApiKey, article.title, settings);

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
            sourceUrl: selectedItem.url,
            sourceItemId: selectedItem.id,
            generatedBy: 'ai-agent',
            // A/B Testing metadata
            metadata: {
              usedWebSearch: agent.useWebSearch || false,
              usedFullContent: !!selectedItem.fullContent,
              generationApproach: agent.useWebSearch ? 'perplexity+gemini' : 'gemini-only',
            },
            // Cost tracking
            generationCosts: (() => {
              let costs = initializeArticleCosts();

              // Article generation cost (Gemini)
              costs = addCost(costs, 'articleGeneration', API_PRICING.GEMINI_ARTICLE_GENERATION);

              // Perplexity web search cost (if used)
              if (webSearchResults) {
                costs = addCost(costs, 'other', API_PRICING.PERPLEXITY_SEARCH, 'Perplexity Web Search');
              }

              // Image generation cost (AI only in cron mode)
              if (persistedImageUrl) {
                costs = addCost(costs, 'imageGeneration', API_PRICING.DALLE_3_STANDARD);
              }

              return costs;
            })(),
          };

          // Use Admin SDK for server-side operations (bypasses auth requirements)
          // Dynamic import to avoid bundling Admin SDK in client code
          const { getAdminFirestore } = await import('@/lib/firebase-admin');
          const articleRef = await getAdminFirestore().collection('articles').add(articleData);

          // Mark content item as processed (skip for web-search-generated items)
          if (!isWebSearchGenerated) {
            await markItemProcessed(selectedItem.id, articleRef.id);
          }

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

// Note: The generateArticleCron function has been removed since we now use the main
// generateArticle function with web search support for both POST and cron paths
