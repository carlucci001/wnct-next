'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NewArticlePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get article ID if editing existing article
    const id = searchParams.get('id');

    // Redirect to admin panel with action and preserve ID if present
    if (id) {
      router.replace(`/admin?action=edit-article&id=${id}`);
    } else {
      router.replace('/admin?action=new-article');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to article editor...</p>
    </div>
  );
}
