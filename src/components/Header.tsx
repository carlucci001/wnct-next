"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Menu, X, Sun, Moon, User as UserIcon, LogOut, LayoutDashboard, Search, SlidersHorizontal, Palette, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getDb } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Dynamic import with SSR disabled to prevent hydration mismatch
const WeatherWidget = dynamic(() => import("./WeatherWidget"), {
  ssr: false,
  loading: () => <span className="text-gray-400 text-xs">Loading weather...</span>
});
import BreakingNews from "./BreakingNews";
import ThemeSelector from "./ThemeSelector";
import { AdDisplay } from "./advertising/AdDisplay";

// Header banner ad
const BANNER_IMAGE = "/banners/farrington-banner.png";
const BANNER_LINK = "https://farringtondevelopment.com";

// Default menus (fallback if API fails)
const DEFAULT_TOP_NAV = [
  { label: "Home", path: "/" },
  { label: "Advertise", path: "/advertise" },
  { label: "Directory", path: "/directory" },
  { label: "Blog", path: "/blog" },
  { label: "Events", path: "/events" },
  { label: "Community", path: "/community" },
  { label: "Contact", path: "/contact" },
];

const DEFAULT_MAIN_NAV = [
  { label: "News", path: "/category/news" },
  { label: "Sports", path: "/category/sports" },
  { label: "Business", path: "/category/business" },
  { label: "Entertainment", path: "/category/entertainment" },
  { label: "Lifestyle", path: "/category/lifestyle" },
  { label: "Outdoors", path: "/category/outdoors" },
];

interface NavItem {
  label: string;
  path: string;
}

interface SiteSettings {
  tagline: string;
  logoUrl: string;
  brandingMode: 'text' | 'logo';
  showTagline: boolean;
  primaryColor: string;
}

interface HeaderProps {
  initialSettings?: SiteSettings;
}

const Header: React.FC<HeaderProps> = ({ initialSettings }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNavigatingToAdmin, setIsNavigatingToAdmin] = useState(false);
  const router = useRouter();
  const { currentUser, userProfile, signOut } = useAuth();
  const { colorMode, toggleColorMode, currentTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(initialSettings || null);
  const [settingsLoaded, setSettingsLoaded] = useState(!!initialSettings);
  const [logoImageLoaded, setLogoImageLoaded] = useState(false);
  const [dateStr, setDateStr] = useState("");

  // Dynamic navigation menus
  const [topNav, setTopNav] = useState<NavItem[]>(DEFAULT_TOP_NAV);
  const [mainNav, setMainNav] = useState<NavItem[]>(DEFAULT_MAIN_NAV);

  useEffect(() => {
    setMounted(true);

    // Fetch dynamic menus
    const loadMenus = async () => {
      try {
        const response = await fetch('/api/menus');
        const data = await response.json();
        if (data.success && data.menus) {
          const topMenu = data.menus.find((m: { slug: string }) => m.slug === 'top-nav');
          const mainMenu = data.menus.find((m: { slug: string }) => m.slug === 'main-nav');

          if (topMenu?.items?.length > 0) {
            setTopNav(topMenu.items.map((item: { label: string; path: string }) => ({
              label: item.label,
              path: item.path,
            })));
          }
          if (mainMenu?.items?.length > 0) {
            setMainNav(mainMenu.items.map((item: { label: string; path: string }) => ({
              label: item.label,
              path: item.path,
            })));
          }
        }
      } catch (error) {
        console.error('Failed to load menus:', error);
        // Keep defaults on error
      }
    };

    loadMenus();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      // 1. Set Date
      setDateStr(new Date().toLocaleDateString("en-US", { 
        weekday: "long", 
        month: "long", 
        day: "numeric", 
        year: "numeric" 
      }));

      // 2. Load settings from localStorage
      if (!initialSettings && typeof window !== 'undefined') {
        const cached = localStorage.getItem('wnc_settings');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const newSettings = {
              tagline: parsed.tagline || "Engaging Our Community",
              logoUrl: parsed.logoUrl || "",
              brandingMode: parsed.brandingMode || "text",
              showTagline: parsed.showTagline !== undefined ? parsed.showTagline : true,
              primaryColor: parsed.primaryColor || "#1d4ed8",
            };
            setSettings(newSettings);
            setSettingsLoaded(true);
          } catch {}
        }
      }

      // 3. Sync with Firestore
      try {
        const settingsDoc = await getDoc(doc(getDb(), "settings", "config"));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          const newSettings = {
            tagline: data.tagline || "Engaging Our Community",
            logoUrl: data.logoUrl || "",
            brandingMode: data.brandingMode || "text",
            showTagline: data.showTagline !== undefined ? data.showTagline : true,
            primaryColor: data.primaryColor || "#1d4ed8",
          };
          setSettings(newSettings);
          localStorage.setItem('wnc_settings', JSON.stringify(data));
        }
        setSettingsLoaded(true);
      } catch (error) {
        console.error("[Header] Failed to load settings:", error);
        setSettingsLoaded(true);
      }
    };

    loadData();

    // 4. Click listener
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [initialSettings]);

  // Use settings, fallback to initialSettings, then defaults
  const displaySettings = settings || initialSettings || {
    tagline: "Engaging Our Community",
    logoUrl: "",
    brandingMode: "text" as const,
    showTagline: true,
    primaryColor: "#1d4ed8",
  };

  const handleLogout = async () => {
    await signOut();
    setUserMenuOpen(false);
    router.push("/");
  };

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigatingToAdmin(true);
    setUserMenuOpen(false);
    router.push("/admin");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const showLogoImage = displaySettings.brandingMode === "logo" && displaySettings.logoUrl;
  const isDataUrl = displaySettings.logoUrl?.startsWith("data:");

  // Reset logo loaded state when URL changes
  useEffect(() => {
    if (displaySettings.logoUrl) {
      setLogoImageLoaded(false);
    }
  }, [displaySettings.logoUrl]);

  return (
    <>
    <header className="flex flex-col w-full bg-white dark:bg-slate-900 font-sans relative z-40">
      {/* Top Bar */}
      <div className="bg-slate-900 text-gray-300 text-xs border-b border-gray-800">
        <div className="container mx-auto px-4 h-10 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <WeatherWidget />
            <span className="hidden md:inline text-gray-500">|</span>
            <span className="hidden md:block text-gray-400">
              {dateStr}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-4">
              {topNav.map((item) => (
                <Link key={item.label} href={item.path} className="hover:text-white uppercase text-[10px] lg:text-xs font-medium transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-3 pl-4 border-l border-gray-700">
              {mounted && (
                <button onClick={toggleColorMode} className="hover:text-white transition-colors" title={colorMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                  {colorMode === "light" ? <Moon size={14} /> : <Sun size={14} />}
                </button>
              )}

              <div className="relative" ref={menuRef}>
                {mounted ? (
                  currentUser ? (
                    <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-green-500 ring-offset-1 ring-offset-slate-900">
                          {userProfile?.photoURL || currentUser.photoURL ? (
                            <Image
                              src={userProfile?.photoURL || currentUser.photoURL || ''}
                              alt={currentUser.displayName || "User"}
                              width={28}
                              height={28}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                              {(currentUser.displayName?.[0] || currentUser.email?.[0] || "U").toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-slate-900"></span>
                      </div>
                    </button>
                  ) : (
                    <Link href="/login" className="flex items-center text-amber-400 font-bold hover:text-white transition-colors">
                      <UserIcon size={14} className="mr-1" />
                      <span className="hidden md:inline">Login</span>
                    </Link>
                  )
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 animate-pulse" />
                )}

                {mounted && userMenuOpen && currentUser && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border overflow-hidden z-50">
                    <div className="px-4 py-3 border-b dark:border-slate-700 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        {userProfile?.photoURL || currentUser.photoURL ? (
                          <Image
                            src={userProfile?.photoURL || currentUser.photoURL || ''}
                            alt={currentUser.displayName || "User"}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                            {(currentUser.displayName?.[0] || currentUser.email?.[0] || "U").toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentUser.displayName || "User"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                      </div>
                    </div>
                    <Link href="/account" className="px-4 py-2 text-sm flex items-center hover:bg-gray-100 dark:hover:bg-slate-700" onClick={() => setUserMenuOpen(false)}>
                      <UserIcon size={14} className="mr-2 text-emerald-600" /> My Account
                    </Link>
                    <button onClick={handleAdminClick} className="w-full text-left px-4 py-2 text-sm flex items-center hover:bg-gray-100 dark:hover:bg-slate-700">
                      <LayoutDashboard size={14} className="mr-2 text-blue-600" /> Admin Panel
                    </button>
                    <div className="border-t dark:border-slate-700">
                      <button
                        onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                        className="w-full px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        <span className="flex items-center">
                          <Palette size={14} className="mr-2 text-purple-600" /> Color Theme
                        </span>
                        <ChevronRight size={14} className={`transition-transform ${themeMenuOpen ? 'rotate-90' : ''}`} />
                      </button>
                      {themeMenuOpen && (
                        <div className="px-2 py-2 bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-700">
                          <ThemeSelector variant="dropdown" showLabel={false} />
                        </div>
                      )}
                    </div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 flex items-center hover:bg-red-50 dark:hover:bg-red-900/20 border-t dark:border-slate-700">
                      <LogOut size={14} className="mr-2" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breaking News Ticker */}
      <BreakingNews />

      {/* Logo Area with Weather Module */}
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-5 bg-white dark:bg-slate-900">
        {/* Logo - Left justified, max 90px tall */}
        <Link href="/" className="h-[90px] flex items-center shrink-0 relative">
          {showLogoImage ? (
            <>
              {/* Placeholder while image loads */}
              {!logoImageLoaded && (
                <div className="h-[90px] w-[200px] bg-transparent" />
              )}
              {/* Actual image - hidden until loaded */}
              <Image
                src={displaySettings.logoUrl}
                alt="Site Logo"
                width={300}
                height={90}
                unoptimized={!!isDataUrl}
                priority
                onLoad={() => setLogoImageLoaded(true)}
                className={`max-h-[90px] w-auto object-contain object-left transition-opacity duration-200 ${!logoImageLoaded ? 'opacity-0 absolute' : 'opacity-100'}`}
              />
            </>
          ) : (
            <div className="flex flex-col items-start justify-center h-full">
              <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight text-gray-900 dark:text-white leading-none">
                WNC TIMES
              </h1>
              {displaySettings.showTagline && (
                <span
                  className="mt-1.5 px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white bg-blue-700 dark:bg-slate-800"
                  style={mounted ? { backgroundColor: colorMode === 'dark' ? currentTheme.colors.navBarDark : currentTheme.colors.navBar } : undefined}
                >
                  {displaySettings.tagline}
                </span>
              )}
            </div>
          )}
        </Link>

        {/* Weather Module - Center, 90px tall */}
        <div className="hidden md:flex items-center justify-center">
          <WeatherWidget variant="full" />
        </div>

        {/* Banner Ad - Right justified, 90px tall */}
        <div className="hidden lg:flex shrink-0 h-[90px] items-center">
          <AdDisplay
            position="header_main"
            className="h-[90px]"
            fallback={
              <a href={BANNER_LINK} target="_blank" rel="noopener noreferrer">
                <Image
                  src={BANNER_IMAGE}
                  alt="Farrington Development - Web Design"
                  width={728}
                  height={90}
                  className="rounded h-[90px] w-auto"
                />
              </a>
            }
          />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sticky top-0 z-30 shadow-md bg-blue-700 dark:bg-slate-800" style={mounted ? { backgroundColor: colorMode === 'dark' ? currentTheme.colors.navBarDark : currentTheme.colors.navBar } : undefined}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            {/* Left: Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {mainNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.path}
                  className="group relative px-4 py-2 text-sm font-bold text-white uppercase tracking-wider transition-all duration-300 hover:text-amber-300"
                >
                  <span className="relative z-10">{item.label}</span>
                  {/* Animated underline */}
                  <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-amber-400 transition-all duration-300 ease-out group-hover:w-4/5 group-hover:left-[10%] opacity-0 group-hover:opacity-100"></span>
                  {/* Subtle glow on hover */}
                  <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded transition-all duration-300"></span>
                </Link>
              ))}
            </div>

            {/* Right: Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-64 lg:w-72 pl-9 pr-3 py-1.5 text-sm border-0 rounded bg-white/20 text-white placeholder-gray-300 focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 focus:ring-2 focus:ring-white/50 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-white text-gray-800 text-sm font-bold rounded hover:bg-gray-100 transition-colors"
                title="Search"
              >
                <Search size={16} />
              </button>
              <Link
                href="/search?advanced=true"
                className="px-3 py-1.5 bg-amber-500 text-white text-sm font-bold rounded hover:bg-amber-600 transition-colors flex items-center gap-1"
                title="Advanced Search"
              >
                <SlidersHorizontal size={14} />
                <span className="hidden lg:inline">Advanced</span>
              </Link>
            </form>

            {/* Mobile: Menu Toggle */}
            <div className="md:hidden flex items-center justify-between w-full">
              <span className="text-white font-bold uppercase text-sm">Sections</span>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-1 hover:bg-white/20 rounded">
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 absolute w-full left-0 shadow-xl border-t dark:border-slate-800">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {/* Mobile Search */}
              <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }} className="flex gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-slate-800">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded">
                  Go
                </button>
                <Link href="/search" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" onClick={() => setMobileOpen(false)}>
                  <SlidersHorizontal size={16} className="text-gray-600 dark:text-gray-300" />
                </Link>
              </form>
              {[...topNav, ...mainNav].map((item) => (
                <Link key={item.label} href={item.path} className="block px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 rounded border-b border-gray-100 dark:border-slate-800 last:border-0" onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>

    {/* Admin Loading Overlay */}
    {isNavigatingToAdmin && (
      <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          {/* Spinner */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>

          {/* Loading text */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading Admin Panel
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please wait while we prepare your dashboard...
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Header;
