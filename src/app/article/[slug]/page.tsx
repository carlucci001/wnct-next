import { notFound } from 'next/navigation';
import { getArticleBySlug } from '@/lib/articles';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
             &larr; Back to Home
          </Link>
        </div>

        <article>
          <header className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{article.category}</span>
              <span>&bull;</span>
              <time dateTime={article.publishedAt || article.createdAt}>{article.publishedAt || article.createdAt}</time>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{article.title}</h1>

            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <span className="font-medium">By {article.author}</span>
            </div>
          </header>

          {article.featuredImage && (
            <div className="mb-8 w-full h-64 sm:h-96 relative overflow-hidden rounded-lg">
              {/* Using img tag to avoid domain configuration issues with Next.js Image component for unknown sources */}
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div
            className="space-y-4 leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>
      </div>
    </div>
  );
}
