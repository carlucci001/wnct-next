'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Business } from '@/types/business';
import { getBusinessBySlug, getActiveBusinesses } from '@/lib/directory';
import { BusinessDetail } from '@/components/directory/BusinessDetail';

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [relatedBusinesses, setRelatedBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBusiness() {
      setLoading(true);
      try {
        const data = await getBusinessBySlug(slug);
        if (data) {
          setBusiness(data);
          // Load related businesses in same category
          const related = await getActiveBusinesses(data.category);
          setRelatedBusinesses(related.filter(b => b.id !== data.id).slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading business:', error);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadBusiness();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-32" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Business Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The business you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/directory">Back to Directory</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft size={16} className="mr-2" />
        Back to Directory
      </Button>

      <BusinessDetail 
        business={business} 
        relatedBusinesses={relatedBusinesses} 
      />
    </div>
  );
}
