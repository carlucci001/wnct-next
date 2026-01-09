"use client";

import React, { useState, useEffect } from "react";
import { 
  getAllComments, 
  updateComment, 
  deleteComment, 
  getCommentSettings, 
  updateCommentSettings 
} from "@/lib/comments";
import { Comment, CommentStatus, CommentSettings } from "@/types/comment";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  Trash2, 
  Flag, 
  Settings,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function CommentAdmin() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<CommentStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [settings, setSettings] = useState<CommentSettings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    fetchData();
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getAllComments(filterStatus === "all" ? undefined : filterStatus as CommentStatus);
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSettings() {
    try {
      const s = await getCommentSettings();
      setSettings(s);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }

  const handleStatusChange = async (id: string, status: CommentStatus) => {
    try {
      await updateComment(id, { status });
      toast.success(`Comment ${status}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently delete this comment?")) {
      try {
        await deleteComment(id);
        toast.success("Comment deleted");
        fetchData();
      } catch (error) {
        toast.error("Failed to delete comment");
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      await updateCommentSettings(settings);
      toast.success("Settings updated");
      setIsSettingsOpen(false);
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  const filteredComments = comments.filter(c => 
    c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.articleTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif">Comment Management</h1>
          <p className="text-gray-500 text-sm">Moderate user discussions and manage comment settings.</p>
        </div>
        
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings size={18} /> Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Comment System Settings</DialogTitle>
            </DialogHeader>
            {settings && (
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Comments</Label>
                    <p className="text-xs text-gray-500">Allow users to comment on articles.</p>
                  </div>
                  <Switch 
                    checked={settings.enabled} 
                    onCheckedChange={(val) => setSettings({...settings, enabled: val})} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Approval</Label>
                    <p className="text-xs text-gray-500">Comments must be approved by admin before appearing.</p>
                  </div>
                  <Switch 
                    checked={settings.requireApproval} 
                    onCheckedChange={(val) => setSettings({...settings, requireApproval: val})} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Characters</Label>
                  <Input 
                    type="number" 
                    value={settings.maxCharacters} 
                    onChange={(e) => setSettings({...settings, maxCharacters: parseInt(e.target.value)})} 
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search comments, users, or articles..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select 
            className="bg-white border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as CommentStatus | "all")}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User / Date</TableHead>
              <TableHead className="w-[40%]">Comment Content</TableHead>
              <TableHead>Article</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">Loading comments...</TableCell>
              </TableRow>
            ) : filteredComments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">No comments found.</TableCell>
              </TableRow>
            ) : (
              filteredComments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell>
                    <div className="font-medium">{comment.userName}</div>
                    <div className="text-xs text-gray-500">
                      {typeof comment.createdAt === 'string' ? comment.createdAt : (comment.createdAt as unknown as { toDate: () => Date })?.toDate?.().toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm line-clamp-2" title={comment.content}>
                      {comment.content}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium truncate max-w-[150px]">
                      {comment.articleTitle || "Unknown Article"}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[150px]">
                      ID: {comment.articleId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      comment.status === 'approved' ? 'default' : 
                      comment.status === 'pending' ? 'secondary' : 
                      comment.status === 'flagged' ? 'destructive' : 'outline'
                    } className="capitalize">
                      {comment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {comment.status !== 'approved' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-green-600"
                          onClick={() => handleStatusChange(comment.id, 'approved')}
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </Button>
                      )}
                      {comment.status !== 'flagged' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-amber-600"
                          onClick={() => handleStatusChange(comment.id, 'flagged')}
                          title="Flag"
                        >
                          <Flag size={16} />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600"
                        onClick={() => handleDelete(comment.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
