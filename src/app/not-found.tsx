'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft, Newspaper } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Large 404 */}
        <div className="relative">
          <h1 className="text-[150px] md:text-[200px] font-black text-slate-200 dark:text-slate-800 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Newspaper className="w-20 h-20 md:w-28 md:h-28 text-blue-600 dark:text-blue-400 opacity-80" />
          </div>
        </div>

        {/* Message */}
        <div className="mt-4 space-y-4">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">
            Page Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved,
            deleted, or perhaps never existed.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            <Home className="w-5 h-5" />
            Back to Homepage
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Search className="w-5 h-5" />
            Search Articles
          </Link>
        </div>

        {/* Back link */}
        <button
          onClick={() => window.history.back()}
          className="mt-8 inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to previous page
        </button>

        {/* Footer hint */}
        <p className="mt-16 text-xs text-slate-400 dark:text-slate-600">
          WNC Times &bull; Western North Carolina&apos;s Local News Source
        </p>
      </div>
    </div>
  );
}
