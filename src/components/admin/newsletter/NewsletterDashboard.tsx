'use client';

import { useState, useEffect } from 'react';
import { Newsletter } from '@/types/newsletter';
import { getNewsletters, createNewsletter, updateNewsletter, deleteNewsletter } from '@/lib/newsletter';
import { NewsletterList } from './NewsletterList';
import { NewsletterEditor } from './NewsletterEditor';
import { SubscriberList } from './SubscriberList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function NewsletterDashboard() {
  const [activeTab, setActiveTab] = useState('newsletters');
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNewsletters = async () => {
    setIsLoading(true);
    try {
      const data = await getNewsletters();
      setNewsletters(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load newsletters');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNewsletters();
  }, []);

  const handleCreate = () => {
    setSelectedNewsletter(null);
    setView('editor');
  };

  const handleEdit = (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter);
    setView('editor');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return;
    try {
      await deleteNewsletter(id);
      toast.success('Newsletter deleted');
      loadNewsletters();
    } catch (error) {
      toast.error('Failed to delete newsletter');
    }
  };

  const handleSave = async (data: Partial<Newsletter>) => {
    try {
      if (selectedNewsletter) {
        await updateNewsletter(selectedNewsletter.id, data);
      } else {
        await createNewsletter(data as any);
      }
      loadNewsletters();
      setView('list');
    } catch (error) {
      throw error;
    }
  };

  const handleSend = async (id: string) => {
      try {
          const response = await fetch('/api/newsletter/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ newsletterId: id })
          });

          if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to send');
          }

          loadNewsletters();
      } catch (error) {
          throw error;
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletter Management</h1>
          <p className="text-muted-foreground">Manage campaigns, subscribers, and analytics.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="newsletters" onClick={() => setView('list')}>Campaigns</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>

        <TabsContent value="newsletters" className="space-y-4">
          {view === 'list' ? (
            <NewsletterList
              newsletters={newsletters}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onNew={handleCreate}
              onRefresh={loadNewsletters}
            />
          ) : (
            <NewsletterEditor
              newsletter={selectedNewsletter}
              onSave={handleSave}
              onSend={handleSend}
              onCancel={() => setView('list')}
            />
          )}
        </TabsContent>

        <TabsContent value="subscribers">
          <SubscriberList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
