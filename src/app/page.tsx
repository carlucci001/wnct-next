import { getArticles } from '../lib/articles';
import ArticleCard from '../components/ArticleCard';

// Revalidate every hour
export const revalidate = 3600;

export default async function Home() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl">
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            WNC Times
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Western North Carolina Times - Latest News
          </p>
        </header>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
           <div className="flex flex-col items-center justify-center py-12">
             <p className="text-lg text-gray-500 dark:text-gray-400">No articles found at the moment.</p>
             <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Please check back later.</p>
           </div>
        )}
      </main>
    </div>
  );
}
