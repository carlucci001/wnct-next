import Link from 'next/link';
import { getArticlesByCategory } from '@/lib/articles';
import { Article } from '@/types/article';

// Helper to format date
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  // Decode category from URL (e.g., 'Local%20News' -> 'Local News')
  const decodedCategory = decodeURIComponent(category);

  const articles = await getArticlesByCategory(decodedCategory);

  // Avoid "News News" in title
  const pageTitle = decodedCategory.toLowerCase().endsWith('news')
    ? decodedCategory
    : `${decodedCategory} News`;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <main className="container mx-auto px-4 py-8">
        <header className="mb-8 border-b border-gray-200 pb-4 dark:border-gray-700">
          <h1 className="text-3xl font-bold capitalize text-gray-900 dark:text-white">
            {pageTitle}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Latest articles in {decodedCategory}
          </p>
        </header>

        {articles.length === 0 ? (
          <div className="py-12 text-center">
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
              No articles found in this category.
            </h2>
            <Link
              href="/"
              className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-zinc-800"
              >
                {article.featuredImage && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={article.featuredImage}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase text-blue-600 dark:text-blue-400">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(article.publishedAt)}
                    </span>
                  </div>
                  <Link href={`/article/${article.slug}`}>
                    <h2 className="mb-2 text-xl font-bold leading-tight text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                      {article.title}
                    </h2>
                  </Link>
                  <p className="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-200">
                      {article.author}
                    </span>
                    <Link
                      href={`/article/${article.slug}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Read more &rarr;
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
