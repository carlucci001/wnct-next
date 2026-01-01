"use client";

import React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Article } from "@/types/article";
import ImageWithFallback from "./ImageWithFallback";

interface ArticleCardProps {
  article: Article;
  variant?: "horizontal" | "vertical" | "compact";
  accentColor?: string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, variant = "vertical", accentColor }) => {
  const catColor = accentColor || article.categoryColor || "#1d4ed8";
  const imageUrl = article.featuredImage || article.imageUrl || "/placeholder.jpg";
  const articleDate = article.date || article.publishedAt || article.createdAt || "";

  if (variant === "horizontal") {
    return (
      <div className="flex flex-col md:flex-row gap-4 mb-6 group">
        <div className="w-full md:w-1/3 aspect-video overflow-hidden rounded-sm relative">
          <ImageWithFallback src={imageUrl} alt={article.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
        </div>
        <div className="w-full md:w-2/3 flex flex-col justify-center">
          <span className="text-xs font-bold uppercase mb-1 tracking-wider" style={{ color: catColor }}>{article.category}</span>
          <Link href={`/article/${article.slug || article.id}`}>
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-2 group-hover:opacity-80 transition leading-tight">{article.title}</h3>
          </Link>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{article.excerpt}</p>
          <div className="flex items-center text-xs text-gray-400">
            <span className="font-medium text-gray-500">{article.author}</span>
            <span className="mx-2">•</span>
            <Clock size={12} className="mr-1" />
            <span>{articleDate}</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex gap-3 mb-4 group border-b border-gray-100 pb-4 last:border-0">
        <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-sm relative">
          <ImageWithFallback src={imageUrl} alt={article.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="80px" />
        </div>
        <div>
          <Link href={`/article/${article.slug || article.id}`}>
            <h4 className="font-serif text-sm font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition leading-snug line-clamp-3">{article.title}</h4>
          </Link>
          <span className="text-[10px] text-gray-400 block mt-1">{articleDate}</span>
        </div>
      </div>
    );
  }

  // Default Vertical
  return (
    <div className="flex flex-col h-full group bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video overflow-hidden relative">
        <span className="absolute top-2 left-2 z-10 text-white text-[10px] font-bold px-2 py-1 uppercase rounded-sm shadow-md" style={{ backgroundColor: catColor }}>
          {article.category}
        </span>
        <ImageWithFallback src={imageUrl} alt={article.title} fill className="object-cover transition duration-700 group-hover:scale-110" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <span className="font-semibold">{article.author}</span>
          <span className="mx-1">•</span>
          <span>{articleDate}</span>
        </div>
        <Link href={`/article/${article.slug || article.id}`}>
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition leading-tight">{article.title}</h3>
        </Link>
        <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-grow">{article.excerpt}</p>
      </div>
    </div>
  );
};

export default ArticleCard;