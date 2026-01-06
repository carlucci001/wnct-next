import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { Category, CategoryInput, CategoryUpdate, DEFAULT_CATEGORIES } from '@/types/category';

const COLLECTION_NAME = 'categories';

/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Fetch all categories
 * @param activeOnly - If true, only return active categories (default: false)
 */
export async function getAllCategories(activeOnly: boolean = false): Promise<Category[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const categories = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        slug: data.slug || '',
        color: data.color || '#2563eb',
        description: data.description || '',
        editorialDirective: data.editorialDirective || '',
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 999,
        articleCount: data.articleCount ?? 0,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        createdBy: data.createdBy || '',
      } as Category;
    });

    // Sort by sortOrder, then by name
    categories.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });

    if (activeOnly) {
      return categories.filter((c) => c.isActive);
    }
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch a single category by ID
 */
export async function getCategory(id: string): Promise<Category | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || '',
      slug: data.slug || '',
      color: data.color || '#2563eb',
      description: data.description || '',
      editorialDirective: data.editorialDirective || '',
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 999,
      articleCount: data.articleCount ?? 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      createdBy: data.createdBy || '',
    } as Category;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

/**
 * Fetch a category by name (case-insensitive)
 */
export async function getCategoryByName(name: string): Promise<Category | null> {
  try {
    // First try exact match on name
    const allCategories = await getAllCategories();
    const found = allCategories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (found) return found;

    // Fallback: try matching by slug
    const slug = generateSlug(name);
    return allCategories.find((c) => c.slug.toLowerCase() === slug) || null;
  } catch (error) {
    console.error('Error fetching category by name:', error);
    return null;
  }
}

/**
 * Get category color by name (for use in components)
 * Falls back to default color if category not found
 */
export async function getCategoryColorByName(name: string): Promise<string> {
  const category = await getCategoryByName(name);
  return category?.color || '#1d4ed8'; // Default blue
}

/**
 * Fetch a category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('slug', '==', slug.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return null;

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || '',
      slug: data.slug || '',
      color: data.color || '#2563eb',
      description: data.description || '',
      editorialDirective: data.editorialDirective || '',
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 999,
      articleCount: data.articleCount ?? 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      createdBy: data.createdBy || '',
    } as Category;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
}

/**
 * Create a new category
 */
export async function createCategory(data: CategoryInput): Promise<string> {
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      slug: data.slug || generateSlug(data.name),
      articleCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, data: CategoryUpdate): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

/**
 * Bulk delete categories
 */
export async function bulkDeleteCategories(ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    ids.forEach((id) => {
      const docRef = doc(db, COLLECTION_NAME, id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (error) {
    console.error('Error bulk deleting categories:', error);
    throw error;
  }
}

/**
 * Bulk update category status (activate/deactivate)
 */
export async function bulkUpdateCategoryStatus(ids: string[], isActive: boolean): Promise<void> {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    ids.forEach((id) => {
      const docRef = doc(db, COLLECTION_NAME, id);
      batch.update(docRef, { isActive, updatedAt: now });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error bulk updating category status:', error);
    throw error;
  }
}

/**
 * Toggle active status of a category
 */
export async function toggleCategoryStatus(id: string, currentStatus: boolean): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      isActive: !currentStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error toggling category status:', error);
    throw error;
  }
}

/**
 * Update article count for a category
 */
export async function updateCategoryArticleCount(id: string, count: number): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      articleCount: count,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating category article count:', error);
    throw error;
  }
}

/**
 * Seed default categories if none exist
 */
export async function seedDefaultCategories(createdBy: string): Promise<void> {
  try {
    const existing = await getAllCategories();
    if (existing.length > 0) {
      console.log('Categories already exist, skipping seed');
      return;
    }

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    DEFAULT_CATEGORIES.forEach((cat) => {
      const docRef = doc(collection(db, COLLECTION_NAME));
      batch.set(docRef, {
        ...cat,
        createdBy,
        createdAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();
    console.log('Default categories seeded successfully');
  } catch (error) {
    console.error('Error seeding default categories:', error);
    throw error;
  }
}

/**
 * Migrate existing article categories to the categories collection
 * This analyzes existing articles and creates categories for any that don't exist
 */
export async function migrateArticleCategories(createdBy: string): Promise<{ created: number; skipped: number }> {
  try {
    // Get existing categories
    const existingCategories = await getAllCategories();
    const existingSlugs = new Set(existingCategories.map((c) => c.slug.toLowerCase()));

    // Get all articles
    const articlesSnapshot = await getDocs(collection(db, 'articles'));
    const articleCategories = new Map<string, number>();

    articlesSnapshot.docs.forEach((docSnap) => {
      const category = docSnap.data().category;
      if (category) {
        const slug = generateSlug(category);
        articleCategories.set(slug, (articleCategories.get(slug) || 0) + 1);
      }
    });

    // Create categories for any that don't exist
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    let created = 0;
    let skipped = 0;

    articleCategories.forEach((count, slug) => {
      if (!existingSlugs.has(slug)) {
        const docRef = doc(collection(db, COLLECTION_NAME));
        batch.set(docRef, {
          name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
          slug,
          color: '#475569', // Default slate color for migrated categories
          description: '',
          editorialDirective: '',
          isActive: true,
          sortOrder: 999,
          articleCount: count,
          createdBy,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      } else {
        skipped++;
      }
    });

    if (created > 0) {
      await batch.commit();
    }

    // Update article counts for existing categories
    for (const cat of existingCategories) {
      const count = articleCategories.get(cat.slug.toLowerCase()) || 0;
      if (count !== cat.articleCount) {
        await updateCategoryArticleCount(cat.id, count);
      }
    }

    return { created, skipped };
  } catch (error) {
    console.error('Error migrating article categories:', error);
    throw error;
  }
}

/**
 * Recalculate all category article counts
 */
export async function recalculateArticleCounts(): Promise<void> {
  try {
    // Get all categories
    const categories = await getAllCategories();

    // Get all articles
    const articlesSnapshot = await getDocs(collection(db, 'articles'));
    const counts = new Map<string, number>();

    articlesSnapshot.docs.forEach((docSnap) => {
      const category = docSnap.data().category;
      if (category) {
        const slug = generateSlug(category);
        counts.set(slug, (counts.get(slug) || 0) + 1);
      }
    });

    // Update each category's article count
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    categories.forEach((cat) => {
      const count = counts.get(cat.slug.toLowerCase()) || 0;
      const docRef = doc(db, COLLECTION_NAME, cat.id);
      batch.update(docRef, { articleCount: count, updatedAt: now });
    });

    await batch.commit();
    console.log('Article counts recalculated successfully');
  } catch (error) {
    console.error('Error recalculating article counts:', error);
    throw error;
  }
}
