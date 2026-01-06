"use client";

import { useState } from 'react';
import {
  Settings,
  Users,
  TrendingUp,
  Target,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  Megaphone,
  LayoutGrid,
  Newspaper,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdvertiseSidebar } from '@/components/advertising/AdvertiseSidebar';
import { AdConfigModal } from '@/components/advertising/AdConfigModal';

// FAQ data
const faqs = [
  {
    question: 'What ad formats do you support?',
    answer:
      'We support various formats including leaderboard banners (728x90), medium rectangles (300x250), wide skyscrapers (160x600), native sponsored content, and custom placements. Our team can help you choose the best format for your campaign goals.',
  },
  {
    question: 'How do you measure ad performance?',
    answer:
      'We provide detailed analytics including impressions, clicks, click-through rate (CTR), and engagement metrics. You\'ll have access to a dashboard showing real-time performance data for your campaigns.',
  },
  {
    question: 'Can I target specific audiences?',
    answer:
      'Yes! We offer targeting options based on content categories (News, Sports, Business, etc.), geographic location within Western NC, and device type. Premium packages include advanced demographic targeting.',
  },
  {
    question: 'What is the minimum ad commitment?',
    answer:
      'Our Starter package begins at $299/month with no long-term commitment required. We also offer discounted rates for quarterly and annual contracts.',
  },
  {
    question: 'Do you offer sponsored content?',
    answer:
      'Absolutely! Our native advertising options include sponsored articles that integrate seamlessly with our editorial content. These are clearly labeled as sponsored but match our site\'s look and feel.',
  },
  {
    question: 'How quickly can my ad go live?',
    answer:
      'Standard campaigns can be live within 24-48 hours after receiving your creative assets. Rush placements are available for breaking news or time-sensitive promotions.',
  },
];

// Pricing tiers
const pricingTiers = [
  {
    name: 'Starter',
    price: '$299',
    period: '/month',
    description: 'Perfect for small businesses testing the waters',
    features: [
      'Sidebar ad placement (300x250)',
      '10,000 impressions/month',
      'Basic analytics dashboard',
      'Email support',
      'Monthly performance report',
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$599',
    period: '/month',
    description: 'Ideal for growing businesses seeking visibility',
    features: [
      'Header + Sidebar placements',
      '50,000 impressions/month',
      'Advanced analytics & heatmaps',
      'Priority support',
      'A/B testing capabilities',
      'Custom audience targeting',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For brands requiring maximum exposure',
    features: [
      'Premium homepage placement',
      'Unlimited impressions',
      'Dedicated account manager',
      'Native sponsored content',
      'Exclusive category sponsorship',
      'Custom integrations',
      'Quarterly strategy reviews',
    ],
    highlighted: false,
  },
];

// Audience stats
const audienceStats = [
  { label: 'Monthly Readers', value: '50,000+', icon: Users },
  { label: 'Page Views', value: '200,000+', icon: TrendingUp },
  { label: 'Avg. Time on Site', value: '4:30 min', icon: Target },
  { label: 'Local Reach', value: '85%', icon: BarChart3 },
];

// Ad placement types
const adPlacements = [
  {
    title: 'Header Banner',
    size: '728x90',
    description: 'Premium visibility at the top of every page',
    icon: Monitor,
  },
  {
    title: 'Sidebar Rectangle',
    size: '300x250',
    description: 'High-engagement placement alongside content',
    icon: LayoutGrid,
  },
  {
    title: 'In-Article',
    size: '300x250',
    description: 'Seamless placement within article content',
    icon: Newspaper,
  },
  {
    title: 'Native Sponsored',
    size: 'Custom',
    description: 'Branded content that matches editorial style',
    icon: Megaphone,
  },
];

export default function AdvertisePage() {
  const { userProfile } = useAuth();
  const [configOpen, setConfigOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    budget: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const isAdmin =
    userProfile?.role &&
    ['admin', 'business-owner', 'editor-in-chief'].includes(userProfile.role);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success('Thank you! We\'ll be in touch within 24 hours.');
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      budget: '',
      message: '',
    });
    setSubmitting(false);
  };

  return (
    <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT COLUMN: Main Content (2/3 width on desktop) */}
        <div className="lg:w-2/3 flex flex-col w-full">
          {/* Header with title and admin gear icon */}
          <div className="mb-6 flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                Advertise With Us
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Reach engaged readers across Western North Carolina
              </p>
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfigOpen(true)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Settings size={20} />
              </Button>
            )}
          </div>

          {/* Hero Section */}
          <section className="mb-10">
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 rounded-xl p-8 md:p-12 text-white overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Connect With Your Local Community
                </h2>
                <p className="text-blue-100 text-lg mb-6 max-w-2xl">
                  WNC Times reaches over 50,000 engaged readers monthly who trust us
                  for local news, events, and community updates. Put your brand in
                  front of the audience that matters most.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-blue-700 hover:bg-blue-50"
                    asChild
                  >
                    <a href="#contact-form">Get Started Today</a>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Download Media Kit
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Audience Stats */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Our Audience
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {audienceStats.map((stat) => (
                <Card
                  key={stat.label}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="pt-6 text-center">
                    <stat.icon className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Ad Placements */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Ad Placements
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {adPlacements.map((placement) => (
                <Card
                  key={placement.title}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <placement.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {placement.title}
                        </h3>
                        <Badge variant="secondary" className="mt-1 mb-2">
                          {placement.size}
                        </Badge>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {placement.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Benefits */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Why Advertise With WNC Times?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Hyperlocal Reach',
                  description:
                    '85% of our audience lives and works in Western NC. Reach customers in your backyard.',
                },
                {
                  title: 'Engaged Readers',
                  description:
                    'Our audience spends an average of 4+ minutes per visit, actively consuming content.',
                },
                {
                  title: 'Trusted Platform',
                  description:
                    'As a local news source, we\'ve built trust with the community over years of journalism.',
                },
                {
                  title: 'Measurable Results',
                  description:
                    'Real-time analytics show exactly how your campaigns perform with detailed reports.',
                },
                {
                  title: 'Flexible Options',
                  description:
                    'From banner ads to sponsored content, choose the format that fits your goals.',
                },
                {
                  title: 'Expert Support',
                  description:
                    'Our advertising team helps optimize your campaigns for maximum ROI.',
                },
              ].map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pricing Tiers */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Pricing Plans
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={`relative ${
                    tier.highlighted
                      ? 'border-blue-500 dark:border-blue-400 border-2 bg-blue-50/50 dark:bg-blue-900/20'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {tier.price}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {tier.period}
                      </span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={tier.highlighted ? 'default' : 'outline'}
                      asChild
                    >
                      <a href="#contact-form">
                        {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedFaq(expandedFaq === index ? null : index)
                    }
                    className="w-full flex items-center justify-between p-4 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-4 bg-white dark:bg-gray-900">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Contact Form */}
          <section id="contact-form" className="scroll-mt-24">
            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Ready to Get Started?</CardTitle>
                <CardDescription>
                  Fill out the form below and our advertising team will contact you
                  within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleFormChange}
                        placeholder="Acme Inc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder="(828) 555-1234"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Monthly Budget</Label>
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleFormChange}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                    >
                      <option value="">Select a budget range</option>
                      <option value="under-500">Under $500/month</option>
                      <option value="500-1000">$500 - $1,000/month</option>
                      <option value="1000-2500">$1,000 - $2,500/month</option>
                      <option value="2500-5000">$2,500 - $5,000/month</option>
                      <option value="5000+">$5,000+/month</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Tell us about your goals</Label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleFormChange}
                      placeholder="What are you hoping to achieve with your advertising campaign?"
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 resize-none"
                    />
                  </div>

                  <Button type="submit" size="lg" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Inquiry
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* RIGHT COLUMN: Sidebar (1/3 width, hidden on mobile) */}
        <div className="lg:w-1/3 hidden lg:flex flex-col sticky top-24 space-y-6">
          <AdvertiseSidebar />
        </div>
      </div>

      {/* Admin Config Modal */}
      <AdConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  );
}
