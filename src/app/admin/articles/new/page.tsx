'use client';

import ArticleForm from '@/components/admin/ArticleForm';

export default function NewArticlePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Create New Article</h1>
      <ArticleForm isEditing={false} />
    </div>
  );
}
