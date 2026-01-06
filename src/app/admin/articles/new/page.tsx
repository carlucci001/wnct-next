'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewArticlePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin panel with action to create new article
    router.replace('/admin?action=new-article');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to article editor...</p>
    </div>
  );
}
