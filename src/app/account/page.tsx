'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { AccountHeader } from '@/components/account/AccountHeader';
import { AccountTab, canAccessTab, getDefaultTab } from '@/config/accountMenus';
import { UserRole } from '@/types/user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Toaster, toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Camera,
  Bookmark,
  MessageCircle,
  FileText,
  PenTool,
  Building2,
  Megaphone,
  Users,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  UserCog,
  X,
} from 'lucide-react';

interface SiteSettings {
  siteName: string;
  logoUrl?: string;
  brandingMode?: 'text' | 'logo';
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'WNC Times',
};

export default function AccountPage() {
  const { currentUser, userProfile, signOut, loading, isImpersonating, stopImpersonation } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  // Get user role from profile or default to reader
  const userRole: UserRole = (userProfile?.role as UserRole) || 'reader';

  // Load site settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings({
            siteName: data.siteName || DEFAULT_SETTINGS.siteName,
            logoUrl: data.logoUrl,
            brandingMode: data.brandingMode,
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // Ensure active tab is accessible for user's role
  useEffect(() => {
    if (!canAccessTab(userRole, activeTab)) {
      setActiveTab(getDefaultTab(userRole));
    }
  }, [userRole, activeTab]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const joinDate = currentUser.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  // Render different content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfile();
      case 'saved':
        return renderSavedArticles();
      case 'comments':
        return renderComments();
      case 'community':
        return renderCommunity();
      case 'my-articles':
        return renderMyArticles();
      case 'submit-article':
        return renderSubmitArticle();
      case 'businesses':
        return renderBusinesses();
      case 'ads':
        return renderAds();
      default:
        return renderProfile();
    }
  };

  const renderProfile = () => (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile?.photoURL || currentUser.photoURL || ''} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
              >
                <Camera size={14} />
              </Button>
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-bold">{displayName}</h2>
              <p className="text-muted-foreground">{userProfile?.email || currentUser.email}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                <Badge variant="secondary" className="capitalize">
                  <Shield size={12} className="mr-1" />
                  {userRole.replace('-', ' ')}
                </Badge>
                <Badge variant="outline">
                  <Calendar size={12} className="mr-1" />
                  Joined {joinDate}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} />
            Account Details
          </CardTitle>
          <CardDescription>Manage your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" defaultValue={displayName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={userProfile?.email || currentUser.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" defaultValue={userProfile?.phone || ''} placeholder="Add phone number" />
            </div>
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>Your current plan and billing information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase">Current Plan</p>
              <h3 className="text-2xl font-bold text-primary capitalize">
                {userProfile?.accountType || 'Free'} Member
              </h3>
            </div>
            <Button variant="outline">Upgrade Plan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSavedArticles = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark size={20} />
          Saved Articles
        </CardTitle>
        <CardDescription>Articles you've bookmarked for later</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
          <Bookmark size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-1">No saved articles yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Bookmark articles to read them later
          </p>
          <Button variant="outline" asChild>
            <a href="/">Browse Articles</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderComments = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle size={20} />
          My Comments
        </CardTitle>
        <CardDescription>Your comment history across the site</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
          <MessageCircle size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-1">No comments yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Join the conversation on articles you're interested in
          </p>
          <Button variant="outline" asChild>
            <a href="/">Explore Articles</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCommunity = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={20} />
          Community
        </CardTitle>
        <CardDescription>Connect with other community members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
          <Users size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-1">Community coming soon</h3>
          <p className="text-sm text-muted-foreground">
            We're building a space for community engagement
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderMyArticles = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              My Articles
            </CardTitle>
            <CardDescription>Articles you've submitted for publication</CardDescription>
          </div>
          <Button onClick={() => setActiveTab('submit-article')}>
            <PenTool size={16} className="mr-2" />
            Submit New Article
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Status Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-500" />
            <span>Pending Review</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-500" />
            <span>Published</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle size={14} className="text-red-500" />
            <span>Rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-blue-500" />
            <span>Draft</span>
          </div>
        </div>

        <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
          <FileText size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-1">No articles yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Submit your first article for editorial review
          </p>
          <Button onClick={() => setActiveTab('submit-article')}>
            <PenTool size={16} className="mr-2" />
            Submit Article
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSubmitArticle = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool size={20} />
          Submit Article
        </CardTitle>
        <CardDescription>
          Submit your article for editorial review. Once approved, it will be published on the site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Article Title</Label>
          <Input id="title" placeholder="Enter your article title" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Input id="excerpt" placeholder="Brief summary of your article" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <textarea
            id="content"
            className="w-full min-h-[300px] p-3 border rounded-md bg-background resize-y"
            placeholder="Write your article content here..."
          />
        </div>
        <Separator />
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline">Save as Draft</Button>
          <Button>Submit for Review</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderBusinesses = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 size={20} />
              My Businesses
            </CardTitle>
            <CardDescription>Manage your business listings in the directory</CardDescription>
          </div>
          <Button>
            <Building2 size={16} className="mr-2" />
            Add Business
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
          <Building2 size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-1">No businesses listed</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your business to the {settings.siteName} directory
          </p>
          <Button>Add Your First Business</Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderAds = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone size={20} />
              My Ad Campaigns
            </CardTitle>
            <CardDescription>Manage your advertising campaigns</CardDescription>
          </div>
          <Button>
            <Megaphone size={16} className="mr-2" />
            Create Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
          <Megaphone size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-1">No active campaigns</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start advertising to reach local customers
          </p>
          <Button>Create Your First Campaign</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <Toaster position="top-right" richColors />

      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <UserCog size={18} />
            <span className="font-medium">
              Viewing as: {userProfile?.displayName || userProfile?.email}
              <span className="ml-2 text-amber-100">({userProfile?.role})</span>
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-amber-600 hover:bg-amber-50 border-amber-300"
            onClick={() => {
              stopImpersonation();
              toast.success('Returned to your account');
            }}
          >
            <X size={14} className="mr-1" /> Exit Impersonation
          </Button>
        </div>
      )}

      <AccountHeader
        settings={settings}
        currentUser={{
          displayName: displayName,
          email: userProfile?.email || currentUser.email,
          photoURL: userProfile?.photoURL || currentUser.photoURL,
        }}
        userRole={userRole}
        onSignOut={handleSignOut}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        <AccountSidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          userRole={userRole}
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 bg-muted/30 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
