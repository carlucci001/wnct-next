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
  const description = article.excerpt || article.content?.substring(0, 160).replace(/<[^>]+>/g, '') || '';
  const imageUrl = article.featuredImage || article.imageUrl || 'https://wnctimes.com/placeholder.jpg';

  return {
    title,
    description,
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
          alt: article.title,
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
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  // Structured Data (JSON-LD) for NewsArticle
  const jsonLd = article ? {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': article.title,
    'description': article.excerpt,
    'image': article.featuredImage || article.imageUrl || 'https://wnctimes.com/placeholder.jpg',
    'datePublished': article.publishedAt || article.createdAt,
    'dateModified': article.updatedAt || article.publishedAt || article.createdAt,
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
    }
  } : null;

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