'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { User, UserRole, AccountType } from '@/types/user';
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_PERMISSIONS, hasPermission } from '@/data/rolePermissions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { X, Edit2, Shield, ChevronDown, Check, Camera, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ROLES: UserRole[] = [
  'admin',
  'business-owner',
  'editor-in-chief',
  'editor',
  'content-contributor',
  'commenter',
  'reader',
  'guest',
];

const ACCOUNT_TYPES: AccountType[] = ['free', 'basic', 'premium', 'enterprise'];

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  'free': 'Free',
  'basic': 'Basic',
  'premium': 'Premium',
  'enterprise': 'Enterprise',
};

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  'free': 'bg-gray-100 text-gray-700 border-gray-200',
  'basic': 'bg-blue-100 text-blue-700 border-blue-200',
  'premium': 'bg-amber-100 text-amber-700 border-amber-200',
  'enterprise': 'bg-purple-100 text-purple-700 border-purple-200',
};

const ROLE_COLORS: Record<UserRole, string> = {
  'admin': 'bg-red-100 text-red-800 border-red-200',
  'business-owner': 'bg-purple-100 text-purple-800 border-purple-200',
  'editor-in-chief': 'bg-blue-100 text-blue-800 border-blue-200',
  'editor': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'content-contributor': 'bg-green-100 text-green-800 border-green-200',
  'commenter': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'reader': 'bg-gray-100 text-gray-800 border-gray-200',
  'guest': 'bg-slate-100 text-slate-800 border-slate-200',
};

interface EditModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: string, updates: { displayName?: string; phone?: string; role?: UserRole; accountType?: AccountType; photoURL?: string }) => Promise<void>;
  currentUserRole: UserRole;
}

export function EditUserModal({ user, onClose, onSave, currentUserRole }: EditModalProps) {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [role, setRole] = useState<UserRole>(user.role);
  const [accountType, setAccountType] = useState<AccountType>(user.accountType || 'free');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canAssignRoles = hasPermission({ role: currentUserRole }, 'canAssignRoles');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURL(url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(user.id, { displayName, phone, role, accountType, photoURL });
      onClose();
    } catch (err) {
      alert('Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setChangingPassword(true);
    setPasswordMessage(null);

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newPassword,
          adminUid: currentUser?.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setNewPassword('');
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to change password'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center sticky top-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit2 size={20} />
            Edit User
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                {photoURL ? (
                  <Image
                    src={photoURL}
                    alt={displayName || 'User avatar'}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    style={{ width: 96, height: 96 }}
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {(displayName?.[0] || user.email[0]).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 shadow-lg"
                title="Upload avatar"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Click camera to upload avatar (max 5MB)</p>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            {canAssignRoles ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between bg-white hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${ROLE_COLORS[role]}`}>
                      {ROLE_LABELS[role]}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showRoleDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setRole(r);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 ${
                          role === r ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${ROLE_COLORS[r]}`}>
                              {ROLE_LABELS[r]}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{ROLE_DESCRIPTIONS[r]}</p>
                        </div>
                        {role === r && <Check size={16} className="text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${ROLE_COLORS[role]}`}>
                  {ROLE_LABELS[role]}
                </span>
                <p className="text-xs text-gray-400 mt-1">You don't have permission to change roles</p>
              </div>
            )}
          </div>

          {/* Account Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-between bg-white hover:bg-gray-50"
              >
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${ACCOUNT_TYPE_COLORS[accountType]}`}>
                  {ACCOUNT_TYPE_LABELS[accountType]}
                </span>
                <ChevronDown size={16} className={`transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showAccountDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {ACCOUNT_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setAccountType(t);
                        setShowAccountDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 ${
                        accountType === t ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${ACCOUNT_TYPE_COLORS[t]}`}>
                        {ACCOUNT_TYPE_LABELS[t]}
                      </span>
                      {accountType === t && <Check size={16} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Role Permissions Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Shield size={14} />
              Role Permissions
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(ROLE_PERMISSIONS[role]).slice(0, 8).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${value === true || value === 'all' ? 'bg-green-500' : value === 'own' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-600">{key.replace(/^can/, '').replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <span className="text-sm font-medium text-gray-700">Account Status</span>
              <p className="text-xs text-gray-500">User is currently {user.status}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {user.status === 'active' ? 'Active' : 'Blocked'}
            </span>
          </div>

          {/* Change Password */}
          <div className="pt-3 border-t border-gray-100">
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Lock size={14} />
              Change Password
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 whitespace-nowrap"
              >
                {changingPassword ? 'Changing...' : 'Set Password'}
              </button>
            </div>
            {passwordMessage && (
              <p className={`text-xs mt-2 ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {passwordMessage.text}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !displayName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
