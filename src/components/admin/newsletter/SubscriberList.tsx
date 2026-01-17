'use client';

import { useState, useEffect } from 'react';
import { NewsletterSubscription } from '@/types/newsletter';
import { getSubscribers, unsubscribe } from '@/lib/newsletter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

export function SubscriberList() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscribers = async () => {
    setIsLoading(true);
    try {
      const data = await getSubscribers();
      setSubscribers(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load subscribers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const handleUnsubscribe = async (email: string) => {
      if (!confirm(`Are you sure you want to unsubscribe ${email}?`)) return;
      try {
          await unsubscribe(email);
          toast.success('Unsubscribed user');
          loadSubscribers();
      } catch (error) {
          toast.error('Failed to unsubscribe');
      }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Subscribers ({subscribers.length})</h2>
        <Button variant="outline" size="sm" onClick={loadSubscribers}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No active subscribers found.
                  </TableCell>
                </TableRow>
              ) : (
                subscribers.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{sub.source || 'Unknown'}</TableCell>
                    <TableCell>
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleUnsubscribe(sub.email)} title="Unsubscribe">
                            <UserMinus className="h-4 w-4 text-red-600" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
