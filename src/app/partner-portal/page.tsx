'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getTenantById } from '@/lib/tenants';
import { getCreditBalance, getTransactionHistory } from '@/lib/credits';
import { Tenant, CreditBalance, CreditTransaction } from '@/types/tenant';
import {
  CreditCard,
  TrendingUp,
  FileText,
  Users,
  ArrowRight,
  Zap,
  Calendar,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function PartnerPortalDashboard() {
  const { userProfile } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!userProfile?.tenantId) return;

      try {
        const [tenantData, balance, transactions] = await Promise.all([
          getTenantById(userProfile.tenantId),
          getCreditBalance(userProfile.tenantId),
          getTransactionHistory(userProfile.tenantId, 5),
        ]);

        setTenant(tenantData);
        setCreditBalance(balance);
        setRecentTransactions(transactions);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const subscriptionUsagePercent = creditBalance
    ? Math.min(100, ((creditBalance.subscriptionCredits || 0) / (tenant?.subscriptionCredits || 1)) * 100)
    : 0;

  const daysUntilRenewal = tenant?.nextBillingDate
    ? Math.ceil((new Date(tenant.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">
          Welcome back, {userProfile?.displayName?.split(' ')[0] || 'Partner'}!
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Here&apos;s an overview of your publication.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Credits */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant={tenant?.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                {tenant?.status || 'Unknown'}
              </Badge>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {creditBalance?.totalCredits || 0}
            </div>
            <p className="text-sm text-slate-500">Total Credits Available</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Subscription</span>
                <span className="text-slate-700 dark:text-slate-300">{creditBalance?.subscriptionCredits || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Top-Off (never expire)</span>
                <span className="text-emerald-600">{creditBalance?.topOffCredits || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Plan */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              {tenant?.plan && (
                <Badge variant="outline" className="capitalize">
                  {tenant.plan} Plan
                </Badge>
              )}
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1 capitalize">
              {tenant?.plan || 'No Plan'}
            </div>
            <p className="text-sm text-slate-500">Current Subscription</p>
            {daysUntilRenewal !== null && (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Renews in {daysUntilRenewal} days</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/partner-portal/billing">
                  Buy Credits <ArrowRight size={16} />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/partner-portal/settings">
                  Site Settings <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Usage */}
      {tenant && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subscription Credits Usage</CardTitle>
            <CardDescription>
              Your monthly credits reset on your billing date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {creditBalance?.subscriptionCredits || 0} of {tenant.subscriptionCredits || 0} credits remaining
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {Math.round(subscriptionUsagePercent)}%
                </span>
              </div>
              <Progress value={subscriptionUsagePercent} className="h-3" />
              {subscriptionUsagePercent < 20 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Clock size={14} />
                  Running low! Consider buying a top-off pack.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest credit transactions</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/partner-portal/billing">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
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
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">
                        {tx.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tx.createdAt instanceof Date
                          ? tx.createdAt.toLocaleDateString()
                          : new Date(tx.createdAt).toLocaleDateString()}
                      </p>
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
              <p>No recent transactions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
