"use client";

import React from 'react';
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
  Clock,
  Users,
  BarChart3,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  { feature: 'AI Article + Image', credits: 5, icon: Newspaper, description: 'Full article with AI-generated image' },
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

const VALUE_PROPS = [
  {
    icon: DollarSign,
    title: 'Keep 100% of Ad Revenue',
    description: 'Unlike other platforms, we never take a cut of your advertising earnings. Your revenue is yours.',
    color: 'text-emerald-600'
  },
  {
    icon: Zap,
    title: 'AI-Powered Content',
    description: 'Generate articles, images, and audio with cutting-edge AI. Publish more with less effort.',
    color: 'text-blue-600'
  },
  {
    icon: TrendingUp,
    title: 'Scale Predictably',
    description: 'Pay-per-use credits mean you only pay for what you need. Top up anytime, never lose credits.',
    color: 'text-purple-600'
  },
];

export default function PaperPartnerProgramPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-slate-900 border-b border-white/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 border border-blue-500/30">
              <Sparkles size={14} />
              AI-Powered Local News Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-white leading-tight mb-8">
              Launch Your Local <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">News Empire.</span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl">
              Keep <span className="text-emerald-400 font-semibold">100% of your advertising revenue</span>.
              Only pay for the AI tools you use. Start your own local news publication today.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="h-14 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20" asChild>
                <Link href="/login?signup=partner">
                  Start 14-Day Free Trial <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="#pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 mt-8 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>50 free credits to start</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {VALUE_PROPS.map((prop) => (
              <Card key={prop.title} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 ${prop.color}`}>
                    <prop.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{prop.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{prop.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-black text-slate-900 dark:text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Choose a plan that fits your publication. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {SUBSCRIPTION_TIERS.map((tier) => (
              <Card
                key={tier.name}
                className={`relative overflow-hidden ${
                  tier.highlighted
                    ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/10 scale-105'
                    : 'border-slate-200 dark:border-slate-800'
                } bg-white dark:bg-slate-900`}
              >
                {tier.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center text-xs font-bold py-1 uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <CardHeader className={tier.highlighted ? 'pt-8' : ''}>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">${tier.price}</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${tier.highlighted ? 'bg-blue-600 hover:bg-blue-500' : ''}`}
                    variant={tier.highlighted ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href="/login?signup=partner">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top-Off Packs */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-4">Need More Credits?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8">Top-off packs never expire. Buy once, use anytime.</p>
            <div className="flex flex-wrap justify-center gap-4">
              {TOP_OFF_PACKS.map((pack) => (
                <Card key={pack.credits} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{pack.credits}</div>
                  <div className="text-sm text-slate-500 mb-2">credits</div>
                  <div className="text-lg font-semibold text-emerald-600">${pack.price}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Credit Costs */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-black text-slate-900 dark:text-white mb-4">Credit Costs</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">Transparent pricing for every feature</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {CREDIT_COSTS.map((item) => (
              <Card key={item.feature} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{item.feature}</h4>
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        {item.credits} credit{item.credits !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-black text-slate-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">Get your news site up and running in minutes</p>
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
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Example */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-serif">See Your Potential Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-4">Example: Growth Plan ($49/mo)</h3>
                  <ul className="space-y-3 text-slate-700 dark:text-slate-200">
                    <li className="flex justify-between">
                      <span>Monthly articles (60 @ 5 credits)</span>
                      <span className="text-slate-500">300 credits</span>
                    </li>
                    <li className="flex justify-between">
                      <span>AI ads for 10 businesses (@ 5 credits)</span>
                      <span className="text-slate-500">50 credits</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Extra images (30 @ 2 credits)</span>
                      <span className="text-slate-500">60 credits</span>
                    </li>
                    <li className="flex justify-between font-semibold border-t border-emerald-200 dark:border-emerald-800 pt-3">
                      <span>Total credits used</span>
                      <span>410 / 575</span>
                    </li>
                  </ul>
                </div>

                <Card className="bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-emerald-700 dark:text-emerald-400">Your Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-slate-700 dark:text-slate-200">
                    <div className="flex justify-between">
                      <span>10 local ads @ $75/mo each</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">$750</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform cost</span>
                      <span className="text-red-500">-$49</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-t border-emerald-200 dark:border-emerald-800 pt-3">
                      <span>Monthly Profit</span>
                      <span className="text-emerald-600 dark:text-emerald-400">$701</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Secure & Reliable</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Enterprise-grade infrastructure with 99.9% uptime</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Quick Setup</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Go live in under 10 minutes with our guided setup</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Always Improving</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Regular updates with the latest AI capabilities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-black text-white mb-6">
            Ready to Launch Your News Empire?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Start your 14-day free trial with 50 credits. No credit card required.
          </p>
          <Button size="lg" className="h-16 px-10 text-xl font-bold bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20" asChild>
            <Link href="/login?signup=partner">
              Start Your Free Trial <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
