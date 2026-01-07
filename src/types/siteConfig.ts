// Site Configuration Types
// Used for white-label newspaper partner setup

export interface SiteConfig {
  // Basic Info
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  logoUrl?: string;
  faviconUrl?: string;

  // Contact Information
  contact: {
    email: string;
    phone: string;
    fax?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };

  // Business Information
  business: {
    legalName: string;
    dba?: string; // Doing Business As
    taxId?: string;
    yearFounded?: string;
  };

  // Social Media Links
  social: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
  };

  // SEO & Analytics
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
  };

  // Legal Pages Content
  legal: {
    privacyPolicy: string;
    termsOfUse: string;
    cookiePolicy?: string;
    disclaimer?: string;
    lastUpdated: string;
  };

  // Branding
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };

  // Operating Hours (for contact page)
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
    timezone?: string;
  };

  // Subscription/Newsletter settings
  newsletter: {
    enabled: boolean;
    provider?: string; // mailchimp, convertkit, etc.
    listId?: string;
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Default Privacy Policy Template - MUST BE DEFINED BEFORE DEFAULT_SITE_CONFIG
export const DEFAULT_PRIVACY_POLICY = `# Privacy Policy

**Last Updated: {{lastUpdated}}**

{{siteName}} ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.

## Information We Collect

### Personal Information
We may collect personal information that you voluntarily provide to us when you:
- Subscribe to our newsletter
- Submit a contact form
- Create an account
- Submit news tips or content

This information may include:
- Name and email address
- Phone number
- Mailing address
- Any other information you choose to provide

### Automatically Collected Information
When you visit our website, we automatically collect certain information, including:
- IP address
- Browser type
- Device information
- Pages visited and time spent
- Referring website

## How We Use Your Information

We use the information we collect to:
- Deliver news and content to you
- Send newsletters and updates (with your consent)
- Respond to your inquiries
- Improve our website and services
- Comply with legal obligations

## Cookies and Tracking Technologies

We use cookies and similar tracking technologies to:
- Remember your preferences
- Analyze website traffic
- Serve relevant advertisements

You can control cookie settings through your browser preferences.

## Third-Party Services

We may share information with third-party service providers for:
- Email delivery services
- Analytics (Google Analytics)
- Advertising networks
- Payment processing

## Your Rights

You have the right to:
- Access your personal information
- Correct inaccurate information
- Request deletion of your information
- Opt-out of marketing communications
- Disable cookies

## Data Security

We implement appropriate security measures to protect your information. However, no method of transmission over the Internet is 100% secure.

## Children's Privacy

Our website is not intended for children under 13. We do not knowingly collect information from children under 13.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.

## Contact Us

If you have questions about this Privacy Policy, please contact us:

**{{siteName}}**
{{address}}
Email: {{email}}
Phone: {{phone}}
`;

// Default Terms of Use Template - MUST BE DEFINED BEFORE DEFAULT_SITE_CONFIG
export const DEFAULT_TERMS_OF_USE = `# Terms of Use

**Last Updated: {{lastUpdated}}**

Welcome to {{siteName}}. By accessing or using our website, you agree to be bound by these Terms of Use.

## Acceptance of Terms

By accessing this website, you agree to these Terms of Use and our Privacy Policy. If you do not agree, please do not use our website.

## Use of Content

### Intellectual Property
All content on this website, including articles, photographs, graphics, and logos, is owned by {{businessName}} or our content providers and is protected by copyright laws.

### Permitted Use
You may:
- View and read content for personal, non-commercial use
- Share links to our articles on social media
- Print articles for personal use

### Prohibited Use
You may not:
- Reproduce, distribute, or republish content without permission
- Use content for commercial purposes without a license
- Remove copyright or attribution notices
- Use automated systems to scrape or copy content

## User Submissions

### News Tips and Content
If you submit news tips, photos, or other content:
- You grant us a non-exclusive license to use, edit, and publish the content
- You represent that you own the rights to the content
- You agree the content does not violate any laws or third-party rights

### Comments and Feedback
User comments must:
- Be respectful and civil
- Not contain hate speech, threats, or harassment
- Not include spam or advertising
- Not violate any laws

We reserve the right to remove any comments at our discretion.

## Disclaimers

### Content Accuracy
While we strive for accuracy, we make no warranties about the completeness or reliability of content. News and information may change, and we are not liable for any errors or omissions.

### Third-Party Links
Our website may contain links to third-party websites. We are not responsible for the content or practices of these websites.

### Advertising
Advertisements on our website are provided by third parties. We do not endorse the products or services advertised.

## Limitation of Liability

{{businessName}} shall not be liable for any direct, indirect, incidental, or consequential damages arising from:
- Your use of or inability to use our website
- Any content on our website
- Any third-party websites linked from our website

## Indemnification

You agree to indemnify and hold harmless {{businessName}}, its officers, directors, employees, and agents from any claims arising from your use of our website or violation of these Terms.

## Governing Law

These Terms shall be governed by the laws of the State of {{state}}, without regard to conflict of law principles.

## Changes to Terms

We may modify these Terms at any time. Continued use of our website after changes constitutes acceptance of the modified Terms.

## Termination

We reserve the right to terminate or restrict your access to our website at any time, without notice, for any reason.

## Contact Information

For questions about these Terms of Use, please contact:

**{{siteName}}**
{{address}}
Email: {{email}}
Phone: {{phone}}
`;

// Default configuration for new paper partners
export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: 'Your Newspaper Name',
  siteTagline: 'Your Community, Your News',
  siteDescription: 'Local news, business insights, and community stories from your region.',

  contact: {
    email: 'editor@yournewspaper.com',
    phone: '(555) 123-4567',
    address: {
      street: '123 Main Street',
      city: 'Your City',
      state: 'NC',
      zip: '28801',
      country: 'USA',
    },
  },

  business: {
    legalName: 'Your Newspaper LLC',
  },

  social: {
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
  },

  seo: {
    metaTitle: 'Your Newspaper - Local News & Community Stories',
    metaDescription: 'Stay informed with local news, business updates, and community events.',
    keywords: ['local news', 'community', 'newspaper'],
  },

  legal: {
    privacyPolicy: DEFAULT_PRIVACY_POLICY,
    termsOfUse: DEFAULT_TERMS_OF_USE,
    lastUpdated: new Date().toISOString(),
  },

  branding: {
    primaryColor: '#1d4ed8',
    secondaryColor: '#1e293b',
    accentColor: '#f59e0b',
  },

  hours: {
    monday: '9:00 AM - 5:00 PM',
    tuesday: '9:00 AM - 5:00 PM',
    wednesday: '9:00 AM - 5:00 PM',
    thursday: '9:00 AM - 5:00 PM',
    friday: '9:00 AM - 5:00 PM',
    saturday: 'Closed',
    sunday: 'Closed',
    timezone: 'EST',
  },

  newsletter: {
    enabled: true,
  },

  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
