import Link from 'next/link';
import { getDashboardStats, getRecentArticles } from '../../lib/data';

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const recentArticles = await getRecentArticles();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="space-x-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Site
            </Link>
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              New Article
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Articles</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalArticles}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Published</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.publishedArticles}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Drafts</dt>
              <dd className="mt-1 text-3xl font-semibold text-yellow-600">{stats.draftArticles}</dd>
            </div>
          </div>
        </div>

        {/* Recent Articles */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Articles</h3>
          </div>
          <ul role="list" className="divide-y divide-gray-200">
            {recentArticles.length > 0 ? (
              recentArticles.map((article) => (
                <li key={article.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <div className="flex text-sm">
                        <p className="font-medium text-indigo-600 truncate">{article.title}</p>
                        <p className="ml-1 flex-shrink-0 font-normal text-gray-500">in {article.category}</p>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <p>
                            {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : 'No date'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          article.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : article.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {article.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No articles found.</li>
            )}
          </ul>
          <div className="bg-gray-50 px-4 py-4 sm:px-6 rounded-b-lg">
            <div className="text-sm">
              <Link href="/admin/articles" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all articles<span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
