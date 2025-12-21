# Roles & Permissions Structure

## User Roles Hierarchy

### 1. **Admin** (Highest Level)
- Full system access
- Can manage all users, roles, and permissions
- Access to all content, settings, and infrastructure
- Can delete/modify any content
- System configuration access

### 2. **Business Owner**
- Business-level access
- Can manage business settings and users within their organization
- View analytics and reports
- Manage subscriptions and billing
- Cannot access system infrastructure
- Can manage content contributors

### 3. **Editor-in-Chief** (Editorial Leadership)
- Manages editorial workflow
- Approves articles for publication
- Assigns stories to journalists
- Reviews and edits all content
- Cannot access business/financial settings
- Can manage journalists and content contributors

### 4. **Editor**
- Reviews and edits articles
- Can approve content for Editor-in-Chief review
- Assigns tasks to journalists
- Cannot publish directly (needs Editor-in-Chief approval)
- Limited user management

### 5. **Content Contributor** (Journalist/Writer)
- Creates and submits articles
- Can save drafts
- Cannot publish (must send to Editor)
- Limited to own content
- Can upload media

### 6. **Commenter**
- Can read all published content
- Can post and manage own comments
- No content creation access
- No admin panel access

### 7. **Reader** (Lowest Level)
- Read-only access to published content
- No commenting rights
- No admin panel access
- Public-facing only

## Users Section Menu Structure

```
Users (Main Section)
├── All Users (List view with filters)
│   ├── Search/Filter by role
│   ├── Search by name/email
│   └── Bulk actions
│
├── Roles & Permissions
│   ├── Role Management
│   │   ├── Create New Role
│   │   ├── Edit Existing Roles
│   │   └── Delete Roles
│   └── Permission Matrix
│       ├── Content Permissions
│       ├── User Management Permissions
│       ├── Settings Permissions
│       └── System Permissions
│
├── Add New User
│   ├── Basic Info (name, email, password)
│   ├── Assign Role
│   ├── Set Permissions
│   └── Notification Preferences
│
└── User Activity Log
    ├── Login history
    ├── Content changes
    └── Permission changes
```

## Permissions Matrix

### Content Permissions
| Permission | Admin | Business Owner | Editor-in-Chief | Editor | Content Contributor | Commenter | Reader |
|-----------|-------|----------------|-----------------|--------|-------------------|-----------|--------|
| Create Article | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Own Article | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Any Article | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Own Article | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete Any Article | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Publish Article | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Drafts | ✅ | ✅ | ✅ | ✅ | Own Only | ❌ | ❌ |
| Manage Comments | ✅ | ✅ | ✅ | ✅ | ❌ | Own Only | ❌ |

### User Management Permissions
| Permission | Admin | Business Owner | Editor-in-Chief | Editor | Content Contributor | Commenter | Reader |
|-----------|-------|----------------|-----------------|--------|-------------------|-----------|--------|
| Create Users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit Users | ✅ | ✅ | Limited | ❌ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign Roles | ✅ | ✅ | Limited | ❌ | ❌ | ❌ | ❌ |
| View User Activity | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Settings & System Permissions
| Permission | Admin | Business Owner | Editor-in-Chief | Editor | Content Contributor | Commenter | Reader |
|-----------|-------|----------------|-----------------|--------|-------------------|-----------|--------|
| Site Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| API Configuration | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Theme/Design | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Categories | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tags | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Media Library | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Infrastructure | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## User Profile Tab Structure

When clicking on a user, open a modal/panel with tabs:

```
User: John Doe
├── Profile (Tab 1)
│   ├── Avatar/Photo
│   ├── Full Name
│   ├── Email
│   ├── Bio
│   └── Contact Info
│
├── Role & Permissions (Tab 2)
│   ├── Current Role (dropdown)
│   ├── Custom Permissions (checkboxes)
│   └── Permission History
│
├── Content (Tab 3)
│   ├── Articles Created
│   ├── Drafts
│   ├── Published
│   └── Comments
│
├── Activity (Tab 4)
│   ├── Login History
│   ├── Recent Actions
│   └── Content Changes
│
└── Settings (Tab 5)
    ├── Email Notifications
    ├── Account Status (Active/Suspended)
    ├── Password Reset
    └── Delete User
```

## Implementation Priority

1. **Phase 1**: Basic role selection (dropdown in user creation/edit)
2. **Phase 2**: Permission checks in code (can user do X?)
3. **Phase 3**: Role management UI
4. **Phase 4**: Custom permissions per user
5. **Phase 5**: Activity logging and audit trail
