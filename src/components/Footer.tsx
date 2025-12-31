"use client";

import React from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer: React.FC = () => {
  const primaryColor = "#1d4ed8";

  return (
    <footer className="bg-slate-900 text-gray-300 pt-16 pb-8 font-sans border-t-4" style={{ borderTopColor: primaryColor }}>
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 px-4">

        {/* About */}
        <div>
          <h3 className="text-white font-serif text-xl font-bold mb-6 border-b-2 inline-block pb-2" style={{ borderBottomColor: primaryColor }}>
            About Us
          </h3>
          <p className="text-sm leading-relaxed mb-6 text-gray-400">
            WNC Times provides the latest news, business insights, and lifestyle stories from across Western North Carolina.
          </p>
          <div className="flex flex-col space-y-3 text-sm mb-6">
            <div className="flex items-center"><MapPin size={16} className="mr-2 text-amber-400" /> Asheville, NC 28801</div>
            <div className="flex items-center"><Phone size={16} className="mr-2 text-amber-400" /> (828) 555-0123</div>
            <div className="flex items-center"><Mail size={16} className="mr-2 text-amber-400" /> editor@wnctimes.com</div>
          </div>
          <div className="flex space-x-4">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
              <a key={idx} href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:bg-blue-600 transition">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-serif text-xl font-bold mb-6 border-b-2 inline-block pb-2" style={{ borderBottomColor: primaryColor }}>
            Quick Links
          </h3>
          <ul className="space-y-3 text-sm">
            <li><Link href="/about" className="hover:text-white">About WNC Times</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
            <li><Link href="/directory" className="hover:text-white">Business Directory</Link></li>
            <li><Link href="/subscribe" className="hover:text-white">Subscribe</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/admin" className="hover:text-white text-amber-400">Staff Login</Link></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-white font-serif text-xl font-bold mb-6 border-b-2 inline-block pb-2" style={{ borderBottomColor: primaryColor }}>
            Categories
          </h3>
          <ul className="space-y-3 text-sm">
            <li><Link href="/category/news" className="hover:text-white">Local News</Link></li>
            <li><Link href="/category/business" className="hover:text-white">Business</Link></li>
            <li><Link href="/category/outdoors" className="hover:text-white">Outdoors</Link></li>
            <li><Link href="/category/arts" className="hover:text-white">Arts & Culture</Link></li>
            <li><Link href="/category/food" className="hover:text-white">Food & Drink</Link></li>
            <li><Link href="/category/realestate" className="hover:text-white">Real Estate</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-white font-serif text-xl font-bold mb-6 border-b-2 inline-block pb-2" style={{ borderBottomColor: primaryColor }}>
            Newsletter
          </h3>
          <p className="text-sm text-gray-400 mb-4">Subscribe to our weekly newsletter for the latest WNC news.</p>
          <form className="flex flex-col space-y-3">
            <input type="email" placeholder="Your Email Address" className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded text-sm placeholder-gray-500 focus:border-blue-600 focus:outline-none" />
            <button className="text-white font-bold py-2 rounded text-sm uppercase hover:brightness-110" style={{ backgroundColor: primaryColor }}>
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-8 pt-8">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 px-4">
          <p>&copy; {new Date().getFullYear()} WNC Times. All rights reserved.</p>
          <span>Powered by Next.js & Tailwind</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
