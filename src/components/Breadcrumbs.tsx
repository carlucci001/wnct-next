"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const pathname = usePathname();

  if (items) {
    return (
      <nav className="flex text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isFirst = index === 0;

            return (
              <li key={index} className="inline-flex items-center">
                {!isFirst && <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 mx-1" />}

                {isFirst ? (
                  <Link href={item.path || '/'} className="inline-flex items-center hover:text-blue-600 dark:hover:text-blue-400">
                    <Home className="w-4 h-4 mr-1" />
                    {item.label}
                  </Link>
                ) : isLast ? (
                  <span className="text-gray-700 dark:text-gray-200 cursor-default font-semibold truncate max-w-[200px] md:max-w-xs">
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.path || '#'} className="hover:text-blue-600 dark:hover:text-blue-400">
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  const pathnames = pathname.split('/').filter((x) => x);
  if (pathnames.length === 0) return null;

  return (
    <nav className="flex text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link href="/" className="inline-flex items-center hover:text-blue-600 dark:hover:text-blue-400">
            <Home className="w-4 h-4 mr-1" />
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;

          return (
            <li key={to}>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                {isLast ? (
                  <span className="ml-1 md:ml-2 text-gray-700 dark:text-gray-200 capitalize cursor-default font-semibold">
                    {value.replace(/-/g, ' ')}
                  </span>
                ) : (
                  <Link href={to} className="ml-1 md:ml-2 hover:text-blue-600 dark:hover:text-blue-400 capitalize">
                    {value.replace(/-/g, ' ')}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
