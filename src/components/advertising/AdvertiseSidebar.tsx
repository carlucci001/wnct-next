"use client";

import { useState } from 'react';
import { Phone, Mail, MapPin, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdvertiseSidebarProps {
  className?: string;
}

export function AdvertiseSidebar({ className = '' }: AdvertiseSidebarProps) {
  const [showPhone, setShowPhone] = useState(false);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Contact Card */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Advertising Sales
              </p>
              {showPhone ? (
                <a
                  href="tel:+18285551234"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  (828) 555-1234
                </a>
              ) : (
                <button
                  onClick={() => setShowPhone(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Show Phone Number
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
              <a
                href="mailto:carlfarring@gmail.com"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                carlfarring@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Office</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                123 Main Street<br />
                Asheville, NC 28801
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Hours</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mon-Fri: 9am - 5pm
              </p>
            </div>
          </div>

          <Button className="w-full mt-4" asChild>
            <a href="#contact-form">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Why Advertise Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Why WNC Times?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              50,000+ monthly readers
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Targeted local audience
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Flexible ad placements
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Campaign analytics
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Dedicated support team
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Testimonial Card */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="relative">
            <div className="text-4xl text-gray-300 dark:text-gray-600 absolute -top-2 -left-1">
              &ldquo;
            </div>
            <blockquote className="text-sm text-gray-600 dark:text-gray-400 italic pl-4">
              Advertising with WNC Times has been a game-changer for our business.
              We&apos;ve seen a 40% increase in local customers since we started.
            </blockquote>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-600 dark:text-gray-400">SJ</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Sarah Johnson
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Blue Ridge Coffee Co.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Kit CTA */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 border-none text-white">
        <CardContent className="pt-6 text-center">
          <h3 className="font-semibold mb-2">Download Media Kit</h3>
          <p className="text-sm text-gray-300 mb-4">
            Get detailed specs, rates, and audience demographics
          </p>
          <Button variant="secondary" className="w-full">
            Download PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdvertiseSidebar;
