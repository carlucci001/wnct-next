'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  Zap,
  DollarSign,
  Image as ImageIcon,
  Mic,
  Bot,
  Megaphone,
  Check,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react';

const SUBSCRIPTION_TIERS = [
  {
    name: 'Starter',
    price: 19,
    credits: 175,
    description: 'Perfect for small local news sites',
    features: [
      '175 credits/month',
      '~35 AI articles',
      'Basic support',
      'Custom branding',
    ],
    highlighted: false,
  },
  {
    name: 'Growth',
    price: 49,
    credits: 575,
    description: 'For growing publications',
    features: [
      '575 credits/month',
      '~115 AI articles',
      'Priority support',
      'Custom branding',
      'Analytics dashboard',
    ],
    highlighted: true,
  },
  {
    name: 'Professional',
    price: 99,
    credits: 1400,
    description: 'For active publishers',
    features: [
      '1,400 credits/month',
      '~280 AI articles',
      'Premium support',
      'Custom branding',
      'Advanced analytics',
      'AI scheduling agents',
    ],
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: 249,
    credits: 4500,
    description: 'Large-scale operations',
    features: [
      '4,500 credits/month',
      '~900 AI articles',
      'Dedicated support',
      'White-label solution',
      'Custom integrations',
      'Priority AI processing',
    ],
    highlighted: false,
  },
];

const CREDIT_COSTS = [
  { feature: 'AI Article + Image', credits: 5, icon: Newspaper, description: 'Full article with DALL-E generated image' },
  { feature: 'Additional Image', credits: 2, icon: ImageIcon, description: 'Standard quality AI image' },
  { feature: 'HD Image', credits: 4, icon: ImageIcon, description: 'High definition AI image' },
  { feature: 'Text-to-Speech', credits: 1, icon: Mic, description: 'Per 500 characters of audio' },
  { feature: 'AI Agent Run', credits: 3, icon: Bot, description: 'Automated content generation' },
  { feature: 'AI Ad Creation', credits: 5, icon: Megaphone, description: 'Generate ad copy + images' },
];

const TOP_OFF_PACKS = [
  { credits: 50, price: 5 },
  { credits: 100, price: 10 },
  { credits: 250, price: 20 },
  { credits: 500, price: 35 },
];

export default function SaaSLandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Newspaper className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold text-white">Paper Partner</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#pricing" className="text-slate-300 hover:text-white transition">Pricing</Link>
            <Link href="#features" className="text-slate-300 hover:text-white transition">Features</Link>
            <Link href="#how-it-works" className="text-slate-300 hover:text-white transition">How It Works</Link>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">AI-Powered Local News Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Launch Your Local
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> News Empire</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Keep <span className="text-green-400 font-semibold">100% of your advertising revenue</span>.
            Only pay for the AI tools you use.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2">
              Start 14-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition">
              Watch Demo
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-slate-400">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>50 free credits to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Keep 100% of Ad Revenue</h3>
              <p className="text-slate-400">Unlike other platforms, we never take a cut of your advertising earnings. Your revenue is yours.</p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI-Powered Content</h3>
              <p className="text-slate-400">Generate articles, images, and audio with cutting-edge AI. Publish more with less effort.</p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Scale Predictably</h3>
              <p className="text-slate-400">Pay-per-use credits mean you only pay for what you need. Top up anytime, never lose credits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Choose a plan that fits your publication. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {SUBSCRIPTION_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-6 ${
                  tier.highlighted
                    ? 'bg-gradient-to-b from-blue-600 to-blue-700 border-2 border-blue-400 scale-105'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {tier.highlighted && (
                  <div className="text-center mb-4">
                    <span className="bg-blue-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{tier.name}</h3>
                <p className="text-sm text-slate-300 mb-4">{tier.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">${tier.price}</span>
                  <span className="text-slate-300">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-200">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    tier.highlighted
                      ? 'bg-white text-blue-600 hover:bg-slate-100'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>

          {/* Top-Off Packs */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Need More Credits?</h3>
            <p className="text-slate-400 mb-8">Top-off packs never expire. Buy once, use anytime.</p>
            <div className="flex flex-wrap justify-center gap-4">
              {TOP_OFF_PACKS.map((pack) => (
                <div key={pack.credits} className="bg-slate-800 border border-slate-700 rounded-xl px-6 py-4">
                  <div className="text-2xl font-bold text-white">{pack.credits}</div>
                  <div className="text-sm text-slate-400 mb-2">credits</div>
                  <div className="text-lg font-semibold text-green-400">${pack.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Credit Costs */}
      <section id="features" className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Credit Costs</h2>
            <p className="text-xl text-slate-400">Transparent pricing for every feature</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {CREDIT_COSTS.map((item) => (
              <div key={item.feature} className="bg-slate-800 rounded-xl p-5 border border-slate-700 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">{item.feature}</h4>
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                      {item.credits} credit{item.credits !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-slate-400">Get your news site up and running in minutes</p>
          </div>

          <div className="space-y-8">
            {[
              { step: 1, title: 'Sign Up & Brand Your Site', description: 'Create your account and customize your publication\'s name, colors, and logo.' },
              { step: 2, title: 'Generate Content with AI', description: 'Use AI to write articles, create images, and produce audio versions of your stories.' },
              { step: 3, title: 'Sell Advertising Space', description: 'Create AI-powered ads for local businesses. Keep 100% of the revenue you generate.' },
              { step: 4, title: 'Grow Your Audience', description: 'Publish consistently with AI agents that can generate content on your schedule.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Example */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-2xl p-8 md:p-12 border border-green-700/50">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">See Your Potential Revenue</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-4">Example: Growth Plan ($49/mo)</h3>
                <ul className="space-y-3 text-slate-200">
                  <li className="flex justify-between">
                    <span>Monthly articles (60 @ 5 credits)</span>
                    <span className="text-slate-400">300 credits</span>
                  </li>
                  <li className="flex justify-between">
                    <span>AI ads for 10 businesses (@ 5 credits)</span>
                    <span className="text-slate-400">50 credits</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Extra images (30 @ 2 credits)</span>
                    <span className="text-slate-400">60 credits</span>
                  </li>
                  <li className="flex justify-between font-semibold border-t border-green-700/50 pt-3">
                    <span>Total credits used</span>
                    <span>410 / 575</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-800/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-4">Your Revenue</h3>
                <div className="space-y-3 text-slate-200">
                  <div className="flex justify-between">
                    <span>10 local ads @ $75/mo each</span>
                    <span className="text-green-400 font-semibold">$750</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform cost</span>
                    <span className="text-red-400">-$49</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t border-green-700/50 pt-3">
                    <span>Monthly Profit</span>
                    <span className="text-green-400">$701</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Secure & Reliable</h3>
              <p className="text-slate-400 text-sm">Enterprise-grade infrastructure with 99.9% uptime</p>
            </div>
            <div className="text-center">
              <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Quick Setup</h3>
              <p className="text-slate-400 text-sm">Go live in under 10 minutes with our guided setup</p>
            </div>
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Always Improving</h3>
              <p className="text-slate-400 text-sm">Regular updates with the latest AI capabilities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Launch Your News Empire?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Start your 14-day free trial with 50 credits. No credit card required.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-xl font-semibold text-xl transition flex items-center gap-3 mx-auto">
            Start Your Free Trial
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-blue-500" />
              <span className="text-lg font-bold text-white">Paper Partner Program</span>
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
              <Link href="#" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition">Terms of Service</Link>
              <Link href="#" className="hover:text-white transition">Contact</Link>
            </div>
            <div className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Paper Partner Program. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
