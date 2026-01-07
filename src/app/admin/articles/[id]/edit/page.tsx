'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ArticleForm from '@/components/admin/ArticleForm';
import { Article } from '@/types/article';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      if (!articleId) return;

      try {
        const docRef = doc(getDb(), 'articles', articleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() } as Article);
        } else {
          setError('Article not found');
        }
      } catch (err: any) {
        console.error('Error fetching article:', err);
        setError('Failed to fetch article details.');
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [articleId]);

  if (loading) {
    return <div className="p-8 text-center">Loading article...</div>;
  }

  if (error || !article) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">{error || 'Article not found'}</div>
        <button
          onClick={() => router.push('/admin/articles')}
          className="text-blue-600 hover:underline"
        >
          Back to Articles
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Edit Article</h1>
      <ArticleForm isEditing={true} initialData={article} articleId={articleId} />
    </div>
  );
}
