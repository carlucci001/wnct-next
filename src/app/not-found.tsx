'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft, Newspaper, TrendingUp, Mail } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AdDisplay } from '@/components/advertising/AdDisplay';

export default function NotFound() {
  // Default settings for header (since we can't use async in client component)
  const defaultSettings = {
    tagline: "Engaging Our Community",
    logoUrl: "",
    brandingMode: "text" as const,
    showTagline: true,
    primaryColor: "#1d4ed8",
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      <Header initialSettings={defaultSettings} />

      <main className="flex-grow">
        <div className="container mx-auto px-4 md:px-0 pt-8 pb-12">
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Main Content - 2/3 */}
            <div className="lg:w-2/3">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 p-8 md:p-12">
                {/* Large 404 */}
                <div className="relative text-center mb-8">
                  <h1 className="text-[120px] md:text-[180px] font-black text-slate-100 dark:text-slate-800 leading-none select-none">
                    404
                  </h1>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Newspaper className="w-16 h-16 md:w-24 md:h-24 text-blue-600 dark:text-blue-400 opacity-80" />
                  </div>
                </div>

                {/* Message */}
                <div className="text-center space-y-4">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">
                    Page Not Found
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                    Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved,
                    deleted, or perhaps never existed. But don&apos;t worry - there&apos;s plenty more to explore!
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
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
                  >
                    <Search className="w-5 h-5" />
                    Search Articles
                  </Link>
                </div>

                {/* Back link */}
                <div className="text-center mt-8">
                  <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Go back to previous page
                  </button>
                </div>
              </div>

              {/* Suggested Content */}
              <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                <h3 className="font-serif font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Popular Sections
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['News', 'Sports', 'Business', 'Lifestyle', 'Entertainment', 'Outdoors'].map((category) => (
                    <Link
                      key={category}
                      href={`/category/${category.toLowerCase()}`}
                      className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors text-center"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{category}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - 1/3 */}
            <div className="lg:w-1/3">
              {/* Ad Spot */}
              <div className="mb-8">
                <AdDisplay position="sidebar_top" className="w-full" />
              </div>

              {/* Quick Links */}
              <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-serif font-bold text-lg mb-4 text-slate-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">
                  Quick Links
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2">
                      <Home className="w-4 h-4" /> Homepage
                    </Link>
                  </li>
                  <li>
                    <Link href="/search" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2">
                      <Search className="w-4 h-4" /> Search
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Newsletter Signup */}
              <div className="bg-blue-600 dark:bg-blue-700 p-6 rounded-lg text-white">
                <h3 className="font-serif font-bold text-lg mb-2">Stay Connected</h3>
                <p className="text-blue-100 text-sm mb-4">Get the latest WNC news delivered to your inbox.</p>
                <Link
                  href="/contact"
                  className="block w-full py-2 px-4 bg-white text-blue-600 font-semibold rounded-lg text-center hover:bg-blue-50 transition-colors"
                >
                  Subscribe Now
                </Link>
              </div>

              {/* Sticky Ad */}
              <div className="mt-8 sticky top-24">
                <AdDisplay position="sidebar_sticky" className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
