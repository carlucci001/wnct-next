"use client";

import React, { useState, useEffect } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Mail, Phone, MapPin, Loader2, Clock } from 'lucide-react';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '@/types/siteConfig';

const Contact: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/site-config');
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config);
        } else {
          setConfig(DEFAULT_SITE_CONFIG);
        }
      } catch (error) {
        console.error('Failed to load site config:', error);
        setConfig(DEFAULT_SITE_CONFIG);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const contact = config?.contact || DEFAULT_SITE_CONFIG.contact;
  const hours = config?.hours || DEFAULT_SITE_CONFIG.hours;
  const siteName = config?.siteName || DEFAULT_SITE_CONFIG.siteName;

  return (
    <div className="container mx-auto px-4 md:px-0 py-8">
      <Breadcrumbs />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Contact Info */}
        <div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mb-6">Contact Us</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            We&apos;d love to hear from you. Whether you have a news tip, advertising inquiry, or just want to say hello, please get in touch.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-6 mb-12">
              <div className="flex items-start">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4 text-blue-600 dark:text-blue-400">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Location</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {contact.address.street}<br />
                    {contact.address.city}, {contact.address.state} {contact.address.zip}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4 text-blue-600 dark:text-blue-400">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Call Us</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Main: {contact.phone}
                    {contact.fax && <><br />Fax: {contact.fax}</>}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4 text-blue-600 dark:text-blue-400">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Email</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    <a href={`mailto:${contact.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                      {contact.email}
                    </a>
                  </p>
                </div>
              </div>

              {/* Business Hours */}
              {hours && (
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4 text-blue-600 dark:text-blue-400">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Business Hours</h3>
                    <div className="text-gray-600 dark:text-gray-300 text-sm space-y-1">
                      {hours.monday && <p><span className="font-medium">Mon:</span> {hours.monday}</p>}
                      {hours.tuesday && <p><span className="font-medium">Tue:</span> {hours.tuesday}</p>}
                      {hours.wednesday && <p><span className="font-medium">Wed:</span> {hours.wednesday}</p>}
                      {hours.thursday && <p><span className="font-medium">Thu:</span> {hours.thursday}</p>}
                      {hours.friday && <p><span className="font-medium">Fri:</span> {hours.friday}</p>}
                      {hours.saturday && <p><span className="font-medium">Sat:</span> {hours.saturday}</p>}
                      {hours.sunday && <p><span className="font-medium">Sun:</span> {hours.sunday}</p>}
                      {hours.timezone && <p className="text-xs text-gray-500 mt-1">({hours.timezone})</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-6">Send a Message</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                <input type="text" className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-blue-600 dark:bg-slate-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                <input type="text" className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-blue-600 dark:bg-slate-700 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input type="email" className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-blue-600 dark:bg-slate-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
              <select className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-blue-600 bg-white dark:bg-slate-700 dark:text-white">
                <option>General Inquiry</option>
                <option>News Tip</option>
                <option>Advertising</option>
                <option>Technical Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
              <textarea rows={5} className="w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 focus:outline-none focus:border-blue-600 dark:bg-slate-700 dark:text-white"></textarea>
            </div>

            <button type="button" className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition">
              Send Message
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Contact;