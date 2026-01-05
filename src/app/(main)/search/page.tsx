"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, Calendar, User, Tag, ArrowUpDown } from "lucide-react";
import { searchArticles, getCategories, getAuthors, type SearchParams } from "@/lib/articles";
import { getCategoryColor } from "@/lib/constants";
import { Article } from "@/types/article";
import ArticleCard from "@/components/ArticleCard";
import Sidebar from "@/components/Sidebar";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [showAdvanced, setShowAdvanced] = useState(searchParams.get("advanced") === "true");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [author, setAuthor] = useState(searchParams.get("author") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "");
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "title">(
    (searchParams.get("sort") as "relevance" | "date" | "title") || "relevance"
  );

  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);

  // Load categories and authors for filters
  useEffect(() => {
    const loadFilters = async () => {
      const [cats, auths] = await Promise.all([getCategories(), getAuthors()]);
      setCategories(cats);
      setAuthors(auths);
    };
    loadFilters();
  }, []);

  // Sync state with URL and perform search
  useEffect(() => {
    const fetchResults = async () => {
      const q = searchParams.get("q") || "";
      const cat = searchParams.get("category") || "";
      const auth = searchParams.get("author") || "";
      const from = searchParams.get("from") || "";
      const to = searchParams.get("to") || "";
      const sort = (searchParams.get("sort") as "relevance" | "date" | "title") || "relevance";
      const isAdvanced = searchParams.get("advanced") === "true";

      // Sync local state
      setQuery(q);
      setCategory(cat);
      setAuthor(auth);
      setDateFrom(from);
      setDateTo(to);
      setSortBy(sort);

      // Sync advanced panel state with URL
      setShowAdvanced(isAdvanced);

      // Only fetch if there are parameters
      if (!q && !cat && !auth && !from && !to) {
        setResults([]);
        setSearched(false);
        return;
      }

      setLoading(true);
      setSearched(true);

      const params: SearchParams = {
        query: q,
        category: cat || undefined,
        author: auth || undefined,
        dateFrom: from || undefined,
        dateTo: to || undefined,
        sortBy: sort
      };

      try {
        const articles = await searchArticles(params);
        setResults(articles);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!query.trim() && !category && !author && !dateFrom && !dateTo) return;

    // Update URL with search params - this will trigger the useEffect
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (author) params.set("author", author);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (sortBy !== "relevance") params.set("sort", sortBy);
    if (showAdvanced) params.set("advanced", "true");

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    // We clear the form state and update the URL to trigger a reset
    setCategory("");
    setAuthor("");
    setDateFrom("");
    setDateTo("");
    setSortBy("relevance");

    // If there is a query, we keep it but clear other filters
    // If no query, this effectively clears everything
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (showAdvanced) params.set("advanced", "true");

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const toggleAdvanced = () => {
    const newState = !showAdvanced;
    setShowAdvanced(newState);

    // Update URL to reflect state change if we have an active search
    const params = new URLSearchParams(searchParams.toString());
    if (newState) {
      params.set("advanced", "true");
    } else {
      params.delete("advanced");
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const hasActiveFilters = category || author || dateFrom || dateTo || sortBy !== "relevance";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Content Area - 2/3 width on large screens */}
        <div className="lg:w-2/3">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-2">
              Search Articles
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find articles by keyword, category, author, or date
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            {/* Main Search Bar */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for articles..."
                  className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={toggleAdvanced}
                className={`px-4 py-3 border rounded-lg transition-colors flex items-center gap-2 ${
                  showAdvanced || hasActiveFilters
                    ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-700"
                }`}
              >
                <SlidersHorizontal size={20} />
                <span className="hidden sm:inline">Advanced</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
              </button>
            </div>

            {/* Advanced Search Options */}
            {showAdvanced && (
              <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">Advanced Filters</h3>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <X size={14} />
                      Clear Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Tag size={14} />
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Author Filter */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User size={14} />
                      Author
                    </label>
                    <select
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">All Authors</option>
                      {authors.map((auth) => (
                        <option key={auth} value={auth}>{auth}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date From */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar size={14} />
                      From Date
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar size={14} />
                      To Date
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <ArrowUpDown size={14} />
                    Sort Results By
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { value: "relevance", label: "Relevance" },
                      { value: "date", label: "Date (Newest First)" },
                      { value: "title", label: "Title (A-Z)" }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sortBy"
                          value={option.value}
                          checked={sortBy === option.value}
                          onChange={(e) => setSortBy(e.target.value as "relevance" | "date" | "title")}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Searching...</span>
            </div>
          ) : searched ? (
            results.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600 dark:text-gray-400">
                    Found <span className="font-bold text-gray-900 dark:text-white">{results.length}</span> article{results.length !== 1 ? "s" : ""}
                    {query && <> for &quot;<span className="font-medium">{query}</span>&quot;</>}
                  </p>
                </div>
                {/* 2-column grid instead of 3-column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="vertical"
                      // Use the helper to force correct colors
                      accentColor={getCategoryColor(article.category)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Results Found</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We couldn&apos;t find any articles matching your search.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  <p>Suggestions:</p>
                  <ul className="mt-2 space-y-1">
                    <li>Check your spelling</li>
                    <li>Try different or fewer keywords</li>
                    <li>Try broader search terms</li>
                    <li>Clear some filters</li>
                  </ul>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Search className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Search Our Articles</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Enter a search term above to find articles, or use advanced filters to narrow your results.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width on large screens */}
        <div className="lg:w-1/3">
          <Sidebar trendingArticles={results.slice(0, 5)} />
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
