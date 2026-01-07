'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getDb } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { Article } from '@/types/article';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, Check, Bot, Image as ImageIcon, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { MediaFile } from '@/types/media';
import { getAllAIJournalists } from '@/lib/aiJournalists';
import { AIJournalist } from '@/types/aiJournalist';
import { getAllCategories } from '@/lib/categories';
import { Category } from '@/types/category';

// Author type for dropdown
interface AuthorOption {
  id: string;
  displayName: string;
  photoURL: string;
  role: string;
}

// Roles that can be assigned as authors
const AUTHOR_ROLES = ['admin', 'business-owner', 'editor-in-chief', 'editor', 'content-contributor'];

// Dynamically import editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 rounded-lg p-4 min-h-[400px] bg-gray-50 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  ),
});

// Dynamically import MediaPickerModal
const MediaPickerModal = dynamic(() => import('./MediaPickerModal'), {
  ssr: false,
});

interface ArticleFormProps {
  isEditing: boolean;
  initialData?: Article;
  articleId?: string;
}

export default function ArticleForm({ isEditing, initialData, articleId }: ArticleFormProps) {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [tags, setTags] = useState<string>(initialData?.tags?.join(', ') || '');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(() => {
    const s = initialData?.status?.toLowerCase();
    if (s === 'published') return 'published';
    if (s === 'archived') return 'archived';
    return 'draft';
  });
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || '');
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  const [isBreakingNews, setIsBreakingNews] = useState(initialData?.isBreakingNews || false);
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Author selection state
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [aiJournalists, setAiJournalists] = useState<AIJournalist[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorOption | null>(null);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [authorsLoading, setAuthorsLoading] = useState(true);

  // Category selection state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch authors (users who can write articles)
  useEffect(() => {
    async function fetchAuthors() {
      try {
        const usersSnapshot = await getDocs(collection(getDb(), 'users'));
        const authorsList: AuthorOption[] = [];

        usersSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (AUTHOR_ROLES.includes(data.role)) {
            authorsList.push({
              id: doc.id,
              displayName: data.displayName || data.email || 'Unknown',
              photoURL: data.photoURL || '',
              role: data.role,
            });
          }
        });

        // Sort by displayName
        authorsList.sort((a, b) => a.displayName.localeCompare(b.displayName));
        setAuthors(authorsList);

        // Fetch AI journalists (only for admins)
        let journalistsList: AIJournalist[] = [];
        if (userProfile?.role === 'admin') {
          try {
            journalistsList = await getAllAIJournalists(true);
            setAiJournalists(journalistsList);
          } catch (err) {
            console.error('Error fetching AI journalists:', err);
          }
        }

        // Auto-select author
        if (isEditing && initialData?.authorId) {
          // Check if author is an AI journalist
          if (initialData.authorId.startsWith('ai-')) {
            const aiId = initialData.authorId.replace('ai-', '');
            const aiAuthor = journalistsList.find(j => j.id === aiId);
            if (aiAuthor) {
              setSelectedAuthor({
                id: initialData.authorId,
                displayName: aiAuthor.name,
                photoURL: aiAuthor.photoURL,
                role: 'ai-journalist',
              });
            } else if (initialData.author) {
              setSelectedAuthor({
                id: initialData.authorId,
                displayName: initialData.author,
                photoURL: initialData.authorPhotoURL || '',
                role: 'ai-journalist',
              });
            }
          } else {
            // When editing, select the article's current author
            const existingAuthor = authorsList.find(a => a.id === initialData.authorId);
            if (existingAuthor) {
              setSelectedAuthor(existingAuthor);
            } else if (initialData.author) {
              // Fallback: create a placeholder for the author name
              setSelectedAuthor({
                id: initialData.authorId || '',
                displayName: initialData.author,
                photoURL: initialData.authorPhotoURL || '',
                role: '',
              });
            }
          }
        } else if (currentUser && userProfile) {
          // When creating new, select current user
          const currentUserAuthor = authorsList.find(a => a.id === currentUser.uid);
          if (currentUserAuthor) {
            setSelectedAuthor(currentUserAuthor);
          } else {
            // Current user might not be in the authors list, create entry
            setSelectedAuthor({
              id: currentUser.uid,
              displayName: userProfile.displayName || currentUser.displayName || currentUser.email || 'Unknown',
              photoURL: userProfile.photoURL || currentUser.photoURL || '',
              role: userProfile.role || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching authors:', err);
      } finally {
        setAuthorsLoading(false);
      }
    }

    fetchAuthors();
  }, [currentUser, userProfile, isEditing, initialData]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const categoriesList = await getAllCategories(true); // Only active categories
        setCategories(categoriesList);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    }

    fetchCategories();
  }, []);

  // Auto-generate slug from title if not editing manually
  useEffect(() => {
    if (!isEditing && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  }, [title, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const articleData: Partial<Article> = {
        title,
        content,
        slug,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        status,
        featuredImage,
        author: selectedAuthor?.displayName || 'Staff Writer',
        authorId: selectedAuthor?.id || currentUser?.uid || initialData?.authorId,
        authorPhotoURL: selectedAuthor?.photoURL || '',
        excerpt,
        isFeatured,
        isBreakingNews,
        updatedAt: new Date().toISOString(),
      };

      // Set breaking news timestamp - ALWAYS refresh when isBreakingNews is true
      // This ensures the 24-hour window starts fresh each time you mark as breaking
      if (isBreakingNews) {
        articleData.breakingNewsTimestamp = new Date().toISOString();
      } else {
        articleData.breakingNewsTimestamp = undefined;
      }

      if (status === 'published' && (!initialData?.publishedAt)) {
          articleData.publishedAt = new Date().toISOString();
      }

      if (isEditing && articleId) {
        const docRef = doc(getDb(), 'articles', articleId);
        await updateDoc(docRef, articleData);
      } else {
        articleData.createdAt = new Date().toISOString();
        await addDoc(collection(getDb(), 'articles'), articleData as Article);
      }

      router.push('/admin/articles');
    } catch (err: any) {
      console.error('Error saving article:', err);
      setError(err.message || 'An error occurred while saving the article.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Start writing your article..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={categoriesLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white disabled:opacity-50"
          >
            <option value="">{categoriesLoading ? 'Loading...' : 'Select a category'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="news, local, western nc"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Author</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAuthorDropdown(!showAuthorDropdown)}
              disabled={authorsLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                {selectedAuthor ? (
                  <>
                    {selectedAuthor.photoURL ? (
                      <Image
                        src={selectedAuthor.photoURL}
                        alt={selectedAuthor.displayName}
                        width={24}
                        height={24}
                        className="rounded-full object-cover"
                        style={{ width: 24, height: 24 }}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {selectedAuthor.displayName[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-gray-900">{selectedAuthor.displayName}</span>
                  </>
                ) : (
                  <span className="text-gray-500">{authorsLoading ? 'Loading...' : 'Select author'}</span>
                )}
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAuthorDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showAuthorDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
                {/* Team Members Section */}
                {authors.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                      Team Members
                    </div>
                    {authors.map((author) => (
                      <button
                        key={author.id}
                        type="button"
                        onClick={() => {
                          setSelectedAuthor(author);
                          setShowAuthorDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                          selectedAuthor?.id === author.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {author.photoURL ? (
                            <Image
                              src={author.photoURL}
                              alt={author.displayName}
                              width={28}
                              height={28}
                              className="rounded-full object-cover"
                              style={{ width: 28, height: 28 }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {author.displayName[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{author.displayName}</div>
                            <div className="text-xs text-gray-500 capitalize">{author.role.replace(/-/g, ' ')}</div>
                          </div>
                        </div>
                        {selectedAuthor?.id === author.id && <Check size={16} className="text-blue-600" />}
                      </button>
                    ))}
                  </>
                )}

                {/* AI Journalists Section - Only for admins */}
                {userProfile?.role === 'admin' && aiJournalists.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-cyan-50 border-y border-gray-100 flex items-center gap-1.5">
                      <Bot size={12} className="text-cyan-600" />
                      AI Journalists
                    </div>
                    {aiJournalists.map((journalist) => (
                      <button
                        key={`ai-${journalist.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedAuthor({
                            id: `ai-${journalist.id}`,
                            displayName: journalist.name,
                            photoURL: journalist.photoURL,
                            role: 'ai-journalist',
                          });
                          setShowAuthorDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                          selectedAuthor?.id === `ai-${journalist.id}` ? 'bg-cyan-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            {journalist.photoURL ? (
                              <Image
                                src={journalist.photoURL}
                                alt={journalist.name}
                                width={28}
                                height={28}
                                className="rounded-full object-cover"
                                style={{ width: 28, height: 28 }}
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                {journalist.name[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-cyan-500 rounded-full flex items-center justify-center">
                              <Bot size={8} className="text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{journalist.name}</div>
                            <div className="text-xs text-gray-500">{journalist.title}</div>
                          </div>
                        </div>
                        {selectedAuthor?.id === `ai-${journalist.id}` && <Check size={16} className="text-cyan-600" />}
                      </button>
                    ))}
                  </>
                )}

                {authors.length === 0 && aiJournalists.length === 0 && !authorsLoading && (
                  <div className="px-3 py-2 text-sm text-gray-500">No authors available</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Featured Image</label>

          {featuredImage ? (
            <div className="relative group rounded-lg overflow-hidden border border-gray-200">
              <img src={featuredImage} alt="Featured" className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setFeaturedImage('')}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 flex items-center gap-1"
                >
                  <X size={14} /> Remove
                </button>
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="px-3 py-1.5 bg-white text-gray-900 text-sm font-medium rounded-md hover:bg-gray-100 flex items-center gap-1"
                >
                  <ImageIcon size={14} /> Change
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setShowMediaPicker(true)}
                className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-center gap-2"
              >
                <ImageIcon size={18} /> Select from Media Library
              </button>
            </div>
          )}

          {/* URL fallback input */}
          <input
            type="url"
            id="featuredImage"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="Or paste image URL..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          />

          {/* Media Picker Modal */}
          <MediaPickerModal
            open={showMediaPicker}
            onClose={() => setShowMediaPicker(false)}
            onSelect={(media) => {
              const m = Array.isArray(media) ? media[0] : media;
              setFeaturedImage(m.url);
              setShowMediaPicker(false);
            }}
            allowedTypes={['image']}
            defaultFolder="articles"
            title="Select Featured Image"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">Excerpt</label>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="Brief summary of the article..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="space-y-4 pt-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700">
              Mark as Featured Article
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isBreakingNews"
              checked={isBreakingNews}
              onChange={(e) => setIsBreakingNews(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="isBreakingNews" className="ml-2 block text-sm text-gray-700">
              Mark as Breaking News
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : (isEditing ? 'Update Article' : 'Create Article')}
        </button>
      </div>
    </form>
  );
}
