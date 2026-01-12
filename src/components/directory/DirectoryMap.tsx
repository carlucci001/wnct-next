'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Info, RefreshCw } from 'lucide-react';
import { Business } from '@/types/business';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import NextImage from 'next/image';
import { Badge } from '@/components/ui/badge';

// Simple Leaflet interfaces for CDN usage
interface Leaflet {
  map: (el: HTMLElement, options?: { zoomControl?: boolean; attributionControl?: boolean }) => {
    setView: (latlng: [number, number], zoom: number, options?: { animate?: boolean }) => void;
    fitBounds: (bounds: any, options?: { pad?: number }) => void;
    remove: () => void;
  };
  tileLayer: (url: string, options?: { attribution?: string }) => { addTo: (map: any) => void };
  marker: (latlng: [number, number], options?: { icon: any }) => any;
  divIcon: (options: { className: string; html: string; iconSize: [number, number]; iconAnchor: [number, number] }) => any;
  control: { zoom: (options: { position: string }) => { addTo: (map: any) => void } };
  featureGroup: (layers: any[]) => { getBounds: () => any };
}

declare const L: Leaflet;

interface DirectoryMapProps {
  businesses: Business[];
  className?: string;
}

export function DirectoryMap({ businesses, className = '' }: DirectoryMapProps) {
  const [hoveredBusiness, setHoveredBusiness] = useState<Business | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  // Memoize ASHEVILLE_LAT_LNG to avoid re-triggering effects unnecessarily
  const ASHEVILLE_LAT_LNG = React.useMemo<[number, number]>(() => [35.5951, -82.5515], []);

  // Load Leaflet Assets
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if Leaflet is already loaded
    if ((window as any).L) {
      const timer = setTimeout(() => setMapLoaded(true), 0);
      return () => clearTimeout(timer);
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Clean up scripts if component unmounts before loading
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(ASHEVILLE_LAT_LNG, 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current);

    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapLoaded, ASHEVILLE_LAT_LNG]);

  // Handle Markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    businesses.forEach((business) => {
      const lat = business.coordinates?.lat;
      const lng = business.coordinates?.lng;

      if (lat && lng) {
        const iconHtml = `
          <div class="relative flex flex-col items-center transition-transform duration-300 hover:scale-125 cursor-pointer">
            <div class="p-1 px-2 rounded-full shadow-lg text-white border-2 border-white ${business.featured ? 'bg-yellow-500' : 'bg-primary'} flex items-center justify-center whitespace-nowrap text-[10px] font-bold">
              <span class="mr-1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></span>
              ${business.name.substring(0, 10)}${business.name.length > 10 ? '..' : ''}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-business-marker',
          html: iconHtml,
          iconSize: [80, 24],
          iconAnchor: [40, 24]
        });

        const markerInstance = L.marker([lat, lng], { icon: customIcon })
          .addTo(mapRef.current);
        
        markerInstance.on('mouseover', () => setHoveredBusiness(business));
        markerInstance.on('click', () => {
             setHoveredBusiness(business);
             mapRef.current.setView([lat, lng], 15, { animate: true });
        });

        markersRef.current[business.id] = markerInstance;
      }
    });

    // Fit bounds if markers exist
    const markerArray = Object.values(markersRef.current);
    if (markerArray.length > 0) {
      try {
        const group = L.featureGroup(markerArray);
        mapRef.current.fitBounds(group.getBounds(), { pad: 0.1 });
      } catch (e) {
        // Silently fail if bounds cannot be fit
      }
    }
  }, [businesses, mapLoaded]);

  return (
    <Card className={`relative overflow-hidden bg-muted/10 group ${className}`}>
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0 bg-[#f8f9fa] dark:bg-zinc-900 z-0"
        onMouseLeave={() => setHoveredBusiness(null)}
      />

      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-8 w-8 rounded-full shadow-sm bg-white/80 backdrop-blur-sm hover:bg-white"
          onClick={() => mapRef.current?.setView(ASHEVILLE_LAT_LNG, 11, { animate: true })}
        >
          <RefreshCw size={14} className="text-muted-foreground" />
        </Button>
      </div>

      {/* Hover Info Card */}
      {hoveredBusiness && (
        <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-auto">
          <Card className="p-3 shadow-xl backdrop-blur-md bg-white/95 dark:bg-zinc-900/95 border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Link href={`/directory/${hoveredBusiness.slug}`} className="flex gap-3">
              <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden shrink-0 border border-border">
                {hoveredBusiness.logo ? (
                  <NextImage 
                    src={hoveredBusiness.logo} 
                    alt={hoveredBusiness.name} 
                    width={48} 
                    height={48} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-bold text-lg">
                    {hoveredBusiness.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm truncate pr-4">{hoveredBusiness.name}</h4>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider flex items-center gap-1 mt-0.5">
                  <Info size={10} className="text-primary" /> {hoveredBusiness.category}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                    View Details <ExternalLink size={10} />
                  </span>
                </div>
              </div>
            </Link>
          </Card>
        </div>
      )}

      {/* Overlay info */}
      {!hoveredBusiness && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-white/80 backdrop-blur-sm text-zinc-900 dark:bg-zinc-900/80 dark:text-zinc-100 hover:bg-white border-primary/10 shadow-sm text-[10px] uppercase font-bold tracking-wider py-0.5 pointer-events-none">
            {businesses.length} Businesses
          </Badge>
        </div>
      )}
      
      {/* Aspect ratio control */}
      <div className="aspect-square w-full pointer-events-none" />
    </Card>
  );
}
