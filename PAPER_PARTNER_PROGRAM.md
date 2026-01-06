# Paper Partner Program - SaaS Platform

## Overview
A white-label local news platform that enables publishers to launch their own AI-powered news sites with credit-based billing.

## Brand Positioning
- **Product Name:** Paper Partner Program
- **Tagline:** "Launch Your Local News Empire"
- **Value Prop:** Keep 100% of your advertising revenue. Only pay for the AI tools you use.

---

## Subscription Tiers

| Tier | Price | Credits/Month | Best For |
|------|-------|---------------|----------|
| **Starter** | $19/mo | 175 | Small local news sites |
| **Growth** | $49/mo | 575 | Growing publications |
| **Professional** | $99/mo | 1,400 | Active publishers |
| **Enterprise** | $249/mo | 4,500 | Large-scale operations |

## Credit Costs

| Feature | Credits | Description |
|---------|---------|-------------|
| AI Article + Image | 5 | Full article with one DALL-E image |
| Additional Image | 2 | Standard quality |
| HD Image | 4 | High definition |
| Text-to-Speech | 1/500 chars | Audio version of articles |
| AI Agent Run | 3 | Automated content generation |
| AI Ad Creation | 5 | Generate ad copy + images |
| Manual Ad Upload | 1 | Upload your own creative |

## Top-Off Packs (Never Expire)

| Pack | Price | Credits |
|------|-------|---------|
| Small | $5 | 50 |
| Medium | $10 | 100 |
| Large | $20 | 250 |
| Bulk | $35 | 500 |

---

## Key Differentiators from WNC Times

| Feature | WNC Times (Master) | Paper Partner (SaaS) |
|---------|-------------------|---------------------|
| Database | Single site | Multi-tenant with tenantId |
| Billing | None | Credit-based subscription |
| Branding | WNC Times branded | White-label customizable |
| Users | Staff only | Tenant owners + their staff |
| Ads | Manual | AI-generated + subscriber keeps 100% |

---

## Technical Implementation Status

### Completed (Phase 1)
- [x] Tenant types and interfaces
- [x] Credit pricing configuration
- [x] Dual credit pool system (subscription + top-off)
- [x] Credit deduction logic
- [x] Firestore security rules for multi-tenancy
- [x] Tenant CRUD operations

### Pending (Phase 2+)
- [ ] **Landing/Sales Page** - Public marketing page
- [ ] **Signup Flow** - Tenant onboarding wizard
- [ ] **Credits Dashboard** - Balance, usage, buy more
- [ ] **Stripe Integration** - Subscriptions & one-time purchases
- [ ] **Tenant Settings** - Branding, domain, team management

---

## Files Location (saas branch)

```
src/
├── types/tenant.ts          # Tenant, Credit, Advertiser types
├── config/creditPricing.ts  # Pricing configuration
├── lib/credits.ts           # Credit deduction logic
├── lib/tenants.ts           # Tenant CRUD operations
└── app/saas/                 # SaaS-specific pages (to be created)
    ├── page.tsx             # Landing page
    ├── pricing/page.tsx     # Pricing page
    └── signup/page.tsx      # Onboarding flow
```

---

## Sales Pipeline Integration

### Lead Capture Fields
- Business/Publication Name
- Contact Name & Email
- Current website (if any)
- Estimated monthly article volume
- Interest level (trial vs ready to buy)

### Onboarding Flow
1. Landing page → "Start Free Trial" CTA
2. Account creation (email/password)
3. Publication setup (name, branding)
4. 14-day trial with 50 credits
5. Stripe checkout for subscription

---

## Git Branches

- **master** - WNC Times newspaper (production)
- **saas** - Paper Partner Program (SaaS platform)

Updates flow: `master` → merge into `saas`

GitHub: https://github.com/carlucci001/wnct-next/tree/saas
