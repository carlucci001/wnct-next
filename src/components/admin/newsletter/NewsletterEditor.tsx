'use client';

import { useState, useEffect } from 'react';
import { Newsletter } from '@/types/newsletter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Save, Send } from 'lucide-react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-md" />,
});

interface NewsletterEditorProps {
  newsletter?: Newsletter | null;
  onSave: (newsletter: Partial<Newsletter>) => Promise<void>;
  onSend: (id: string) => Promise<void>;
  onCancel: () => void;
}

export function NewsletterEditor({ newsletter, onSave, onSend, onCancel }: NewsletterEditorProps) {
  const [formData, setFormData] = useState<Partial<Newsletter>>({
    title: '',
    subject: '',
    content: '',
    status: 'draft',
    audience: 'subscribers' // Default
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (newsletter) {
      setFormData(newsletter);
    }
  }, [newsletter]);

  const handleSave = async () => {
    if (!formData.title || !formData.subject) {
      toast.error('Please provide a title and subject');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      toast.success('Newsletter saved');
    } catch (error) {
        console.error(error);
      toast.error('Failed to save newsletter');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!newsletter?.id) return;

    if (!confirm('Are you sure you want to send this newsletter to all active subscribers? This cannot be undone.')) {
        return;
    }

    setIsSending(true);
    try {
      await onSend(newsletter.id);
      toast.success('Newsletter queued for sending');
      onCancel(); // Go back to list
    } catch (error) {
        console.error(error);
      toast.error('Failed to send newsletter');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{newsletter ? 'Edit Newsletter' : 'New Newsletter'}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving || isSending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isSending}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Draft
          </Button>
          {newsletter && newsletter.status !== 'sent' && (
             <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleSend} disabled={isSaving || isSending}>
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Now
             </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Internal Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. June Weekly Roundup"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. This week's top stories from WNC Times"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <div className="min-h-[400px]">
              <RichTextEditor
                content={formData.content || ''}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Compose your newsletter..."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
