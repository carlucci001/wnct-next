'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, X, UserCheck } from 'lucide-react';
import { Article, ArticleStatus } from '@/types/article';
import { getAllArticles, deleteArticle, batchFormatArticles, batchAssignArticlesToUser } from '@/lib/articles';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ArticleStatus | 'all'>('all');

  // Format all articles state
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatProgress, setFormatProgress] = useState({ current: 0, total: 0, message: '' });
  const [showFormatModal, setShowFormatModal] = useState(false);

  // Assign articles state
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignProgress, setAssignProgress] = useState({ current: 0, total: 0, message: '' });
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const data = await getAllArticles();
      setArticles(data);
      setError(null);
    } catch (err) {
      setError('Failed to load articles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await deleteArticle(id);
      setArticles(articles.filter(article => article.id !== id));
    } catch (err) {
      alert('Failed to delete article');
      console.error(err);
    }
  };

  const handleFormatAllArticles = async () => {
    if (!window.confirm(
      'This will format and clean up ALL articles in the database.\n\n' +
      '• Remove empty paragraphs and divs\n' +
      '• Clean up excessive line breaks\n' +
      '• Remove garbage styling from pasted content\n' +
      '• Normalize excerpts\n\n' +
      'Continue?'
    )) {
      return;
    }

    setShowFormatModal(true);
    setIsFormatting(true);
    setFormatProgress({ current: 0, total: 0, message: 'Starting...' });

    try {
      const result = await batchFormatArticles((current, total, message) => {
        setFormatProgress({ current, total, message });
      });

      if (result.errors.length > 0) {
        console.error('Format errors:', result.errors);
      }

      // Refresh articles list
      await fetchArticles();

      setFormatProgress({
        current: result.updated,
        total: result.updated,
        message: `Complete! ${result.updated} articles formatted.${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''}`
      });
    } catch (err) {
      console.error('Format failed:', err);
      setFormatProgress({
        current: 0,
        total: 0,
        message: `Error: ${err}`
      });
    } finally {
      setIsFormatting(false);
    }
  };

  const handleAssignToUser = async () => {
    const userName = window.prompt(
      'Enter the display name of the user to assign all articles to:',
      'Marge'
    );

    if (!userName) return;

    // Optional: allow direct photoURL input
    const directPhotoURL = window.prompt(
      'Enter photo URL (or leave empty to use profile photo):',
      ''
    );

    if (!window.confirm(
      `This will assign ALL articles to "${userName}".\n\n` +
      (directPhotoURL ? `Photo URL provided: Yes\n\n` : 'Will use photo from user profile.\n\n') +
      'Continue?'
    )) {
      return;
    }

    setShowAssignModal(true);
    setIsAssigning(true);
    setAssignProgress({ current: 0, total: 0, message: 'Starting...' });

    try {
      const result = await batchAssignArticlesToUser(userName, (current, total, message) => {
        setAssignProgress({ current, total, message });
      }, directPhotoURL || undefined);

      if (result.errors.length > 0) {
        console.error('Assign errors:', result.errors);
      }

      // Refresh articles list
      await fetchArticles();

      setAssignProgress({
        current: result.updated,
        total: result.updated,
        message: `Complete! ${result.updated} articles assigned to ${userName}.${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''}`
      });
    } catch (err) {
      console.error('Assign failed:', err);
      setAssignProgress({
        current: 0,
        total: 0,
        message: `Error: ${err}`
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    if (filterStatus === 'all') return true;
    return article.status === filterStatus;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) return <div className="p-8 text-center">Loading articles...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
        <div className="flex gap-3">
          <button
            onClick={handleAssignToUser}
            disabled={isAssigning}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md transition-colors"
            title="Assign all articles to a user"
          >
            <UserCheck size={18} />
            Assign Author
          </button>
          <button
            onClick={handleFormatAllArticles}
            disabled={isFormatting}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-4 py-2 rounded-md transition-colors"
            title="Format & clean up all articles"
          >
            <Sparkles size={18} />
            Format All
          </button>
          <Link
            href="/admin/articles/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            New Article
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ArticleStatus | 'all')}
            className="border-gray-300 border rounded-md px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No articles found.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 line-clamp-1 max-w-md" title={article.title}>
                            {article.title}
                          </div>
                          <div className="text-sm text-gray-500">{article.category || 'Uncategorized'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${article.status === 'published' ? 'bg-green-100 text-green-800' :
                          article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {(article.status || 'draft').charAt(0).toUpperCase() + (article.status || 'draft').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        {article.authorPhotoURL ? (
                          <Image
                            src={article.authorPhotoURL}
                            alt={article.author || 'Author'}
                            width={24}
                            height={24}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                            {(article.author || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <span>{article.author || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {article.publishedAt ? formatDate(article.publishedAt) : (article.createdAt ? formatDate(article.createdAt) : 'N/A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin?action=edit-article&id=${article.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Format Progress Modal */}
      {showFormatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="text-amber-500" size={20} />
                Formatting Articles
              </h3>
              {!isFormatting && (
                <button
                  onClick={() => setShowFormatModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">{formatProgress.message}</p>
              {formatProgress.total > 0 && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(formatProgress.current / formatProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {formatProgress.current} / {formatProgress.total}
                  </p>
                </>
              )}
            </div>

            {!isFormatting && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowFormatModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {isFormatting && (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Progress Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="text-blue-600" size={20} />
                Assigning Articles
              </h3>
              {!isAssigning && (
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">{assignProgress.message}</p>
              {assignProgress.total > 0 && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(assignProgress.current / assignProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {assignProgress.current} / {assignProgress.total}
                  </p>
                </>
              )}
            </div>

            {!isAssigning && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {isAssigning && (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
