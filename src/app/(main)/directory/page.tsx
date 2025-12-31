"use client";

import { useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import DirectoryCard from '@/components/DirectoryCard';
import { Business } from '@/types/article';
import { Search } from 'lucide-react';

// Mock business data
const BUSINESSES: Business[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `biz-${i}`,
  name: [
    'Mountain Brew Coffee',
    'Asheville Auto Works',
    'Blue Ridge Bistro',
    'Highland Hardware',
    'River Arts Gallery',
    'Downtown Dental',
    'Grove Park Grill',
    'Sunset Salon & Spa',
    'Appalachian Accounting',
    'Biltmore Books',
    'French Broad Fitness',
    'Smoky Mountain Outfitters'
  ][i],
  category: ['Dining', 'Services', 'Dining', 'Shopping', 'Arts', 'Medical', 'Dining', 'Services', 'Services', 'Shopping', 'Fitness', 'Shopping'][i],
  description: [
    'Locally roasted coffee in a cozy mountain atmosphere. Fresh pastries daily.',
    'Full service auto repair and maintenance. ASE certified mechanics.',
    'Farm-to-table Southern cuisine with stunning Blue Ridge views.',
    'Your neighborhood hardware store since 1952. Expert advice included.',
    'Contemporary art gallery featuring local WNC artists.',
    'Comprehensive dental care for the whole family.',
    'Classic American fare with a modern twist.',
    'Full service salon offering hair, nails, and spa treatments.',
    'Tax preparation and bookkeeping for small businesses.',
    'Independent bookstore specializing in local authors.',
    'State-of-the-art gym with personal training services.',
    'Outdoor gear and apparel for mountain adventures.'
  ][i],
  address: [
    '123 Broadway St, Asheville',
    '456 Tunnel Rd, Asheville',
    '789 Merrimon Ave, Asheville',
    '321 Haywood Rd, West Asheville',
    '555 Riverside Dr, Asheville',
    '100 Medical Park Dr, Asheville',
    '290 Macon Ave, Asheville',
    '415 Biltmore Ave, Asheville',
    '220 College St, Asheville',
    '55 Walnut St, Asheville',
    '888 Sweeten Creek Rd, Asheville',
    '1200 Patton Ave, Asheville'
  ][i],
  phone: `(828) 555-0${100 + i}`,
  imageUrl: `https://picsum.photos/id/${150 + i * 10}/400/300`,
  rating: 4.0 + (i % 10) / 10,
}));

const CATEGORIES = ['All Categories', 'Dining', 'Shopping', 'Services', 'Medical', 'Arts', 'Fitness'];

export default function DirectoryList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const filteredBusinesses = BUSINESSES.filter(biz => {
    const matchesSearch = biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      biz.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || biz.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 md:px-0 py-8">
      <Breadcrumbs />

      {/* Hero Banner */}
      <div className="bg-gray-900 text-white p-8 rounded-lg mb-12 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: "url('https://picsum.photos/id/10/1200/400')" }}
        ></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">WNC Business Directory</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Discover the best local businesses, restaurants, and services Western North Carolina has to offer.
          </p>
          <div className="max-w-xl mx-auto flex flex-col md:flex-row gap-2">
            <div className="relative flex-grow">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="What are you looking for?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded text-gray-900 focus:outline-none bg-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded font-bold uppercase tracking-wide transition">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-gray-600">
        Showing <span className="font-bold">{filteredBusinesses.length}</span> businesses
        {selectedCategory !== 'All Categories' && <span> in <span className="font-bold">{selectedCategory}</span></span>}
        {searchQuery && <span> matching &quot;{searchQuery}&quot;</span>}
      </div>

      {/* Business Grid */}
      {filteredBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBusinesses.map((biz) => (
            <DirectoryCard key={biz.id} business={biz} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No businesses found matching your criteria.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All Categories'); }}
            className="mt-4 text-blue-600 font-bold hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* CTA Section */}
      <div className="mt-12 p-8 bg-blue-50 border border-blue-100 rounded-lg text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Own a local business?</h3>
        <p className="text-gray-600 mb-6">Get listed in the WNC Times directory and reach thousands of locals every month.</p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition font-semibold">
          Add Your Business
        </button>
      </div>
    </div>
  );
}
