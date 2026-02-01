"use client";

import React from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 md:px-0 py-8">
      <Breadcrumbs />
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 shadow-sm border border-gray-100 rounded">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-6">About WNC Times</h1>

        <div className="prose prose-lg text-gray-600 font-serif">
          <p className="text-xl font-sans text-blue-600 mb-6">
            We are the premier digital voice for Western North Carolina, dedicated to telling the stories that matter to our mountains.
          </p>

          <p className="mb-4">
            Founded in 2023, WNC Times was created to fill the gap in independent, high-quality local journalism.
            Our team of experienced reporters and photographers are committed to covering the diverse communities
            of the Blue Ridge region, from the bustling streets of Asheville to the quiet coves of Jackson County.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4 font-sans">Our Mission</h3>
          <p className="mb-4">
            To inform, inspire, and connect the people of Western North Carolina through accurate reporting,
            compelling storytelling, and a celebration of our unique regional culture.
          </p>

          <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4 font-sans">Our Values</h3>
          <ul className="list-disc pl-5 space-y-2 font-sans">
            <li><strong>Integrity:</strong> We adhere to the highest standards of journalistic ethics.</li>
            <li><strong>Community:</strong> We believe a strong local press builds strong local communities.</li>
            <li><strong>Independence:</strong> We are locally owned and beholden only to our readers.</li>
          </ul>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg font-sans">
            <h4 className="font-bold text-lg mb-2">Contact the Editor</h4>
            <p className="mb-0">
              Have a tip or a correction? Email us at <a href="mailto:carlfarring@gmail.com" className="text-blue-600 hover:underline">carlfarring@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
