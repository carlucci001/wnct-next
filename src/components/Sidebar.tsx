"use client";

import React from "react";
import Link from "next/link";
import { Calendar, TrendingUp, Mail } from "lucide-react";
import ArticleCard from "./ArticleCard";
import { Article } from "@/types/article";

interface SidebarProps {
  trendingArticles?: Article[];
}

const Sidebar: React.FC<SidebarProps> = ({ trendingArticles = [] }) => {
  return (
    <aside className="w-full">
      {/* Advertisement */}
      <div className="mb-8">
        <div className="w-full h-[250px] bg-gray-200 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm border border-gray-300 dark:border-slate-700">
          Advertisement (300x250)
        </div>
      </div>

      {/* Trending Posts */}
      {trendingArticles.length > 0 && (
        <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="font-serif font-bold text-lg mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">
            Trending Now
          </h3>
          <div className="flex flex-col">
            {trendingArticles.slice(0, 4).map((article) => (
              <ArticleCard key={article.id} article={article} variant="compact" />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="font-serif font-bold text-lg mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">
          Sections
        </h3>
        <ul className="space-y-2 text-sm">
          {["News", "Business", "Sports", "Lifestyle", "Outdoors"].map((cat) => (
            <li key={cat}>
              <Link href={`/category/${cat.toLowerCase()}`} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                {cat}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Events */}
      <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="font-serif font-bold text-lg mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2 flex items-center gap-2">
          <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
          Upcoming Events
        </h3>
        <div className="space-y-3">
          {[
            { date: "Dec 25", title: "Christmas Day" },
            { date: "Dec 31", title: "New Years Eve" },
            { date: "Jan 1", title: "New Years Day" }
          ].map((event, idx) => (
            <div key={idx} className="border-l-2 border-blue-600 dark:border-blue-400 pl-3 py-1">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{event.date}</span>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{event.title}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="mb-8 bg-linear-to-br from-blue-600 to-blue-700 p-6 rounded shadow-sm text-white">
        <div className="flex items-center gap-2 mb-3">
          <Mail size={20} />
          <h3 className="font-serif font-bold text-lg">Stay Informed</h3>
        </div>
        <p className="text-sm text-blue-100 mb-4">Get the latest local news delivered to your inbox.</p>
        <input
          type="email"
          placeholder="Your email address"
          className="w-full px-3 py-2 rounded text-gray-900 text-sm mb-2"
        />
        <button className="w-full bg-white text-blue-600 font-bold py-2 rounded text-sm hover:bg-blue-50">
          Subscribe
        </button>
      </div>

      {/* Most Popular */}
      {trendingArticles.length > 0 && (
        <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="font-serif font-bold text-lg mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2 flex items-center gap-2">
            <TrendingUp size={18} className="text-red-600 dark:text-red-400" />
            Most Popular
          </h3>
          <ol className="space-y-3">
            {trendingArticles.slice(0, 5).map((article, idx) => (
              <li key={article.id} className="flex gap-3 items-start">
                <span className="shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <Link href={`/article/${article.slug || article.id}`} className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2">
                  {article.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
