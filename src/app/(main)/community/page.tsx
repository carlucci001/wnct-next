"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MapPin, MessageCircle, Heart, AlertTriangle, Calendar, HelpCircle, Info, ChevronDown, ShieldAlert, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCommunityPosts,
  createCommunityPost,
  likePost,
  unlikePost,
  CommunityPostData,
} from '@/lib/communityPosts';
import { Timestamp } from 'firebase/firestore';

// Declare Leaflet types for CDN usage
declare const L: any;
declare global {
  interface Window {
    L?: any;
  }
}

// Map CommunityPostData topic to display type
type PostType = 'general' | 'alert' | 'event' | 'question' | 'crime';

export default function Community() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<CommunityPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<PostType>('general');
  const [hasLocation, setHasLocation] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Map Refs
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  // Load posts from Firestore on mount
  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await getCommunityPosts({ limit: 50 });
      setPosts(data);
    } catch (error) {
      console.error('Error loading community posts:', error);
    } finally {
      setLoading(false);
    }
  }

  // Load Leaflet CSS and JS from CDN
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.L) {
      setMapLoaded(true);
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup optional
    };
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapRef.current) return;

    const ASHEVILLE_LAT_LNG: [number, number] = [35.5951, -82.5515];

    const map = L.map(mapContainerRef.current).setView(ASHEVILLE_LAT_LNG, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Update Markers when posts change (placeholder for location support)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // For now, we'll add random markers for posts (location data can be added to schema later)
    posts.forEach((post, index) => {
      const isActive = activePostId === post.id;
      const config = getPostTypeConfig(post.topic as PostType);

      // Generate pseudo-random location based on post id for demo
      const lat = 35.5951 + (index * 0.003) - 0.01;
      const lng = -82.5515 + ((index % 5) * 0.005) - 0.01;

      const iconHtml = `
        <div class="relative flex flex-col items-center transition-transform duration-300 ${isActive ? 'scale-125 z-50' : 'scale-100'}">
          ${(post.topic === 'alert' || post.topic === 'crime') ? `<span class="absolute inline-flex h-full w-full rounded-full ${post.topic === 'crime' ? 'bg-purple-400' : 'bg-red-400'} opacity-75 animate-ping"></span>` : ''}
          <div class="relative p-1.5 rounded-full shadow-md text-white border-2 border-white ${config.pinColor} flex items-center justify-center" style="width: 32px; height: 32px;">
            ${getIconSvgString(post.topic)}
          </div>
          ${isActive ? `<div class="absolute top-full mt-1 bg-white text-gray-800 text-[10px] px-2 py-1 rounded shadow-xl text-center font-bold whitespace-nowrap z-50 border border-gray-200">${post.content.substring(0, 20)}...</div>` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(mapRef.current!)
        .on('click', () => {
          setActivePostId(post.id);
          mapRef.current?.setView([lat, lng], 15);
        });

      markersRef.current[post.id] = marker;
    });
  }, [posts, activePostId, mapLoaded]);

  // Pan map when activePostId changes
  useEffect(() => {
    if (activePostId && mapRef.current && markersRef.current[activePostId]) {
      const postIndex = posts.findIndex(p => p.id === activePostId);
      if (postIndex >= 0) {
        const lat = 35.5951 + (postIndex * 0.003) - 0.01;
        const lng = -82.5515 + ((postIndex % 5) * 0.005) - 0.01;
        mapRef.current.setView([lat, lng], 15, { animate: true });
      }
    }
  }, [activePostId, posts]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPostContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      await createCommunityPost({
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        authorPhoto: currentUser.photoURL || undefined,
        content: newPostContent,
        topic: newPostType,
      });

      setNewPostContent('');
      setHasLocation(false);
      await loadPosts(); // Reload posts from Firestore
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (post: CommunityPostData) => {
    if (!currentUser) return;

    const isLiked = post.likedBy?.includes(currentUser.uid);

    try {
      if (isLiked) {
        await unlikePost(post.id, currentUser.uid);
      } else {
        await likePost(post.id, currentUser.uid);
      }
      // Optimistic update
      setPosts(posts.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            likes: isLiked ? p.likes - 1 : p.likes + 1,
            likedBy: isLiked
              ? p.likedBy.filter(id => id !== currentUser.uid)
              : [...p.likedBy, currentUser.uid]
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  const getPostTypeConfig = (type: PostType) => {
    switch (type) {
      case 'alert':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-200',
          pinColor: 'bg-red-600',
          icon: <AlertTriangle size={18} strokeWidth={2.5} />
        };
      case 'crime':
        return {
          color: 'text-purple-600',
          bg: 'bg-purple-100',
          border: 'border-purple-200',
          pinColor: 'bg-purple-700',
          icon: <ShieldAlert size={18} strokeWidth={2.5} />
        };
      case 'event':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          border: 'border-green-200',
          pinColor: 'bg-green-600',
          icon: <Calendar size={18} strokeWidth={2.5} />
        };
      case 'question':
        return {
          color: 'text-orange-600',
          bg: 'bg-orange-100',
          border: 'border-orange-200',
          pinColor: 'bg-orange-500',
          icon: <HelpCircle size={18} strokeWidth={2.5} />
        };
      default:
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          border: 'border-blue-200',
          pinColor: 'bg-blue-500',
          icon: <Info size={18} strokeWidth={2.5} />
        };
    }
  };

  const getIconSvgString = (type: string) => {
    const size = 18;
    const stroke = 2.5;
    if (type === 'alert') return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`;
    if (type === 'crime') return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>`;
    if (type === 'event') return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>`;
    if (type === 'question') return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`;
  };

  const formatTimestamp = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const visiblePosts = posts.slice(0, visibleCount);

  return (
    <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* LEFT COLUMN: FEED */}
        <div className="lg:w-2/3 flex flex-col w-full">

          {/* Header */}
          <div className="mb-6 flex justify-between items-end border-b border-gray-200 dark:border-slate-700 pb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Community Feed</h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Real-time updates, alerts, and local chatter.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadPosts}
                className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 p-2"
                title="Refresh"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              {!currentUser && (
                <Link href="/login" className="text-blue-600 font-bold text-sm underline">Log in to Post</Link>
              )}
            </div>
          </div>

          {/* Create Post Widget */}
          {currentUser && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    (currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={`What's happening?`}
                  className="flex-grow bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg p-3 focus:outline-none focus:border-blue-600 resize-none h-24 text-sm text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <select
                    value={newPostType}
                    onChange={(e) => setNewPostType(e.target.value as PostType)}
                    className="bg-gray-100 dark:bg-slate-700 text-xs font-bold px-2 py-1 rounded border border-gray-200 dark:border-slate-600 focus:outline-none text-gray-900 dark:text-white"
                  >
                    <option value="general">General Info</option>
                    <option value="alert">Alert / Hazard</option>
                    <option value="crime">Crime / Incident</option>
                    <option value="event">Event</option>
                    <option value="question">Question</option>
                  </select>
                  <button
                    onClick={() => setHasLocation(!hasLocation)}
                    className={`flex items-center text-xs font-bold px-2 py-1 rounded border transition-colors ${hasLocation ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-600'}`}
                  >
                    <MapPin size={12} className="mr-1" /> {hasLocation ? 'Location Added' : 'Add Location'}
                  </button>
                </div>
                <button
                  onClick={handlePostSubmit}
                  disabled={!newPostContent.trim() || submitting}
                  className="bg-blue-600 text-white px-6 py-1.5 rounded font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw size={14} className="animate-spin" />}
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && posts.length === 0 && (
            <div className="text-center py-12">
              <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-500 dark:text-slate-400">Loading community posts...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && posts.length === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No posts yet</h3>
              <p className="text-gray-500 dark:text-slate-400 mb-4">Be the first to share something with the community!</p>
              {!currentUser && (
                <Link href="/login" className="text-blue-600 font-bold underline">Log in to create a post</Link>
              )}
            </div>
          )}

          {/* Feed List */}
          <div className="space-y-6">
            {visiblePosts.map(post => {
              const config = getPostTypeConfig(post.topic as PostType);
              const isLiked = currentUser && post.likedBy?.includes(currentUser.uid);
              return (
                <div
                  key={post.id}
                  className={`bg-white dark:bg-slate-800 p-6 rounded shadow-sm border transition-all duration-300 cursor-pointer
                    ${activePostId === post.id ? `border-l-4 ${config.border.replace('border', 'border-l')} ring-1 ring-gray-200 dark:ring-slate-600` : 'border-gray-200 dark:border-slate-700 border-l-4 border-l-transparent hover:border-gray-300 dark:hover:border-slate-600'}
                  `}
                  onClick={() => setActivePostId(post.id)}
                  onMouseEnter={() => setActivePostId(post.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {post.authorPhoto ? (
                        <img src={post.authorPhoto} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 font-bold text-sm">
                          {post.authorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-bold text-gray-900 dark:text-white">{post.authorName}</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">• {formatTimestamp(post.createdAt)}</span>
                      {post.pinned && (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">Pinned</span>
                      )}
                    </div>
                    <div className={`flex items-center text-xs px-2 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
                      {config.icon}
                      <span className="ml-1 uppercase font-bold text-[10px]">{post.topic}</span>
                    </div>
                  </div>
                  <p className="text-gray-800 dark:text-slate-200 mb-4 leading-relaxed text-sm md:text-base">{post.content}</p>
                  {post.images && post.images.length > 0 && (
                    <div className="mb-4 grid gap-2 grid-cols-2">
                      {post.images.map((img, i) => (
                        <img key={i} src={img} alt="" className="rounded-lg object-cover w-full h-32" />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-6 text-gray-400 dark:text-slate-500 text-sm pt-4 border-t border-gray-50 dark:border-slate-700">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLike(post); }}
                      className={`flex items-center transition font-medium ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                    >
                      <Heart size={16} className={`mr-1.5 ${isLiked ? 'fill-current' : ''}`} /> {post.likes}
                    </button>
                    <button className="flex items-center hover:text-blue-500 transition font-medium">
                      <MessageCircle size={16} className="mr-1.5" /> {post.commentsCount}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {visiblePosts.length < posts.length && (
              <button
                onClick={handleLoadMore}
                className="w-full py-4 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-bold rounded border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 transition flex items-center justify-center"
              >
                Load More Activity <ChevronDown size={16} className="ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MAP */}
        <div className="lg:w-1/3 hidden lg:flex flex-col h-[600px] sticky top-24">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden relative shadow-lg h-full flex flex-col">
            <div className="relative z-10 p-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm flex justify-between items-center gap-4">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center text-sm whitespace-nowrap"><MapPin size={16} className="mr-2 text-red-600" /> Live Map</h3>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">Real-Time Updates</span>
            </div>

            {/* Leaflet Map Target */}
            <div className="relative flex-grow w-full h-full z-0" ref={mapContainerRef}>
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-slate-900">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            <div className="relative z-10 p-2 bg-white/90 dark:bg-slate-800/90 text-[10px] text-center text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-700">
              Use mouse to drag, scroll to zoom.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
