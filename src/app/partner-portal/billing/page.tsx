'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTenantById } from '@/lib/tenants';
import { getCreditBalance, getTransactionHistory } from '@/lib/credits';
import { Tenant, CreditBalance, CreditTransaction } from '@/types/tenant';
import { SUBSCRIPTION_TIERS, TOPOFF_PACKS, formatPrice, formatMonthlyPrice } from '@/config/creditPricing';
import {
  CreditCard,
  ArrowUpRight,
  FileText,
  Calendar,
  Package,
  Zap,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PartnerPortalBilling() {
  const { userProfile } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!userProfile?.tenantId) return;
      try {
        const [tenantData, balance, txHistory] = await Promise.all([
          getTenantById(userProfile.tenantId),
          getCreditBalance(userProfile.tenantId),
          getTransactionHistory(userProfile.tenantId, 20),
        ]);
        setTenant(tenantData);
        setCreditBalance(balance);
        setTransactions(txHistory);
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userProfile?.tenantId]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentTier = SUBSCRIPTION_TIERS.find(t => t.id === tenant?.plan);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <CreditCard className="w-8 h-8" />
          Billing & Credits
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your subscription and purchase additional credits.
        </p>
      </div>

      {/* Credit Balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">Credit Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-blue-600 dark:text-blue-400 mb-4">
              {creditBalance?.totalCredits || 0}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Subscription Credits</span>
                <span className="font-medium">{creditBalance?.subscriptionCredits || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Top-Off Credits</span>
                <span className="font-medium text-emerald-600">{creditBalance?.topOffCredits || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentTier ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white capitalize">
                    {currentTier.name}
                  </span>
                  <Badge variant={tenant?.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {tenant?.status}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-blue-600 mb-4">
                  {formatMonthlyPrice(currentTier.monthlyPrice)}
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  {currentTier.totalCredits} credits/month included
                </p>
                {tenant?.nextBillingDate && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    Next billing: {new Date(tenant.nextBillingDate).toLocaleDateString()}
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-500">No active subscription</p>
            )}
            <Button className="w-full mt-4" variant="outline">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Top-Off Packs */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Buy Top-Off Credits
          </CardTitle>
          <CardDescription>
            Top-off credits never expire and carry over between billing cycles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TOPOFF_PACKS.map((pack) => (
              <Card key={pack.id} className="border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                    {pack.credits}
                  </div>
                  <div className="text-sm text-slate-500 mb-3">credits</div>
                  <div className="text-xl font-bold text-emerald-600 mb-4">
                    {formatPrice(pack.price)}
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Buy
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upgrade Your Plan</CardTitle>
          <CardDescription>
            Get more credits and unlock additional features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBSCRIPTION_TIERS.map((tier) => (
              <Card
                key={tier.id}
                className={`border ${
                  tier.id === tenant?.plan
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">{tier.name}</h4>
                    {tier.id === tenant?.plan && (
                      <Badge variant="default" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                    {formatMonthlyPrice(tier.monthlyPrice)}
                  </div>
                  <p className="text-sm text-slate-500 mb-4">
                    {tier.totalCredits} credits/month
                  </p>
                  {tier.id !== tenant?.plan && (
                    <Button size="sm" variant="outline" className="w-full">
                      {SUBSCRIPTION_TIERS.indexOf(tier) > SUBSCRIPTION_TIERS.findIndex(t => t.id === tenant?.plan)
                        ? 'Upgrade'
                        : 'Downgrade'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.amount > 0
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}>
                      {tx.amount > 0 ? <ArrowUpRight size={18} /> : <FileText size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>
                          {tx.createdAt instanceof Date
                            ? tx.createdAt.toLocaleDateString()
                            : new Date(tx.createdAt).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {tx.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
