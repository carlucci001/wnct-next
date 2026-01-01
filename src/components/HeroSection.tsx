"use client";

import React from "react";
import Link from "next/link";
import { Article } from "@/types/article";
import ImageWithFallback from "./ImageWithFallback";

interface HeroSectionProps {
  mainArticle: Article;
  subArticles: Article[];
}

const HeroSection: React.FC<HeroSectionProps> = ({ mainArticle, subArticles }) => {
  const safeSubArticles = [...subArticles];

  const renderCard = (article: Article | undefined, isMain: boolean) => {
    if (!article) return <div className="bg-gray-200 h-full w-full animate-pulse" />;

    const imageUrl = article.featuredImage || article.imageUrl || "/placeholder.jpg";
    const articleDate = article.date || article.publishedAt || article.createdAt || "";

    return (
      <div className="relative group overflow-hidden h-full w-full">
        <ImageWithFallback
          src={imageUrl}
          alt={article.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes={isMain ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${isMain ? "from-black/80 via-black/30" : "from-black/90 via-black/40"} to-transparent`}></div>
        <div className={`absolute bottom-0 left-0 w-full ${isMain ? "p-6 md:p-10" : "p-4 md:p-6"}`}>
          <span
            className={`inline-block font-bold text-white uppercase tracking-wider shadow-sm rounded-sm ${isMain ? "text-xs px-3 py-1 mb-3" : "text-[9px] md:text-[10px] px-2 py-0.5 mb-2"}`}
            style={{ backgroundColor: article.categoryColor || "#1d4ed8" }}
          >
            {article.category}
          </span>
          <Link href={`/article/${article.slug || article.id}`}>
            <h2 className={`font-serif font-bold text-white leading-tight hover:text-gray-200 transition ${isMain ? "text-2xl md:text-4xl mb-2" : "text-sm md:text-lg"}`}>
              {article.title}
            </h2>
          </Link>
          {isMain && (
            <div className="flex items-center text-gray-300 text-sm mt-2">
              <span className="font-semibold">{article.author}</span>
              <span className="mx-2">•</span>
              <span>{articleDate}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-1 h-auto md:h-[700px]">
        <div className="md:col-span-2 md:row-span-2 min-h-[300px] relative">
          {renderCard(mainArticle, true)}
        </div>
        <div className="md:col-span-1 md:row-span-1 min-h-[200px] relative">
          {renderCard(safeSubArticles[0], false)}
        </div>
        <div className="md:col-span-1 md:row-span-1 min-h-[200px] relative">
          {renderCard(safeSubArticles[1], false)}
        </div>
        <div className="md:col-span-1 md:row-span-1 min-h-[200px] relative">
          {renderCard(safeSubArticles[2], false)}
        </div>
        <div className="md:col-span-1 md:row-span-1 min-h-[200px] relative">
          {renderCard(safeSubArticles[3], false)}
        </div>
        <div className="md:col-span-1 md:row-span-1 min-h-[200px] relative">
          {renderCard(safeSubArticles[4], false)}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;