'use client';

import { Newsletter } from '@/types/newsletter';
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
import { Edit, Trash2, Plus, RefreshCw } from 'lucide-react';

interface NewsletterListProps {
  newsletters: Newsletter[];
  isLoading: boolean;
  onEdit: (newsletter: Newsletter) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onRefresh: () => void;
}

export function NewsletterList({ newsletters, isLoading, onEdit, onDelete, onNew, onRefresh }: NewsletterListProps) {
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
        <h2 className="text-xl font-semibold">Newsletters</h2>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button onClick={onNew}>
                <Plus className="mr-2 h-4 w-4" /> New Newsletter
            </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {newsletters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No newsletters found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                newsletters.map((newsletter) => (
                  <TableRow key={newsletter.id}>
                    <TableCell>
                      <div className="font-medium">{newsletter.title}</div>
                      <div className="text-sm text-muted-foreground">{newsletter.subject}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        newsletter.status === 'sent' ? 'secondary' :
                        newsletter.status === 'scheduled' ? 'outline' : 'default'
                      } className={
                        newsletter.status === 'sent' ? 'bg-green-100 text-green-800' :
                        newsletter.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {newsletter.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {newsletter.sentAt ? new Date(newsletter.sentAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      {newsletter.stats ? (
                        <div className="text-sm">
                          <div>Sent: {newsletter.stats.totalRecipients}</div>
                          {/* <div>Opened: {newsletter.stats.opened}</div> */}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(newsletter)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(newsletter.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
