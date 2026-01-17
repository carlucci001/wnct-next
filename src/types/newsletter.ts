export interface DeliveryStats {
  totalRecipients: number;
  successful: number;
  failed: number;
  opened: number;
  clicked: number;
}

export interface Newsletter {
  id: string;
  title: string;
  subject: string;
  content: string; // HTML content
  status: 'draft' | 'scheduled' | 'sent';
  templateId?: string;
  scheduledAt?: string; // ISO date string
  sentAt?: string; // ISO date string
  audience: 'all' | 'subscribers' | 'specific_emails';
  targetEmails?: string[]; // Used if audience is 'specific_emails'
  stats?: DeliveryStats;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // User ID
}

export interface NewsletterSubscription {
  id: string; // Usually email address or auto-generated
  email: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  preferences?: {
    categories?: string[];
    frequency?: 'daily' | 'weekly';
  };
  createdAt: string;
  updatedAt: string;
  source?: string;
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  description?: string;
  content: string; // HTML template with placeholders
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}
