'use client';

import { useEffect, useState } from 'react';
import { getAllTenants, updateTenantStatus, getTenantStats } from '@/lib/tenants';
import { addBonusCredits, refundCredits } from '@/lib/credits';
import { Tenant, TenantStatus, TenantPlan } from '@/types/tenant';
import {
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Activity,
  Clock,
  Search,
  MoreVertical,
  Calendar,
  Ban,
  CheckCircle,
  Pause,
  ExternalLink,
  Mail,
  FileText,
  ArrowUpRight,
  DollarSign,
  Gift,
  RefreshCw,
  Loader2,
  Plus,
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { canAccessSuperAdmin, IS_MASTER_SITE } from '@/config/masterSite';
import { useAuth } from '@/contexts/AuthContext';

// Mock orders data (would come from Stripe + Firestore in production)
const MOCK_ORDERS = [
  {
    id: 'ord_1',
    tenantName: 'Mountain Times',
    type: 'subscription',
    plan: 'growth',
    amount: 4900,
    status: 'paid',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'ord_2',
    tenantName: 'Valley News',
    type: 'topoff',
    credits: 250,
    amount: 2000,
    status: 'paid',
    createdAt: new Date('2024-01-14'),
  },
  {
    id: 'ord_3',
    tenantName: 'River Journal',
    type: 'subscription',
    plan: 'starter',
    amount: 1900,
    status: 'paid',
    createdAt: new Date('2024-01-13'),
  },
];

export default function PaperPartnerAdmin() {
  const { currentUser } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    byStatus: Record<TenantStatus, number>;
    byPlan: Record<TenantPlan, number>;
    totalCredits: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');

  // Add credits form state
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [creditReason, setCreditReason] = useState<string>('');
  const [creditType, setCreditType] = useState<'bonus' | 'refund'>('bonus');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check access - compute before useEffect but render check after all hooks
  const hasAccess = IS_MASTER_SITE && canAccessSuperAdmin(currentUser?.uid);

  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [hasAccess]);

  const loadData = async () => {
    try {
      const [allTenants, tenantStats] = await Promise.all([
        getAllTenants(),
        getTenantStats(),
      ]);
      setTenants(allTenants);
      setStats(tenantStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check access - all hooks called above, safe to return early now
  if (!IS_MASTER_SITE) {
    return null;
  }

  if (!canAccessSuperAdmin(currentUser?.uid)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 mb-4">You do not have permission to access this section.</p>
      </div>
    );
  }

  // Filtered data
  const filteredTenants = tenants.filter((t) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!t.name.toLowerCase().includes(query) &&
          !(t.settings?.siteName || '').toLowerCase().includes(query) &&
          !t.slug.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (planFilter !== 'all' && t.plan !== planFilter) return false;
    return true;
  });

  const filteredOrders = MOCK_ORDERS.filter((order) => {
    if (orderTypeFilter !== 'all' && order.type !== orderTypeFilter) return false;
    if (searchQuery && !order.tenantName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Handlers
  const handleStatusChange = async (tenantId: string, newStatus: TenantStatus) => {
    try {
      await updateTenantStatus(tenantId, newStatus);
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, status: newStatus } : t))
      );
      toast.success(`Partner status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAddCredits = async () => {
    if (!selectedTenant || !creditAmount || !creditReason) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid credit amount');
      return;
    }

    setIsSubmitting(true);
    try {
      if (creditType === 'bonus') {
        await addBonusCredits(selectedTenant, amount, creditReason);
      } else {
        await refundCredits(selectedTenant, amount, creditReason);
      }

      toast.success(`Successfully added ${amount} credits`);
      setDialogOpen(false);
      setSelectedTenant('');
      setCreditAmount('');
      setCreditReason('');
      loadData();
    } catch (error) {
      console.error('Error adding credits:', error);
      toast.error('Failed to add credits');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: TenantStatus) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'trial':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'suspended':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'cancelled':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default:
        return '';
    }
  };

  // Get recent tenants and expiring trials
  const recentTenants = tenants.slice(0, 5);
  const expiringTrials = tenants.filter(t => {
    if (t.status !== 'trial' || !t.trialEndsAt) return false;
    const daysLeft = Math.ceil((new Date(t.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 3;
  });

  // Calculate totals
  const totalSubscriptionCredits = tenants.reduce((sum, t) => sum + t.subscriptionCredits, 0);
  const totalTopOffCredits = tenants.reduce((sum, t) => sum + t.topOffCredits, 0);
  const totalRevenue = MOCK_ORDERS.reduce((sum, order) => sum + order.amount, 0);
  const subscriptionRevenue = MOCK_ORDERS.filter((o) => o.type === 'subscription').reduce((sum, o) => sum + o.amount, 0);
  const topoffRevenue = MOCK_ORDERS.filter((o) => o.type === 'topoff').reduce((sum, o) => sum + o.amount, 0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-red-600" />
            Paper Partner Management
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage all paper partner subscriptions, credits, and settings.
          </p>
        </div>
        <Badge variant="destructive" className="gap-1">
          <ShieldAlert className="w-3 h-3" />
          Super Admin Only
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Total Partners</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {stats?.total || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Active Subscriptions</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {stats?.byStatus.active || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Active Trials</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {stats?.byStatus.trial || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Total Credits Issued</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {(stats?.totalCredits || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plan Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Plan Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['starter', 'growth', 'professional', 'enterprise'] as TenantPlan[]).map((plan) => (
                  <div key={plan} className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      {stats?.byPlan[plan] || 0}
                    </p>
                    <p className="text-sm text-slate-500 capitalize">{plan}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expiring Trials Alert */}
            {expiringTrials.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                    Trials Expiring Soon
                  </CardTitle>
                  <CardDescription>
                    These partners&apos; trials expire within 3 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expiringTrials.map((tenant) => {
                      const daysLeft = Math.ceil(
                        (new Date(tenant.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <div
                          key={tenant.id}
                          className="flex items-center justify-between py-2 border-b border-amber-200 dark:border-amber-800 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{tenant.name}</p>
                            <p className="text-sm text-slate-500">{tenant.settings?.siteName || tenant.slug}</p>
                          </div>
                          <Badge variant="outline" className="text-amber-600 border-amber-400">
                            {daysLeft} days left
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Partners */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Partners</CardTitle>
                <CardDescription>Newest paper partner signups</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTenants.length > 0 ? (
                  <div className="space-y-3">
                    {recentTenants.map((tenant) => (
                      <div
                        key={tenant.id}
                        className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{tenant.name}</p>
                          <p className="text-sm text-slate-500">
                            {tenant.createdAt instanceof Date
                              ? tenant.createdAt.toLocaleDateString()
                              : new Date(tenant.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{tenant.plan}</Badge>
                          <Badge
                            variant={tenant.status === 'active' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {tenant.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No partners yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="space-y-6 mt-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, site, or slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-slate-500">
            Showing {filteredTenants.length} of {tenants.length} partners
          </p>

          {/* Tenants List */}
          <div className="space-y-4">
            {filteredTenants.length > 0 ? (
              filteredTenants.map((tenant) => (
                <Card key={tenant.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {tenant.name}
                          </h3>
                          <Badge className={getStatusColor(tenant.status)} variant="secondary">
                            {tenant.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {tenant.plan}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-3">
                          {tenant.settings?.siteName || tenant.slug} • {tenant.slug}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4" />
                            {tenant.subscriptionCredits + tenant.topOffCredits} credits
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Joined {tenant.createdAt instanceof Date
                              ? tenant.createdAt.toLocaleDateString()
                              : new Date(tenant.createdAt).toLocaleDateString()}
                          </span>
                          {tenant.trialEndsAt && tenant.status === 'trial' && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Calendar className="w-4 h-4" />
                              Trial ends {tenant.trialEndsAt instanceof Date
                                ? tenant.trialEndsAt.toLocaleDateString()
                                : new Date(tenant.trialEndsAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Actions
                              <MoreVertical className="w-4 h-4 ml-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Site
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Contact Owner
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {tenant.status !== 'active' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(tenant.id, 'active')}>
                                <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {tenant.status !== 'suspended' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(tenant.id, 'suspended')}>
                                <Pause className="w-4 h-4 mr-2 text-amber-600" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {tenant.status !== 'cancelled' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(tenant.id, 'cancelled')}
                                className="text-red-600"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-500">No partners found matching your filters</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6 mt-6">
          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      ${(totalRevenue / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Subscriptions</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      ${(subscriptionRevenue / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Top-Off Sales</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      ${(topoffRevenue / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by partner name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Order Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="subscription">Subscriptions</SelectItem>
                    <SelectItem value="topoff">Top-Off Credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>All payments from paper partners</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredOrders.length > 0 ? (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          order.type === 'subscription'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                        }`}>
                          {order.type === 'subscription' ? (
                            <CreditCard size={18} />
                          ) : (
                            <ArrowUpRight size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {order.tenantName}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>
                              {order.type === 'subscription'
                                ? `${order.plan} plan`
                                : `${order.credits} credits`}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {order.createdAt.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={order.status === 'paid' ? 'default' : 'secondary'}
                          className={order.status === 'paid' ? 'bg-emerald-600' : ''}
                        >
                          {order.status}
                        </Badge>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ${(order.amount / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-500">No orders found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-6 mt-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Total Credits Issued</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {(totalSubscriptionCredits + totalTopOffCredits).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Subscription Credits</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {totalSubscriptionCredits.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Top-Off Credits</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {totalTopOffCredits.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Credits
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Credits to Partner</DialogTitle>
                  <DialogDescription>
                    Add bonus credits or issue a refund to a paper partner.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Partner</Label>
                    <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} ({t.settings?.siteName || t.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={creditType} onValueChange={(v) => setCreditType(v as 'bonus' | 'refund')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonus">
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-emerald-600" />
                            Bonus Credits
                          </div>
                        </SelectItem>
                        <SelectItem value="refund">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-blue-600" />
                            Refund Credits
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Credits Amount</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea
                      placeholder="Explain why you're adding these credits..."
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCredits} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Credits
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Credits by Partner */}
          <Card>
            <CardHeader>
              <CardTitle>Credits by Partner</CardTitle>
              <CardDescription>Current credit balances for all paper partners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{tenant.name}</p>
                      <p className="text-sm text-slate-500">{tenant.settings?.siteName || tenant.slug}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Subscription</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {tenant.subscriptionCredits}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Top-Off</p>
                        <p className="font-semibold text-emerald-600">
                          {tenant.topOffCredits}
                        </p>
                      </div>
                      <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-4">
                        <p className="text-sm text-slate-500">Total</p>
                        <p className="font-bold text-lg text-slate-900 dark:text-white">
                          {tenant.subscriptionCredits + tenant.topOffCredits}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTenants.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-slate-500">No partners found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
