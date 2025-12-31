# WNC Times - Component Porting Tasks for Jules

These tasks port the actual React components from `c:\dev\wnc-times-clone` to the Next.js project. Each task includes the original source code that needs to be adapted.

**CRITICAL INSTRUCTIONS FOR JULES:**

1. Replace `react-router-dom` `Link` with `next/link` `Link`
2. Replace `useNavigate` with `useRouter` from `next/navigation`
3. Replace `<img>` tags with `next/image` `Image` component where appropriate
4. Add `"use client"` directive to components that use hooks (useState, useEffect, etc.)
5. Keep all Tailwind CSS classes exactly as they are
6. The Firebase connection is already working - use the existing `src/lib/articles.ts` functions

---

## Task 1: Port the Article Type Definition

Update `src/types/article.ts` to match the original types.

**Replace the content of `src/types/article.ts` with:**

```typescript
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  categoryColor?: string;
  author: string;
  date?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  featuredImage?: string;
  imageCredit?: string;
  slug?: string;
  status?:
    | "published"
    | "draft"
    | "archived"
    | "Published"
    | "Draft"
    | "Review";
  isFeatured?: boolean;
  trendingScore?: number;
  views?: number;
  tags?: string[];
  isBreakingNews?: boolean;
  breakingNewsTimestamp?: string;
  editorNotes?: string;
  createdBy?: string;
  lastEditedBy?: string;
}

export type ArticleStatus = "draft" | "published" | "archived";

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  count: number;
  color?: string;
  sortOrder?: number;
  description?: string;
  status?: "Active" | "Hidden";
}

export interface NavItem {
  label: string;
  path: string;
  children?: NavItem[];
}
```

---

## Task 2: Port the ArticleCard Component

Replace `src/components/ArticleCard.tsx` with this Next.js version:

```tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { Article } from "@/types/article";

interface ArticleCardProps {
  article: Article;
  variant?: "horizontal" | "vertical" | "compact";
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  variant = "vertical",
}) => {
  const catColor = article.categoryColor || "#1d4ed8";
  const imageUrl =
    article.featuredImage || article.imageUrl || "/placeholder.jpg";
  const articleDate =
    article.date || article.publishedAt || article.createdAt || "";

  if (variant === "horizontal") {
    return (
      <div className="flex flex-col md:flex-row gap-4 mb-6 group">
        <div className="w-full md:w-1/3 aspect-video overflow-hidden rounded-sm relative">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        <div className="w-full md:w-2/3 flex flex-col justify-center">
          <span
            className="text-xs font-bold uppercase mb-1 tracking-wider"
            style={{ color: catColor }}
          >
            {article.category}
          </span>
          <Link href={`/article/${article.slug || article.id}`}>
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-2 group-hover:opacity-80 transition leading-tight">
              {article.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {article.excerpt}
          </p>
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
        <div className="w-20 h-20 shrink-0 overflow-hidden rounded-sm relative">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="80px"
          />
        </div>
        <div>
          <Link href={`/article/${article.slug || article.id}`}>
            <h4 className="font-serif text-sm font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition leading-snug line-clamp-3">
              {article.title}
            </h4>
          </Link>
          <span className="text-[10px] text-gray-400 block mt-1">
            {articleDate}
          </span>
        </div>
      </div>
    );
  }

  // Default Vertical
  return (
    <div className="flex flex-col h-full group bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video overflow-hidden relative">
        <span
          className="absolute top-2 left-2 z-10 text-white text-[10px] font-bold px-2 py-1 uppercase rounded-sm shadow-md"
          style={{ backgroundColor: catColor }}
        >
          {article.category}
        </span>
        <Image
          src={imageUrl}
          alt={article.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-5 flex flex-col grow">
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <span className="font-semibold">{article.author}</span>
          <span className="mx-1">•</span>
          <span>{articleDate}</span>
        </div>
        <Link href={`/article/${article.slug || article.id}`}>
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition leading-tight">
            {article.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 line-clamp-3 mb-4 grow">
          {article.excerpt}
        </p>
      </div>
    </div>
  );
};

export default ArticleCard;
```

---

## Task 3: Port the HeroSection Component

Create/replace `src/components/HeroSection.tsx`:

```tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Article } from "@/types/article";

interface HeroSectionProps {
  mainArticle: Article;
  subArticles: Article[];
}

const HeroSection: React.FC<HeroSectionProps> = ({
  mainArticle,
  subArticles,
}) => {
  const safeSubArticles = [...subArticles];

  const renderCard = (article: Article | undefined, isMain: boolean) => {
    if (!article)
      return <div className="bg-gray-200 h-full w-full animate-pulse" />;

    const imageUrl =
      article.featuredImage || article.imageUrl || "/placeholder.jpg";
    const articleDate =
      article.date || article.publishedAt || article.createdAt || "";

    return (
      <div className="relative group overflow-hidden h-full w-full">
        <Image
          src={imageUrl}
          alt={article.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes={
            isMain
              ? "(max-width: 768px) 100vw, 66vw"
              : "(max-width: 768px) 100vw, 33vw"
          }
        />
        <div
          className={`absolute inset-0 bg-linear-to-t ${
            isMain ? "from-black/80 via-black/30" : "from-black/90 via-black/40"
          } to-transparent`}
        ></div>
        <div
          className={`absolute bottom-0 left-0 w-full ${
            isMain ? "p-6 md:p-10" : "p-4 md:p-6"
          }`}
        >
          <span
            className={`inline-block font-bold text-white uppercase tracking-wider shadow-sm rounded-sm ${
              isMain
                ? "text-xs px-3 py-1 mb-3"
                : "text-[9px] md:text-[10px] px-2 py-0.5 mb-2"
            }`}
            style={{ backgroundColor: article.categoryColor || "#1d4ed8" }}
          >
            {article.category}
          </span>
          <Link href={`/article/${article.slug || article.id}`}>
            <h2
              className={`font-serif font-bold text-white leading-tight hover:text-gray-200 transition ${
                isMain ? "text-2xl md:text-4xl mb-2" : "text-sm md:text-lg"
              }`}
            >
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
```

---

## Task 4: Port the Sidebar Component

Create `src/components/Sidebar.tsx`:

```tsx
"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Clock, TrendingUp, Mail } from "lucide-react";
import ArticleCard from "./ArticleCard";
import { Article, CategoryData } from "@/types/article";

interface SidebarProps {
  trendingArticles?: Article[];
  categories?: CategoryData[];
}

const DEFAULT_CATEGORIES: CategoryData[] = [
  { id: "c1", name: "Local News", slug: "news", count: 124 },
  { id: "c2", name: "Business", slug: "business", count: 45 },
  { id: "c3", name: "Lifestyle", slug: "lifestyle", count: 89 },
  { id: "c4", name: "Opinion", slug: "opinion", count: 23 },
];

const Sidebar: React.FC<SidebarProps> = ({
  trendingArticles = [],
  categories = DEFAULT_CATEGORIES,
}) => {
  return (
    <aside className="w-full">
      {/* Search Widget */}
      <div className="mb-8 bg-white p-6 rounded shadow-sm border border-gray-100">
        <h3 className="font-serif font-bold text-lg mb-4 text-gray-900">
          Search
        </h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search articles..."
            className="w-full border border-gray-300 rounded pl-3 pr-10 py-2 text-sm focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Advertisement */}
      <div className="mb-8">
        <div className="w-full h-[250px] bg-gray-200 flex items-center justify-center text-gray-400 text-sm border border-gray-300">
          Advertisement (300x250)
        </div>
      </div>

      {/* Trending Posts */}
      {trendingArticles.length > 0 && (
        <div className="mb-8 bg-white p-6 rounded shadow-sm border border-gray-100">
          <h3 className="font-serif font-bold text-lg mb-4 text-gray-900 border-b border-gray-200 pb-2">
            Trending Now
          </h3>
          <div className="flex flex-col">
            {trendingArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="compact"
              />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-8 bg-white p-6 rounded shadow-sm border border-gray-100">
        <h3 className="font-serif font-bold text-lg mb-4 text-gray-900 border-b border-gray-200 pb-2">
          Sections
        </h3>
        <ul className="space-y-2 text-sm">
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/category/${cat.slug}`}
                className="flex justify-between text-gray-600 hover:text-blue-600"
              >
                <span>{cat.name}</span>
                <span className="text-gray-400">({cat.count})</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Events Calendar */}
      <div className="mb-8 bg-white p-6 rounded shadow-sm border border-gray-100">
        <h3 className="font-serif font-bold text-lg mb-4 text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
          <Calendar size={18} className="text-blue-600" />
          Upcoming Events
        </h3>
        <div className="space-y-3">
          {[
            { date: "Dec 25", title: "Christmas Day", time: "All Day" },
            { date: "Dec 31", title: "New Years Eve", time: "9:00 PM" },
            { date: "Jan 1", title: "New Years Day", time: "All Day" },
          ].map((event, idx) => (
            <div
              key={idx}
              className="border-l-2 border-blue-600 pl-3 hover:bg-gray-50 transition py-1"
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span className="font-bold text-blue-600">{event.date}</span>
                <span>•</span>
                <span>{event.time}</span>
              </div>
              <h4 className="text-sm font-semibold text-gray-900">
                {event.title}
              </h4>
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
        <p className="text-sm text-blue-100 mb-4">
          Get the latest local news delivered to your inbox every morning.
        </p>
        <input
          type="email"
          placeholder="Your email address"
          className="w-full px-3 py-2 rounded text-gray-900 text-sm mb-2 focus:outline-none"
        />
        <button className="w-full bg-white text-blue-600 font-bold py-2 rounded text-sm hover:bg-blue-50 transition">
          Subscribe
        </button>
      </div>

      {/* Most Popular */}
      <div className="mb-8 bg-white p-6 rounded shadow-sm border border-gray-100">
        <h3 className="font-serif font-bold text-lg mb-4 text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
          <TrendingUp size={18} className="text-red-600" />
          Most Popular
        </h3>
        <ol className="space-y-3">
          {trendingArticles.slice(0, 5).map((article, idx) => (
            <li key={article.id} className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {idx + 1}
              </span>
              <Link
                href={`/article/${article.slug || article.id}`}
                className="text-sm text-gray-700 hover:text-blue-600 transition line-clamp-2 leading-tight"
              >
                {article.title}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
};

export default Sidebar;
```

---

## Task 5: Port the WeatherWidget Component

Create `src/components/WeatherWidget.tsx`:

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { Cloud, CloudRain, CloudSnow, Sun, Wind } from "lucide-react";

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  icon: string;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 68,
    condition: "Partly Cloudy",
    location: "Asheville, NC",
    icon: "cloud",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, just use mock data
    setWeather({
      temp: 68,
      condition: "Partly Cloudy",
      location: "Asheville, NC",
      icon: "cloud",
    });
    setIsLoading(false);
  }, []);

  const renderIcon = () => {
    const iconProps = { size: 14, className: "mr-1.5" };
    switch (weather.icon) {
      case "rain":
        return <CloudRain {...iconProps} />;
      case "snow":
        return <CloudSnow {...iconProps} />;
      case "wind":
        return <Wind {...iconProps} />;
      case "sun":
        return <Sun {...iconProps} />;
      default:
        return <Cloud {...iconProps} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center text-amber-400 font-bold">
        <Cloud size={14} className="mr-1.5 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-amber-400 font-bold">
      {renderIcon()}
      <span>
        {weather.location} {weather.temp}°F
      </span>
    </div>
  );
};

export default WeatherWidget;
```

---

## Task 6: Port the Header Component

Replace `src/components/Header.tsx`:

```tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import WeatherWidget from "./WeatherWidget";

const TOP_NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Blog", path: "/blog" },
  { label: "Advertise", path: "/contact" },
  { label: "Directory", path: "/directory" },
  { label: "Community", path: "/community" },
  { label: "Contact", path: "/contact" },
];

const MAIN_NAV_ITEMS = [
  { label: "News", path: "/category/news" },
  { label: "Sports", path: "/category/sports" },
  { label: "Business", path: "/category/business" },
  { label: "Entertainment", path: "/category/entertainment" },
  { label: "Lifestyle", path: "/category/lifestyle" },
  { label: "Outdoors", path: "/category/outdoors" },
];

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const { currentUser, signOut } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const primaryColor = "#1d4ed8";
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleThemeChange = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogout = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="flex flex-col w-full bg-white dark:bg-slate-900 font-sans transition-colors duration-300 relative z-40">
      {/* Top Bar */}
      <div className="bg-slate-900 text-gray-300 text-xs border-b border-gray-800">
        <div className="container mx-auto px-4 md:px-0 h-10 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <WeatherWidget />
            <span className="hidden md:inline text-gray-500">|</span>
            <div className="hidden md:block text-gray-400">{currentDate}</div>
          </div>

          <div className="flex items-center space-x-4 md:space-x-6">
            <nav className="hidden md:flex items-center space-x-4">
              {TOP_NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.path}
                  className="hover:text-white transition-colors font-medium uppercase tracking-tight text-[10px] lg:text-xs"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-3 pl-4 border-l border-gray-700">
              <button
                onClick={handleThemeChange}
                className="hover:text-white transition-colors"
                title="Toggle Theme"
              >
                {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
              </button>

              <div className="relative" ref={userMenuRef}>
                {currentUser ? (
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center hover:text-white transition-colors text-amber-400 font-bold"
                  >
                    <UserIcon size={14} className="mr-1" />
                    <span className="hidden md:inline">
                      {currentUser.displayName?.split(" ")[0] || "User"}
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center hover:text-white transition-colors text-amber-400 font-bold"
                  >
                    <UserIcon size={14} className="mr-1" />
                    <span className="hidden md:inline">Login</span>
                  </Link>
                )}

                {isUserMenuOpen && currentUser && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <Link
                      href="/admin"
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <LayoutDashboard
                        size={14}
                        className="mr-2 text-blue-600"
                      />{" "}
                      Admin Panel
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center border-t border-gray-100 dark:border-slate-700"
                    >
                      <LogOut size={14} className="mr-2" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Area */}
      <div className="container mx-auto px-4 md:px-0 py-4 md:py-5 flex justify-between items-center bg-white dark:bg-slate-900 transition-colors">
        <Link
          href="/"
          className="shrink-0 group hover:opacity-95 transition-opacity flex flex-col items-start"
        >
          <div className="flex flex-col items-start">
            <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tight leading-none text-gray-900 dark:text-white">
              WNC TIMES
            </h1>
            <span
              className="mt-1 px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Engaging Our Community
            </span>
          </div>
        </Link>

        {/* Banner Ad Placeholder */}
        <div className="hidden lg:flex w-[728px] h-[90px] overflow-hidden bg-gray-100 items-center justify-center text-gray-400 text-sm">
          Advertisement (728x90)
        </div>
      </div>

      {/* Main Navigation */}
      <nav
        className="sticky top-0 z-30 shadow-md border-t border-b transition-colors duration-300"
        style={{
          backgroundColor: primaryColor,
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="container mx-auto px-4 md:px-0">
          <div className="flex items-center justify-between h-12">
            <div className="hidden md:flex items-center space-x-1 justify-start">
              {MAIN_NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.path}
                  className="px-4 py-1 text-sm font-bold text-white uppercase tracking-wider hover:bg-white/20 rounded-sm transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="md:hidden flex items-center justify-between w-full">
              <span className="text-white font-bold uppercase text-sm tracking-wider">
                Sections
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white p-1 hover:bg-white/20 rounded"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 absolute w-full left-0 shadow-xl">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {[...TOP_NAV_ITEMS, ...MAIN_NAV_ITEMS].map((item) => (
                <Link
                  key={item.label}
                  href={item.path}
                  className="block px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 rounded border-b border-gray-100 dark:border-slate-800 last:border-0"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
```

---

## Task 7: Port the Footer Component

Replace `src/components/Footer.tsx`:

```tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

const Footer: React.FC = () => {
  const primaryColor = "#1d4ed8";

  return (
    <footer
      className="bg-slate-900 text-gray-300 pt-16 pb-8 font-sans border-t-4"
      style={{ borderTopColor: primaryColor }}
    >
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 px-4 md:px-0">
        {/* About Widget */}
        <div>
          <h3
            className="text-white font-serif text-xl font-bold mb-6 border-b-2 inline-block pb-2"
            style={{ borderBottomColor: primaryColor }}
          >
            About Us
          </h3>
          <p className="text-sm leading-relaxed mb-6 text-gray-400">
            WNC Times provides the latest news, business insights, and lifestyle
            stories from across Western North Carolina. We are dedicated to
            accurate reporting and community service.
          </p>
          <div className="flex flex-col space-y-3 text-sm mb-6">
            <div className="flex items-center">
              <MapPin size={16} className="mr-2 text-amber-400" /> Asheville, NC
              28801
            </div>
            <div className="flex items-center">
              <Phone size={16} className="mr-2 text-amber-400" /> (828) 555-0123
            </div>
            <div className="flex items-center">
              <Mail size={16} className="mr-2 text-amber-400" />{" "}
              editor@wnctimes.com
            </div>
          </div>

          <div className="flex space-x-4">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
              <a
                key={idx}
                href="#"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:bg-blue-600 hover:text-white transition duration-300"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3
            className="text-white font-serif text-xl font-bold mb-6 border-b-2 inline-block pb-2"
            style={{ borderBottomColor: primaryColor }}
          >
            Quick Links
          </h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/about" className="hover:text-white transition">
                About WNC Times
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/directory" className="hover:text-white transition">
                Business Directory
              </Link>
            </li>
            <li>
              <Link href="/subscribe" className="hover:text-white transition">
                Subscribe / Renew
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className="hover:text-white transition text-amber-400"
              >
                Staff Login
              </Link>
            </li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3
            className="text-white font-serif text-xl font-bold mb-6 border-b-2 inline-block pb-2"
            style={{ borderBottomColor: primaryColor }}
          >
            Categories
          </h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link
                href="/category/news"
                className="hover:text-white transition"
              >
                Local News
              </Link>
            </li>
            <li>
              <Link
                href="/category/business"
                className="hover:text-white transition"
              >
                Business & Economy
              </Link>
            </li>
            <li>
              <Link
                href="/category/outdoors"
                className="hover:text-white transition"
              >
                Tourism & Outdoors
              </Link>
            </li>
            <li>
              <Link
                href="/category/arts"
                className="hover:text-white transition"
              >
                Arts & Culture
              </Link>
            </li>
            <li>
              <Link
                href="/category/food"
                className="hover:text-white transition"
              >
                Food & Drink
              </Link>
            </li>
            <li>
              <Link
                href="/category/realestate"
                className="hover:text-white transition"
              >
                Real Estate
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3
            className="text-white font-serif text-xl font-bold mb-6 border-b-2 inline-block pb-2"
            style={{ borderBottomColor: primaryColor }}
          >
            Newsletter
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Subscribe to our weekly newsletter to stay updated on the latest WNC
            news.
          </p>
          <form className="flex flex-col space-y-3">
            <input
              type="email"
              placeholder="Your Email Address"
              className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:border-blue-600 text-sm placeholder-gray-500"
            />
            <button
              className="text-white font-bold py-2 rounded transition text-sm uppercase tracking-wide hover:brightness-110"
              style={{ backgroundColor: primaryColor }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-8 pt-8">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 px-4 md:px-0">
          <p>
            &copy; {new Date().getFullYear()} WNC Times. All rights reserved.
          </p>
          <div className="mt-2 md:mt-0">
            <span className="mx-2">Powered by Next.js & Tailwind</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```

---

## Task 8: Update the Homepage

Replace `src/app/page.tsx` with a proper news homepage layout:

```tsx
"use client";

import { useEffect, useState } from "react";
import { getArticles } from "@/lib/articles";
import { Article } from "@/types/article";
import HeroSection from "@/components/HeroSection";
import ArticleCard from "@/components/ArticleCard";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      const data = await getArticles();
      setArticles(data);
      setLoading(false);
    }
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  // Split articles for different sections
  const heroMain = articles[0];
  const heroSub = articles.slice(1, 6);
  const latestArticles = articles.slice(6, 15);
  const trendingArticles = articles.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 md:px-0 py-8">
        {/* Hero Section */}
        {heroMain && (
          <HeroSection mainArticle={heroMain} subArticles={heroSub} />
        )}

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column - Latest News */}
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6 border-b-2 border-blue-600 pb-2 inline-block">
              Latest News
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="vertical"
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar trendingArticles={trendingArticles} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Task 9: Add Tailwind Custom Colors

Update `tailwind.config.ts` to include the brand colors used by the components:

```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "brand-dark": "#1a1a2e",
        "brand-blue": "#1d4ed8",
        "brand-gold": "#d4a853",
        "brand-red": "#dc2626",
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        sans: ["system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## Task 10: Update the articles.ts to Map Fields Correctly

Update `src/lib/articles.ts` to properly map the Firebase fields to the Article interface. The key change is mapping `imageUrl` and handling different field names:

```typescript
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  deleteDoc,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { Article } from "@/types/article";

const ARTICLES_COLLECTION = "articles";

const convertDocToArticle = (
  doc: QueryDocumentSnapshot<DocumentData, DocumentData>
): Article => {
  const data = doc.data();

  // Handle date conversion
  const getDateString = (field: any): string => {
    if (!field) return "";
    if (field instanceof Timestamp) return field.toDate().toISOString();
    if (typeof field === "string") return field;
    return "";
  };

  return {
    id: doc.id,
    title: data.title || "",
    content: data.content || "",
    slug: data.slug || doc.id,
    author: data.author || "Staff Writer",
    category: data.category || "Uncategorized",
    categoryColor: data.categoryColor || "#1d4ed8",
    tags: data.tags || [],
    status: data.status || "draft",
    publishedAt: getDateString(data.publishedAt),
    createdAt: getDateString(data.createdAt),
    updatedAt: getDateString(data.updatedAt),
    date: getDateString(data.date || data.publishedAt || data.createdAt),
    // Image handling - check multiple possible field names
    featuredImage: data.featuredImage || data.imageUrl || data.image || "",
    imageUrl: data.imageUrl || data.featuredImage || data.image || "",
    excerpt: data.excerpt || data.description || "",
    isFeatured: data.isFeatured || false,
    isBreakingNews: data.isBreakingNews || false,
    breakingNewsTimestamp: getDateString(data.breakingNewsTimestamp),
    views: data.views || 0,
  } as Article;
};

export async function getArticles(): Promise<Article[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ARTICLES_COLLECTION));
    return querySnapshot.docs
      .map(convertDocToArticle)
      .filter(
        (article) =>
          article.status === "published" || article.status === "Published"
      )
      .sort((a, b) => {
        const dateA = new Date(
          a.publishedAt || a.createdAt || a.date || 0
        ).getTime();
        const dateB = new Date(
          b.publishedAt || b.createdAt || b.date || 0
        ).getTime();
        return dateB - dateA;
      });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const q = query(
      collection(db, ARTICLES_COLLECTION),
      where("slug", "==", slug),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return convertDocToArticle(querySnapshot.docs[0]);
  } catch (error) {
    console.error(`Error fetching article with slug ${slug}:`, error);
    return null;
  }
}

export async function getArticlesByCategory(
  category: string
): Promise<Article[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ARTICLES_COLLECTION));
    return querySnapshot.docs
      .map(convertDocToArticle)
      .filter(
        (article) =>
          article.category?.toLowerCase() === category.toLowerCase() &&
          (article.status === "published" || article.status === "Published")
      )
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  } catch (error) {
    console.error(`Error fetching articles in category ${category}:`, error);
    return [];
  }
}

export async function getAllArticles(): Promise<Article[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ARTICLES_COLLECTION));
    return querySnapshot.docs.map(convertDocToArticle).sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching all articles:", error);
    return [];
  }
}

export async function deleteArticle(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, ARTICLES_COLLECTION, id));
    return true;
  } catch (error) {
    console.error(`Error deleting article ${id}:`, error);
    return false;
  }
}
```

---

## Summary

After completing all tasks, your WNC Times site should have:

- Professional newspaper-style header with weather, navigation, and user menu
- Hero section with 3x3 grid layout showing 6 featured articles
- Main content area with latest news cards
- Sidebar with trending articles, categories, events, and newsletter signup
- Professional footer with about info, links, categories, and newsletter
- Dark mode support
- Mobile responsive design
- All content from your existing Firebase database

**Run `npm run dev` after each task to verify the changes work correctly.**
