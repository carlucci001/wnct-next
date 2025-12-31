"use client";

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Star } from 'lucide-react';
import { Business } from '@/types/article';

interface DirectoryCardProps {
  business: Business;
}

export default function DirectoryCard({ business }: DirectoryCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <div className="h-48 overflow-hidden relative">
        <Image
          src={business.imageUrl}
          alt={business.name}
          fill
          className="object-cover transition duration-500 hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      </div>
      <div className="p-5 flex flex-col grow">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {business.category}
          </span>
          <div className="flex items-center text-yellow-400 text-xs">
            <Star size={12} fill="currentColor" className="mr-1" />
            <span className="font-bold text-gray-700">{business.rating.toFixed(1)}</span>
          </div>
        </div>

        <Link href={`/directory/${business.id}`} className="block mb-2">
          <h3 className="font-serif text-lg font-bold text-gray-900 hover:text-blue-600 transition">
            {business.name}
          </h3>
        </Link>

        <p className="text-sm text-gray-500 mb-4 line-clamp-2 grow">{business.description}</p>

        <div className="mt-auto space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-3">
          <div className="flex items-start">
            <MapPin size={14} className="mr-2 mt-0.5 text-yellow-600 shrink-0" />
            <span>{business.address}</span>
          </div>
          <div className="flex items-center">
            <Phone size={14} className="mr-2 text-yellow-600 shrink-0" />
            <span>{business.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
