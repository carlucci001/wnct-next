"use client";

import React from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="container mx-auto px-4 md:px-0 py-8">
      <Breadcrumbs />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Contact Info */}
        <div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-6">Contact Us</h1>
          <p className="text-lg text-gray-600 mb-8">
            We&apos;d love to hear from you. Whether you have a news tip, advertising inquiry, or just want to say hello, please get in touch.
          </p>

          <div className="space-y-6 mb-12">
            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4 text-blue-600">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Visit Our Office</h3>
                <p className="text-gray-600">123 Biltmore Avenue<br />Asheville, NC 28801</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4 text-blue-600">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Call Us</h3>
                <p className="text-gray-600">Main: (828) 555-0100<br />Advertising: (828) 555-0102</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4 text-blue-600">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Email</h3>
                <p className="text-gray-600">General: info@wnctimes.com<br />Support: help@wnctimes.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded shadow-sm border border-gray-200">
          <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">Send a Message</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600 bg-white">
                <option>General Inquiry</option>
                <option>News Tip</option>
                <option>Advertising</option>
                <option>Technical Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea rows={5} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"></textarea>
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
