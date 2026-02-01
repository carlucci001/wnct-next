"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

interface NavItem {
  label: string;
  path: string;
}

interface SiteConfigPublic {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  contact: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  social: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  newsletter: {
    enabled: boolean;
  };
}

// Default site config (fallback)
const DEFAULT_CONFIG: SiteConfigPublic = {
  siteName: 'WNC Times',
  siteTagline: 'Your Community, Your News',
  siteDescription: 'WNC Times provides the latest news, business insights, and lifestyle stories from across Western North Carolina.',
  contact: {
    email: 'carlfarring@gmail.com',
    phone: '(828) 555-0123',
    address: {
      street: '123 Main Street',
      city: 'Asheville',
      state: 'NC',
      zip: '28801',
    },
  },
  social: {},
  branding: {
    primaryColor: '#1d4ed8',
    secondaryColor: '#1e293b',
    accentColor: '#f59e0b',
  },
  newsletter: {
    enabled: true,
  },
};

// Default footer menus (fallback if API fails)
const DEFAULT_QUICK_LINKS = [
  { label: "About Us", path: "/about" },
  { label: "Advertise With Us", path: "/advertise" },
  { label: "Contact Us", path: "/contact" },
  { label: "Business Directory", path: "/directory" },
  { label: "Subscribe", path: "/subscribe" },
  { label: "Privacy Policy", path: "/privacy" },
  { label: "Terms of Use", path: "/terms" },
  { label: "Staff Login", path: "/admin" },
];

const DEFAULT_CATEGORIES = [
  { label: "Local News", path: "/category/news" },
  { label: "Business", path: "/category/business" },
  { label: "Outdoors", path: "/category/outdoors" },
  { label: "Arts & Culture", path: "/category/arts" },
  { label: "Food & Drink", path: "/category/food" },
  { label: "Real Estate", path: "/category/realestate" },
];

const Footer: React.FC = () => {
  // Site configuration
  const [config, setConfig] = useState<SiteConfigPublic>(DEFAULT_CONFIG);

  // Dynamic navigation menus
  const [quickLinks, setQuickLinks] = useState<NavItem[]>(DEFAULT_QUICK_LINKS);
  const [categories, setCategories] = useState<NavItem[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    // Load site config
    const loadSiteConfig = async () => {
      try {
        const response = await fetch('/api/site-config');
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(prev => ({ ...prev, ...data.config }));
        }
      } catch (error) {
        console.error('Failed to load site config:', error);
      }
    };

    // Load menus
    const loadMenus = async () => {
      try {
        const response = await fetch('/api/menus');
        const data = await response.json();
        if (data.success && data.menus) {
          const quickLinksMenu = data.menus.find((m: { slug: string }) => m.slug === 'footer-quick-links');
          const categoriesMenu = data.menus.find((m: { slug: string }) => m.slug === 'footer-categories');

          if (quickLinksMenu?.items?.length > 0) {
            setQuickLinks(quickLinksMenu.items.map((item: { label: string; path: string }) => ({
              label: item.label,
              path: item.path,
            })));
          }
          if (categoriesMenu?.items?.length > 0) {
            setCategories(categoriesMenu.items.map((item: { label: string; path: string }) => ({
              label: item.label,
              path: item.path,
            })));
          }
        }
      } catch (error) {
        console.error('Failed to load footer menus:', error);
      }
    };

    loadSiteConfig();
    loadMenus();
  }, []);

  const primaryColor = config.branding?.primaryColor || '#1d4ed8';
  const accentColor = config.branding?.accentColor || '#f59e0b';

  // Build social links array from config
  const socialLinks = [];
  if (config.social?.facebook) socialLinks.push({ Icon: Facebook, url: config.social.facebook, name: 'Facebook' });
  if (config.social?.twitter) socialLinks.push({ Icon: Twitter, url: config.social.twitter, name: 'Twitter' });
  if (config.social?.instagram) socialLinks.push({ Icon: Instagram, url: config.social.instagram, name: 'Instagram' });
  if (config.social?.linkedin) socialLinks.push({ Icon: Linkedin, url: config.social.linkedin, name: 'LinkedIn' });
  if (config.social?.youtube) socialLinks.push({ Icon: Youtube, url: config.social.youtube, name: 'YouTube' });

  // If no social links configured, show placeholder icons
  const showPlaceholderSocial = socialLinks.length === 0;

  return (
    <footer className="footer-root bg-slate-900 text-gray-300 font-sans border-t-4" style={{ borderTopColor: primaryColor }}>
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 px-4 pt-16">

        {/* About */}
        <div>
          <h3 className="text-white font-serif text-xl font-bold mb-6 border-b-2 inline-block pb-2" style={{ borderBottomColor: primaryColor }}>
            About Us
          </h3>
          <p className="text-sm leading-relaxed mb-6 text-gray-400">
            {config.siteDescription}
          </p>
          <div className="flex flex-col space-y-3 text-sm mb-6">
            <div className="flex items-center">
              <MapPin size={16} className="mr-2 flex-shrink-0" style={{ color: accentColor }} />
              <span>{config.contact.address.city}, {config.contact.address.state} {config.contact.address.zip}</span>
            </div>
            <div className="flex items-center">
              <Phone size={16} className="mr-2 flex-shrink-0" style={{ color: accentColor }} />
              <a href={`tel:${config.contact.phone}`} className="hover:text-white">{config.contact.phone}</a>
            </div>
            <div className="flex items-center">
              <Mail size={16} className="mr-2 flex-shrink-0" style={{ color: accentColor }} />
              <a href={`mailto:${config.contact.email}`} className="hover:text-white">{config.contact.email}</a>
            </div>
          </div>
          <div className="flex space-x-4">
            {showPlaceholderSocial ? (
              // Show placeholder icons when no social links configured
              [Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
                <span key={idx} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 cursor-not-allowed opacity-50">
                  <Icon size={16} />
                </span>
              ))
            ) : (
              // Show actual social links
              socialLinks.map(({ Icon, url, name }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:opacity-80 transition"
                  style={{ backgroundColor: primaryColor }}
                  aria-label={name}
                >
                  <Icon size={16} />
                </a>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-serif text-xl font-bold mb-6 border-b-2 inline-block pb-2" style={{ borderBottomColor: primaryColor }}>
            Quick Links
          </h3>
          <ul className="space-y-3 text-sm">
            {quickLinks.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`hover:text-white ${
                    item.path === '/advertise' ? 'font-bold' :
                    item.path === '/admin' ? '' : ''
                  }`}
                  style={item.path === '/advertise' ? { color: primaryColor.replace('#1d4ed8', '#60a5fa') } :
                         item.path === '/admin' ? { color: accentColor } : {}}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-white font-serif text-xl font-bold mb-6 border-b-2 inline-block pb-2" style={{ borderBottomColor: primaryColor }}>
            Categories
          </h3>
          <ul className="space-y-3 text-sm">
            {categories.map((item) => (
              <li key={item.path}>
                <Link href={item.path} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        {config.newsletter?.enabled && (
          <div>
            <h3 className="text-white font-serif text-xl font-bold mb-6 border-b-2 inline-block pb-2" style={{ borderBottomColor: primaryColor }}>
              Newsletter
            </h3>
            <p className="text-sm text-gray-400 mb-4">Subscribe to our weekly newsletter for the latest news.</p>
            <form className="flex flex-col space-y-3">
              <input
                type="email"
                placeholder="Your Email Address"
                className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded text-sm placeholder-gray-500 focus:outline-none"
                style={{ borderColor: 'rgb(55, 65, 81)' }}
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = 'rgb(55, 65, 81)'}
              />
              <button
                type="submit"
                className="text-white font-bold py-2 rounded text-sm uppercase hover:brightness-110 transition"
                style={{ backgroundColor: primaryColor }}
              >
                Subscribe
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="border-t border-gray-800 mt-8 pt-8 pb-8">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 px-4 gap-4">
          <p>&copy; {new Date().getFullYear()} {config.siteName}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-gray-300">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
