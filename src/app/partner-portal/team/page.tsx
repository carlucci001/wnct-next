'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock team members (would come from Firestore in production)
const MOCK_TEAM = [
  {
    id: '1',
    displayName: 'You (Owner)',
    email: 'owner@example.com',
    role: 'owner',
    photoURL: '',
    status: 'active',
  },
];

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features' },
  { value: 'editor', label: 'Editor', description: 'Can create and edit articles' },
  { value: 'writer', label: 'Writer', description: 'Can write and submit articles' },
];

export default function PartnerPortalTeam() {
  const { userProfile } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('writer');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const handleInvite = async () => {
    // In production, this would send an invite email and create a pending team member
    console.log('Inviting:', inviteEmail, 'with role:', inviteRole);
    setInviteEmail('');
    setInviteDialogOpen(false);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8" />
            Team Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Invite team members to help manage your publication.
          </p>
        </div>

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your publication team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-slate-500">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={!inviteEmail}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            People who have access to manage your publication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current User (Owner) */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userProfile?.photoURL || ''} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {userProfile?.displayName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {userProfile?.displayName || 'You'} <span className="text-slate-500">(You)</span>
                  </p>
                  <p className="text-sm text-slate-500">{userProfile?.email}</p>
                </div>
              </div>
              <Badge variant="default" className="bg-emerald-600">
                <Shield className="w-3 h-3 mr-1" />
                Owner
              </Badge>
            </div>

            {/* Empty State */}
            {MOCK_TEAM.length <= 1 && (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="mb-2">No team members yet</p>
                <p className="text-sm">Invite colleagues to help manage your publication.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Roles Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            What each role can do in your publication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default">Admin</Badge>
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Full access to all features</li>
                <li>• Manage team members</li>
                <li>• Access billing & settings</li>
                <li>• Publish without review</li>
              </ul>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Editor</Badge>
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Create and edit articles</li>
                <li>• Review writer submissions</li>
                <li>• Publish articles</li>
                <li>• Manage images</li>
              </ul>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Writer</Badge>
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Write articles</li>
                <li>• Submit for review</li>
                <li>• Upload images</li>
                <li>• View own content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
