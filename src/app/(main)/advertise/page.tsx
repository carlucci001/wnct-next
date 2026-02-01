"use client";

import React from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Target, 
  Users, 
  Globe, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Mail,
  Smartphone,
  Layout as LayoutIcon,
  MousePointer2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdvertiseSidebar } from '@/components/advertising/AdvertiseSidebar';

const STATS = [
  { label: 'Monthly Readers', value: '50,000+', icon: Users, color: 'text-blue-600' },
  { label: 'Ad Impressions', value: '250k+', icon: BarChart3, color: 'text-emerald-600' },
  { label: 'Engagement Rate', value: '3.2%', icon: Target, color: 'text-amber-600' },
  { label: 'Local Reach', value: 'WNC Area', icon: Globe, color: 'text-purple-600' },
];

const PLACEMENTS = [
  {
    title: 'Header Leaderboard',
    desc: 'The first thing readers see. High-impact 728x90 banner space.',
    icon: LayoutIcon,
    tag: 'Premium',
    position: 'header_main'
  },
  {
    title: 'Sidebar Box Ad',
    desc: 'Consistent visibility alongside top news and trending stories.',
    icon: Smartphone,
    tag: 'Popular',
    position: 'sidebar_top'
  },
  {
    title: 'In-Article Native',
    desc: 'Seamlessly integrated into the reading experience for high engagement.',
    icon: MousePointer2,
    tag: 'High CTR',
    position: 'article_inline'
  }
];

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-slate-900 border-b border-white/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-slate-900/50 to-slate-900" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 border border-blue-500/30">
              <TrendingUp size={14} />
              Partner with WNC Times
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-white leading-tight mb-8">
              Reach the heart of <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400">Western North Carolina.</span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl">
              Connect your brand with 50,000+ local readers monthly. From local businesses to regional events, our platform offers the most targeted reach in the WNC area.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="h-14 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20" asChild>
                <Link href="/account?tab=ads">
                  Launch Your Campaign <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="#contact">
                  Talk to Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Content */}
          <div className="lg:w-2/3 space-y-20">
            {/* Ad Options */}
            <div>
              <div className="mb-10">
                <h2 className="text-3xl font-serif font-black text-slate-900 dark:text-white mb-4">
                  Where Your Ad Appears
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Select the placement that best fits your campaign goals. Our responsive patterns ensure your brand looks great on every device.
                </p>
              </div>

              <div className="grid gap-6">
                {PLACEMENTS.map((opt) => (
                  <Card key={opt.title} className="group overflow-hidden border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/5 bg-white dark:bg-slate-900">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/3 relative h-48 md:h-auto bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
                          <opt.icon className="text-slate-400 group-hover:text-blue-500 transition-colors" size={64} strokeWidth={1} />
                        </div>
                        <div className="p-8 md:w-2/3">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                              {opt.tag}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {opt.title}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
                            {opt.desc}
                          </p>
                          <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400 font-bold group" asChild>
                            <Link href={`/admin?tab=advertising&position=${opt.position}`}>
                              Select Placement <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* How it Works */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-10 md:p-16 border border-slate-200 dark:border-slate-800">
              <h2 className="text-3xl font-serif font-black text-slate-900 dark:text-white mb-12 text-center">
                Launch in Minutes
              </h2>
              <div className="grid md:grid-cols-3 gap-12 relative">
                {/* Connector lines for desktop */}
                <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-slate-200 dark:bg-slate-700 -z-1" />
                
                {[
                  { step: '01', title: 'Create Account', desc: 'Sign up as an advertiser in our unified portal.' },
                  { step: '02', title: 'Upload Creative', desc: 'Choose your placement and upload your banner imagery.' },
                  { step: '03', title: 'Go Live', desc: 'Set your budget, dates, and watch your stats grow.' }
                ].map((item) => (
                  <div key={item.step} className="text-center relative">
                    <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mx-auto mb-6 text-2xl font-black text-blue-600 border border-slate-100 dark:border-slate-700">
                      {item.step}
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form Placeholder / Sales Integration */}
            <div id="contact" className="py-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <Mail size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Custom Solutions</h2>
                  <p className="text-slate-500 dark:text-slate-400">Need something bigger? Talk to our managed sales team.</p>
                </div>
              </div>
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">Looking for something specific? We offer specialized packages for:</p>
                      <ul className="space-y-3">
                        {['Grand Openings', 'Event Series', 'Corporate Branding', 'Native Content Stories'].map(item => (
                          <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col justify-center gap-4">
                      <Button size="lg" className="h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold" asChild>
                        <a href="mailto:advertising@wnctimes.com">Email Advertising Sales</a>
                      </Button>
                      <p className="text-center text-xs text-slate-500">Typical response time: &lt; 24 hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Side Pan (Sidebar) */}
          <aside className="lg:w-1/3 shrink-0">
            <div className="sticky top-24">
              <AdvertiseSidebar />
              
              {/* Extra Value Proposition */}
              <div className="mt-8 rounded-3xl bg-linear-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-2xl shadow-blue-500/20 overflow-hidden relative">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <h3 className="text-xl font-bold mb-4 relative z-10">Real-Time Stats</h3>
                <p className="text-blue-100 text-sm mb-6 leading-relaxed relative z-10">
                  All advertisers get access to a private dashboard to track impressions, clicks, and CTR in real-time. Optimize your creative based on actual performance.
                </p>
                <div className="p-4 bg-black/20 rounded-xl border border-white/10 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Live CTR</span>
                    <span className="text-sm font-black text-white">4.2%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 w-[60%] rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      
      {/* Final CTA Full Width */}
      <section className="bg-slate-900 py-32 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-900/20 to-transparent" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-serif font-black text-white mb-8">
            Ready to grow your <br />WNC business?
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-16 px-12 text-xl font-black bg-blue-600 hover:bg-blue-500 rounded-full shadow-2xl shadow-blue-500/30" asChild>
              <Link href="/admin?tab=advertising">
                Start Your First Ad
              </Link>
            </Button>
            <span className="text-slate-500 font-bold uppercase tracking-widest px-4">OR</span>
            <Button variant="outline" size="lg" className="h-16 px-12 text-xl font-black border-white/20 text-white rounded-full hover:bg-white/10" asChild>
              <Link href="/contact">
                Get a Quote
              </Link>
            </Button>
          </div>
          <p className="mt-10 text-slate-500 text-sm font-medium">No minimum spend required. Cancel anytime.</p>
        </div>
      </section>
    </div>
  );
}
