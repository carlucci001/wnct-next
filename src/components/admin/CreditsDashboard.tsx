'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Coins,
  TrendingUp,
  Clock,
  ShoppingCart,
  RefreshCw,
  Sparkles,
  Image,
  Volume2,
  Bot,
  Megaphone,
  ChevronRight,
  ArrowUpRight,
  History,
  CreditCard,
  Zap,
  CheckCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SUBSCRIPTION_TIERS, TOPOFF_PACKS, CREDIT_COSTS, formatPrice, formatCreditCost } from '@/config/creditPricing';
import { CreditBalance, CreditTransaction, CreditFeature } from '@/types/tenant';

const FEATURE_ICONS: Record<CreditFeature, React.ReactNode> = {
  article: <Sparkles className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  image_hd: <Image className="h-4 w-4" />,
  tts: <Volume2 className="h-4 w-4" />,
  agent: <Bot className="h-4 w-4" />,
  ad_creation: <Megaphone className="h-4 w-4" />,
  ad_manual: <Megaphone className="h-4 w-4" />,
};

const FEATURE_LABELS: Record<CreditFeature, string> = {
  article: 'AI Articles',
  image: 'Images',
  image_hd: 'HD Images',
  tts: 'Text-to-Speech',
  agent: 'AI Agents',
  ad_creation: 'AI Ads',
  ad_manual: 'Manual Ads',
};

interface CreditsDashboardProps {
  tenantId?: string;
}

export default function CreditsDashboard({ tenantId = 'default' }: CreditsDashboardProps) {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [usageStats, setUsageStats] = useState<Record<string, number>>({});
  const [daysUntilRenewal, setDaysUntilRenewal] = useState(0);
  const [currentPlan, setCurrentPlan] = useState<string>('starter');
  const [loading, setLoading] = useState(true);
  const [showTopOffModal, setShowTopOffModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadCreditsData();
  }, [tenantId]);

  async function loadCreditsData() {
    setLoading(true);
    try {
      const response = await fetch(`/api/credits?tenantId=${tenantId}`);
      const data = await response.json();

      if (data.success) {
        setBalance(data.balance);
        setTransactions(data.transactions || []);
        setUsageStats(data.usageStats?.byFeature || {});
        setDaysUntilRenewal(data.daysUntilRenewal || 0);
        setCurrentPlan(data.plan || 'starter');
      }
    } catch (error) {
      console.error('Failed to load credits data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyTopOff(packId: string) {
    setPurchasing(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'topoff',
          packId,
          tenantId,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
    } finally {
      setPurchasing(false);
    }
  }

  async function handleUpgrade(planId: string) {
    setPurchasing(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          planId,
          tenantId,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
    } finally {
      setPurchasing(false);
    }
  }

  const currentTier = SUBSCRIPTION_TIERS.find(t => t.id === currentPlan);
  const totalCredits = balance?.totalCredits || 0;
  const subscriptionCredits = balance?.subscriptionCredits || 0;
  const topOffCredits = balance?.topOffCredits || 0;
  const maxCredits = currentTier?.totalCredits || 175;
  const usagePercent = maxCredits > 0 ? Math.min(100, ((maxCredits - subscriptionCredits) / maxCredits) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credits & Billing</h1>
          <p className="text-muted-foreground">Manage your credits and subscription</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadCreditsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowTopOffModal(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy Credits
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Coins className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCredits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available to use
            </p>
          </CardContent>
        </Card>

        {/* Subscription Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Credits</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{subscriptionCredits.toLocaleString()}</div>
            <div className="mt-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${100 - usagePercent}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Resets in {daysUntilRenewal} days
            </p>
          </CardContent>
        </Card>

        {/* Top-Off Credits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top-Off Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{topOffCredits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Never expire
            </p>
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{currentPlan}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentTier ? formatPrice(currentTier.monthlyPrice) + '/month' : ''}
            </p>
            <Button
              variant="link"
              className="p-0 h-auto text-xs mt-1"
              onClick={() => setShowUpgradeModal(true)}
            >
              Upgrade Plan <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage & Credit Costs */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Usage This Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Usage This Month
            </CardTitle>
            <CardDescription>Credits used by feature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(usageStats).length > 0 ? (
                Object.entries(usageStats).map(([feature, credits]) => (
                  <div key={feature} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {FEATURE_ICONS[feature as CreditFeature]}
                      <span className="text-sm">{FEATURE_LABELS[feature as CreditFeature] || feature}</span>
                    </div>
                    <Badge variant="secondary">{credits} credits</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No usage this month yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Credit Costs Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-600" />
              Credit Costs
            </CardTitle>
            <CardDescription>How many credits each feature uses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(CREDIT_COSTS).map(([feature, cost]) => (
                <div key={feature} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {FEATURE_ICONS[feature as CreditFeature]}
                    <span className="text-sm">{FEATURE_LABELS[feature as CreditFeature]}</span>
                  </div>
                  <Badge variant="outline">{formatCreditCost(cost)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-600" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Your credit activity</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant={tx.amount > 0 ? 'default' : 'secondary'}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No transactions yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top-Off Modal */}
      <Dialog open={showTopOffModal} onOpenChange={setShowTopOffModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buy Credit Top-Off</DialogTitle>
            <DialogDescription>
              Top-off credits never expire and are used after your monthly subscription credits.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2 py-4">
            {TOPOFF_PACKS.map((pack) => (
              <Card
                key={pack.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => !purchasing && handleBuyTopOff(pack.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pack.name}</CardTitle>
                    <Badge variant="secondary">{formatPrice(pack.price)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{pack.credits}</div>
                  <p className="text-sm text-muted-foreground">credits</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatPrice(pack.price * 100 / pack.credits)}/credit
                  </p>
                  <Button className="w-full mt-4" disabled={purchasing}>
                    {purchasing ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Buy Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              Get more monthly credits at a better rate.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 py-4">
            {SUBSCRIPTION_TIERS.map((tier) => (
              <Card
                key={tier.id}
                className={`relative ${tier.popular ? 'border-primary' : ''} ${currentPlan === tier.id ? 'bg-muted' : ''}`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <div className="text-2xl font-bold">
                    {formatPrice(tier.monthlyPrice)}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{tier.totalCredits} credits/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>+{tier.bonusCredits} bonus</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>${tier.pricePerCredit.toFixed(2)}/credit</span>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant={currentPlan === tier.id ? 'secondary' : 'default'}
                    disabled={purchasing || currentPlan === tier.id}
                    onClick={() => handleUpgrade(tier.id)}
                  >
                    {currentPlan === tier.id ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}