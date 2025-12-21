# Authentication & Authorization System Guide

## Overview

The WNC Times application now features a comprehensive authentication and authorization system with the following capabilities:

- **Password-based authentication** with secure hashing (SHA-256)
- **Google OAuth integration** via Firebase
- **Role-based access control (RBAC)** with 7 user roles
- **Permission-based authorization** with 17 granular permissions
- **Session management** with automatic timeout (30 minutes)
- **Remember Me** functionality (30 days)
- **Password reset flow** with secure tokens
- **Route protection** based on roles and permissions

## User Roles

The system supports 7 hierarchical roles:

1. **Admin** - Full system access
2. **Business Owner** - Business-level access, cannot access infrastructure
3. **Editor-in-Chief** - Manages editorial workflow and publishing
4. **Editor** - Reviews and edits content, limited publishing rights
5. **Content Contributor** - Creates articles, limited to own content
6. **Commenter** - Can post and manage own comments (default for new users)
7. **Reader** - Read-only access
8. **Guest** - No authenticated access

See [ROLES_PERMISSIONS_STRUCTURE.md](ROLES_PERMISSIONS_STRUCTURE.md) for detailed permissions matrix.

## Key Features

### 1. User Registration

New users can register with:
- Full name
- Username (for login)
- Email address
- Password (with strength validation)

**Default Role**: Commenter (automatic approval)

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 2. Login Options

Users can log in using:
- **Username** or **Email** + Password
- **Google Sign-In** (if Firebase is configured)

**Remember Me**: Optional 30-day session persistence

### 3. Session Management

- **Session Timeout**: 30 minutes of inactivity
- **Warning**: 5 minutes before expiration
- **Auto-refresh**: On any user interaction
- **Cleanup**: Expired sessions automatically removed

### 4. Password Reset

Users can reset forgotten passwords through a secure flow:

1. Request reset at `/forgot-password`
2. Receive reset token (simulated email)
3. Use token at `/reset-password?token=XXX`
4. Set new password
5. Token expires after 1 hour

### 5. Route Protection

Routes can be protected with three levels:

```typescript
// Require authentication only
<ProtectedRoute>
  <Component />
</ProtectedRoute>

// Require specific role(s)
<ProtectedRoute requireRole={['admin', 'business-owner']}>
  <Component />
</ProtectedRoute>

// Require specific permission
<ProtectedRoute requirePermission="canPublishArticle">
  <Component />
</ProtectedRoute>
```

## File Structure

### Core Services

- **[services/auth.ts](services/auth.ts)** - Authentication logic, user management
- **[services/passwordUtils.ts](services/passwordUtils.ts)** - Password hashing, validation, token generation
- **[services/googleAuth.ts](services/googleAuth.ts)** - Google OAuth integration
- **[data/rolePermissions.ts](data/rolePermissions.ts)** - Role definitions and permission helpers

### Components

- **[components/ProtectedRoute.tsx](components/ProtectedRoute.tsx)** - Route protection wrapper
- **[components/SessionManager.tsx](components/SessionManager.tsx)** - Session timeout warnings

### Pages

- **[pages/Login.tsx](pages/Login.tsx)** - Login & registration UI
- **[pages/ForgotPassword.tsx](pages/ForgotPassword.tsx)** - Password reset request
- **[pages/ResetPassword.tsx](pages/ResetPassword.tsx)** - Password reset form
- **[pages/AccessDenied.tsx](pages/AccessDenied.tsx)** - Permission denied page

### Type Definitions

- **[types.ts](types.ts:132-156)** - User interface with auth fields

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required for password authentication (already working)
# No additional setup needed

# Optional: For Google Sign-In
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Setup (Optional - for Google OAuth)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable **Authentication** → **Sign-in method** → **Google**
4. Copy configuration values to `.env`
5. Add authorized domains (localhost, your production domain)

### 3. Default Admin Account

On first run, an admin account is automatically created:

- **Username**: `admin`
- **Email**: `admin@wnctimes.com`
- **Password**: `admin123`
- **Role**: Admin

**Important**: Change this password after first login!

## Usage Examples

### Check User Permissions

```typescript
import { authService } from './services/auth';
import { hasPermission } from './data/rolePermissions';

const user = authService.getCurrentUser();

// Check if user can publish articles
if (hasPermission(user, 'canPublishArticle')) {
  // Show publish button
}

// Check user role
if (user?.role === 'admin') {
  // Admin-only feature
}
```

### Protect a Component

```typescript
import ProtectedRoute from './components/ProtectedRoute';

// In your routes
<Route
  path="/admin"
  element={
    <ProtectedRoute requireRole={['admin', 'business-owner']}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

### Manually Refresh Session

```typescript
import { authService } from './services/auth';

// Extend user session
authService.refreshActivity();

// Check if session is still valid
if (authService.isSessionValid()) {
  // Session is active
} else {
  // Session expired, redirect to login
}
```

### Create New User (Admin Only)

```typescript
import { authService } from './services/auth';

// Register with password
const user = await authService.registerWithPassword(
  'John Doe',
  'john@example.com',
  'johndoe',
  'SecurePass123!'
);

// Admin creates user
const adminUser = authService.adminCreateUser(
  'Jane Editor',
  'jane@wnctimes.com',
  'editor'
);
```

## Security Considerations

### Current Implementation (Client-Side)

- **Storage**: localStorage (XSS vulnerable)
- **Hashing**: SHA-256 with salt (client-side)
- **Tokens**: Cryptographically secure random tokens
- **Session**: 30-minute timeout with activity tracking

### Known Limitations

1. **Client-side validation only** - All security checks happen in browser
2. **localStorage XSS risk** - Tokens stored in localStorage are vulnerable
3. **No rate limiting** - Password attempts are not limited
4. **Simulated email** - Password reset tokens logged to console

### Migration to Backend (Recommended)

For production, consider:

1. **Backend Authentication**
   - Use JWT tokens with HTTP-only cookies
   - Server-side password hashing (bcrypt, Argon2)
   - Rate limiting on auth endpoints
   - CSRF protection

2. **Database Storage**
   - Store users in Firebase Firestore or PostgreSQL
   - Hash passwords server-side before storage
   - Audit logging for security events

3. **Email Service**
   - Integrate SendGrid, AWS SES, or similar
   - Send real password reset emails
   - Email verification on registration

4. **Security Headers**
   - Content Security Policy (CSP)
   - X-Frame-Options
   - Strict-Transport-Security

## API Reference

### authService

```typescript
// Initialize storage (call on app start)
await authService.initializeStorage()

// Registration
const user = await authService.registerWithPassword(
  name: string,
  email: string,
  username: string,
  password: string
): Promise<User>

// Login
const user = await authService.loginWithPassword(
  identifier: string,  // username or email
  password: string,
  rememberMe: boolean
): Promise<User>

// Google OAuth
const user = await authService.loginWithGoogle(
  googleUser: { email: string; name: string; picture?: string }
): Promise<User>

// Password Reset
await authService.requestPasswordReset(email: string): Promise<string>
const user = authService.verifyResetToken(token: string): User | null
await authService.resetPassword(token: string, newPassword: string): Promise<void>

// Password Update
await authService.updatePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void>

// Session Management
const isValid = authService.isSessionValid(): boolean
authService.refreshActivity(): void
const time = authService.getTimeUntilExpiry(): number
authService.checkAndCleanupSessions(): void

// User Management
const user = authService.getCurrentUser(): User | null
const users = authService.getUsers(): User[]
authService.updateUser(user: User): void
authService.logout(): void
```

### Permission Helpers

```typescript
import { hasPermission, getUserPermissions, ROLE_PERMISSIONS } from './data/rolePermissions';

// Get effective permissions for user
const permissions = getUserPermissions(user)

// Check specific permission
const canPublish = hasPermission(user, 'canPublishArticle')

// Get role defaults
const adminPerms = ROLE_PERMISSIONS['admin']
```

## Testing Checklist

- [ ] Register new user with valid password
- [ ] Login with username
- [ ] Login with email
- [ ] Login with Google (if configured)
- [ ] Remember Me checkbox persists session
- [ ] Session timeout warning appears at 5 minutes
- [ ] Session expires after 30 minutes of inactivity
- [ ] User activity refreshes session
- [ ] Forgot password sends reset link
- [ ] Reset password with valid token
- [ ] Reset password with expired token fails
- [ ] Access denied page shows for insufficient permissions
- [ ] Admin dashboard requires admin/business-owner/editor-in-chief role
- [ ] Protected routes redirect to login when not authenticated
- [ ] Password strength indicator works
- [ ] Password validation prevents weak passwords

## Troubleshooting

### Google Sign-In Not Working

1. Check Firebase configuration in `.env`
2. Verify Google Sign-in is enabled in Firebase Console
3. Add your domain to Firebase authorized domains
4. Check browser console for errors

### Session Keeps Expiring

1. Check if `lastActivity` is being updated
2. Verify SESSION_TIMEOUT constant in [services/auth.ts:16](services/auth.ts#L16)
3. Check browser console for session cleanup logs

### Password Reset Link Invalid

1. Tokens expire after 1 hour
2. Check token in URL matches token in user storage
3. Verify reset link format: `/reset-password?token=XXX`

### Access Denied Loop

1. Check user role matches required role in ProtectedRoute
2. Verify permission checks in [data/rolePermissions.ts](data/rolePermissions.ts)
3. Check if user is suspended (`status === 'suspended'`)

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] OAuth providers (GitHub, Twitter, etc.)
- [ ] Email verification on registration
- [ ] Account lockout after failed attempts
- [ ] Password history (prevent reuse)
- [ ] Security questions
- [ ] Activity log viewer
- [ ] Admin user management UI
- [ ] Bulk role assignments
- [ ] Custom permission overrides per user

## Support

For questions or issues:
- Review [ROLES_PERMISSIONS_STRUCTURE.md](ROLES_PERMISSIONS_STRUCTURE.md)
- Check browser console for error messages
- Verify environment variables are set correctly
- Contact development team
