import { Metadata } from 'next';
import { getArticleBySlug } from '@/lib/articles';
import ArticleClient from './ArticleClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found | WNC Times',
    };
  }

  const title = `${article.title} | WNC Times`;
  // Use auto-generated metaDescription if available, otherwise fall back to excerpt
  const description = article.metaDescription || article.excerpt || article.content?.substring(0, 160).replace(/<[^>]+>/g, '') || '';
  const imageUrl = article.featuredImage || article.imageUrl || 'https://wnctimes.com/placeholder.jpg';
  // Use auto-generated imageAltText if available
  const imageAlt = article.imageAltText || article.title;
  // Combine keywords and tags for better SEO coverage
  const allKeywords = [...(article.keywords || []), ...(article.tags || [])];

  return {
    title,
    description,
    keywords: allKeywords.length > 0 ? allKeywords.join(', ') : undefined,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://wnctimes.com/article/${slug}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
      publishedTime: article.publishedAt || article.createdAt,
      authors: [article.author || 'WNC Times Staff'],
      section: article.category,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `https://wnctimes.com/article/${slug}`,
    },
    other: {
      // GEO metadata for local SEO
      ...(article.geoTags && article.geoTags.length > 0 && {
        'geo.region': 'US-NC',
        'geo.placename': article.geoTags[0],
      }),
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  // Use pre-generated schema if available, otherwise build default
  let jsonLd = null;
  if (article) {
    if (article.schema) {
      // Use AI-generated schema (stored as JSON string)
      try {
        jsonLd = JSON.parse(article.schema);
        // Ensure image URL is current
        jsonLd.image = article.featuredImage || article.imageUrl || 'https://wnctimes.com/placeholder.jpg';
      } catch {
        // Fall back to default if schema parsing fails
        jsonLd = null;
      }
    }

    // Default schema if no pre-generated schema or parsing failed
    if (!jsonLd) {
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        'headline': article.title,
        'description': article.metaDescription || article.excerpt,
        'image': article.featuredImage || article.imageUrl || 'https://wnctimes.com/placeholder.jpg',
        'datePublished': article.publishedAt || article.createdAt,
        'dateModified': article.updatedAt || article.publishedAt || article.createdAt,
        'keywords': article.keywords?.join(', ') || article.tags?.join(', '),
        'author': [{
          '@type': 'Person',
          'name': article.author || 'WNC Times Staff',
          'url': 'https://wnctimes.com'
        }],
        'publisher': {
          '@type': 'Organization',
          'name': 'WNC Times',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://wnctimes.com/favicon.ico'
          }
        },
        'articleSection': article.category,
        // Add location data for local SEO
        ...(article.geoTags && article.geoTags.length > 0 && {
          'contentLocation': {
            '@type': 'Place',
            'name': article.geoTags.join(', ')
          }
        })
      };
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ArticleClient slug={slug} />
    </>
  );
}