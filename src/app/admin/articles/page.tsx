'use client';

import { usePermissions } from '@/hooks/usePermissions';

export default function ArticlesPage() {
  const { can } = usePermissions();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Articles</h1>

      <div className="mb-4">
        {can('create_article') && (
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Create New Article
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded p-4">
        <p>List of articles will go here.</p>

        {/* Example of conditional rendering based on permission */}
        <div className="mt-4 border-t pt-4">
           <h3 className="font-bold">Actions</h3>
           <ul className="flex gap-4 mt-2">
             <li>Edit (Visible if can edit)</li>
             {can('publish_article') && (
               <li className="text-green-600">Publish (Visible to Admin/Editor)</li>
             )}
             {can('delete_any_article') && (
               <li className="text-red-600">Delete (Visible to Admin/Owner/EIC)</li>
             )}
           </ul>
        </div>
      </div>
    </div>
  );
}
