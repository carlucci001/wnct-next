import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/types/article';

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const dateToShow = article.publishedAt || article.createdAt;
  const formattedDate = dateToShow ? new Date(dateToShow).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <Link
      href={`/article/${article.slug}`}
      className="group block h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      {article.featuredImage && (
        <div className="relative h-48 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
             <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        </div>
      )}
      {!article.featuredImage && (
          <div className="relative h-48 w-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
          </div>
      )}
      <div className="p-4 flex flex-col h-[calc(100%-12rem)]">
        <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{article.category}</span>
            <time dateTime={dateToShow}>{formattedDate}</time>
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 leading-tight">
          {article.title}
        </h3>
        <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
          {article.excerpt}
        </p>
      </div>
    </Link>
  );
}
