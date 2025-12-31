"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MapPin, Send, MessageCircle, Heart, AlertTriangle, Calendar, HelpCircle, Info, ChevronDown, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { communityService } from '@/lib/community';
import { CommunityPost } from '@/types/article';

// Declare Leaflet types for CDN usage
declare const L: any;
declare global {
  interface Window {
    L?: any;
  }
}

export default function Community() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<CommunityPost['type']>('general');
  const [hasLocation, setHasLocation] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Map Refs
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  // Load posts on mount
  useEffect(() => {
    setPosts(communityService.getPosts());
  }, []);

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

  // Update Markers when posts change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    posts.filter(p => p.location).forEach(post => {
      if (!post.location) return;

      const isActive = activePostId === post.id;
      const config = getPostTypeConfig(post.type);

      const iconHtml = `
        <div class="relative flex flex-col items-center transition-transform duration-300 ${isActive ? 'scale-125 z-50' : 'scale-100'}">
          ${(post.type === 'alert' || post.type === 'crime') ? `<span class="absolute inline-flex h-full w-full rounded-full ${post.type === 'crime' ? 'bg-purple-400' : 'bg-red-400'} opacity-75 animate-ping"></span>` : ''}
          <div class="relative p-1.5 rounded-full shadow-md text-white border-2 border-white ${config.pinColor} flex items-center justify-center" style="width: 32px; height: 32px;">
            ${getIconSvgString(post.type)}
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

      const marker = L.marker([post.location.lat, post.location.lng], { icon: customIcon })
        .addTo(mapRef.current!)
        .on('click', () => {
          setActivePostId(post.id);
          mapRef.current?.setView([post.location!.lat, post.location!.lng], 15);
        });

      markersRef.current[post.id] = marker;
    });
  }, [posts, activePostId, mapLoaded]);

  // Pan map when activePostId changes
  useEffect(() => {
    if (activePostId && mapRef.current && markersRef.current[activePostId]) {
      const post = posts.find(p => p.id === activePostId);
      if (post && post.location) {
        mapRef.current.setView([post.location.lat, post.location.lng], 15, {
          animate: true
        });
      }
    }
  }, [activePostId, posts]);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPostContent.trim()) return;

    const postData: Omit<CommunityPost, 'id' | 'timestamp' | 'likes' | 'comments'> = {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
      content: newPostContent,
      type: newPostType,
    };

    if (hasLocation) {
      (postData as CommunityPost).location = {
        lat: 35.5951 + (Math.random() * 0.04 - 0.02),
        lng: -82.5515 + (Math.random() * 0.04 - 0.02),
        name: "Pinned Location"
      };
    }

    const newPost = communityService.createPost(postData);
    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setHasLocation(false);
    setActivePostId(newPost.id);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  const getPostTypeConfig = (type: CommunityPost['type']) => {
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

  const visiblePosts = posts.slice(0, visibleCount);

  return (
    <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* LEFT COLUMN: FEED */}
        <div className="lg:w-2/3 flex flex-col w-full">

          {/* Header */}
          <div className="mb-6 flex justify-between items-end border-b border-gray-200 pb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900">Community Feed</h1>
              <p className="text-gray-500 text-sm mt-1">Real-time updates, alerts, and local chatter.</p>
            </div>
            {!currentUser && (
              <Link href="/login" className="text-blue-600 font-bold text-sm underline">Log in to Post</Link>
            )}
          </div>

          {/* Create Post Widget */}
          {currentUser && (
            <div className="bg-white p-4 rounded shadow-sm border border-gray-200 mb-8">
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                </div>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={`What's happening?`}
                  className="flex-grow bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-600 resize-none h-24 text-sm"
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <select
                    value={newPostType}
                    onChange={(e) => setNewPostType(e.target.value as CommunityPost['type'])}
                    className="bg-gray-100 text-xs font-bold px-2 py-1 rounded border border-gray-200 focus:outline-none"
                  >
                    <option value="general">General Info</option>
                    <option value="alert">Alert / Hazard</option>
                    <option value="crime">Crime / Incident</option>
                    <option value="event">Event</option>
                    <option value="question">Question</option>
                  </select>
                  <button
                    onClick={() => setHasLocation(!hasLocation)}
                    className={`flex items-center text-xs font-bold px-2 py-1 rounded border transition-colors ${hasLocation ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                  >
                    <MapPin size={12} className="mr-1" /> {hasLocation ? 'Location Added' : 'Add Location'}
                  </button>
                </div>
                <button
                  onClick={handlePostSubmit}
                  disabled={!newPostContent.trim()}
                  className="bg-blue-600 text-white px-6 py-1.5 rounded font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Feed List */}
          <div className="space-y-6">
            {visiblePosts.map(post => {
              const config = getPostTypeConfig(post.type);
              return (
                <div
                  key={post.id}
                  className={`bg-white p-6 rounded shadow-sm border transition-all duration-300 cursor-pointer
                    ${activePostId === post.id ? `border-l-4 ${config.border.replace('border', 'border-l')} ring-1 ring-gray-200` : 'border-gray-200 border-l-4 border-l-transparent hover:border-gray-300'}
                  `}
                  onClick={() => setActivePostId(post.id)}
                  onMouseEnter={() => setActivePostId(post.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{post.userName}</span>
                      <span className="text-xs text-gray-500">• {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`flex items-center text-xs px-2 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
                      {config.icon}
                      <span className="ml-1 uppercase font-bold text-[10px]">{post.type}</span>
                    </div>
                  </div>
                  <p className="text-gray-800 mb-4 leading-relaxed text-sm md:text-base">{post.content}</p>
                  {post.location && (
                    <div className="flex items-center text-xs text-blue-600 mb-4 bg-blue-50 inline-block px-3 py-1 rounded border border-blue-100">
                      <MapPin size={12} className="mr-1" />
                      Near {post.location.name}
                    </div>
                  )}
                  <div className="flex items-center gap-6 text-gray-400 text-sm pt-4 border-t border-gray-50">
                    <button className="flex items-center hover:text-red-500 transition font-medium"><Heart size={16} className="mr-1.5" /> {post.likes}</button>
                    <button className="flex items-center hover:text-blue-500 transition font-medium"><MessageCircle size={16} className="mr-1.5" /> {post.comments}</button>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {visiblePosts.length < posts.length && (
              <button
                onClick={handleLoadMore}
                className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded border border-gray-200 hover:bg-gray-200 transition flex items-center justify-center"
              >
                Load More Activity <ChevronDown size={16} className="ml-2" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MAP */}
        <div className="lg:w-1/3 hidden lg:flex flex-col h-[600px] sticky top-24">
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden relative shadow-lg h-full flex flex-col">
            <div className="relative z-10 p-3 bg-white border-b border-gray-200 shadow-sm flex justify-between items-center gap-4">
              <h3 className="font-bold text-gray-800 flex items-center text-sm whitespace-nowrap"><MapPin size={16} className="mr-2 text-red-600" /> Live Map</h3>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Real-Time Updates</span>
            </div>

            {/* Leaflet Map Target */}
            <div className="relative flex-grow w-full h-full z-0" ref={mapContainerRef}>
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            <div className="relative z-10 p-2 bg-white/90 text-[10px] text-center text-gray-500 border-t border-gray-200">
              Use mouse to drag, scroll to zoom.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
