import { Metadata } from 'next';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { SiteConfig, DEFAULT_SITE_CONFIG, DEFAULT_PRIVACY_POLICY } from '@/types/siteConfig';
import ReactMarkdown from 'react-markdown';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Our privacy policy explains how we collect, use, and protect your information.',
};

export const dynamic = 'force-dynamic';

async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const db = getAdminFirestore();
    const doc = await db.collection('settings').doc('site-config').get();
    if (doc.exists) {
      return doc.data() as SiteConfig;
    }
  } catch (error) {
    console.error('Error fetching site config:', error);
  }
  return DEFAULT_SITE_CONFIG;
}

function replaceVariables(content: string, config: SiteConfig): string {
  const address = `${config.contact.address.street}, ${config.contact.address.city}, ${config.contact.address.state} ${config.contact.address.zip}`;
  const lastUpdated = config.legal.lastUpdated
    ? new Date(config.legal.lastUpdated).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return content
    .replace(/\{\{siteName\}\}/g, config.siteName)
    .replace(/\{\{businessName\}\}/g, config.business.legalName)
    .replace(/\{\{email\}\}/g, config.contact.email)
    .replace(/\{\{phone\}\}/g, config.contact.phone)
    .replace(/\{\{address\}\}/g, address)
    .replace(/\{\{state\}\}/g, config.contact.address.state)
    .replace(/\{\{lastUpdated\}\}/g, lastUpdated);
}

export default async function PrivacyPolicyPage() {
  const config = await getSiteConfig();
  const privacyContent = config.legal?.privacyPolicy || DEFAULT_PRIVACY_POLICY;
  const processedContent = replaceVariables(privacyContent, config);

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">
              How we collect, use, and protect your information
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
            <article className="prose prose-lg max-w-none prose-headings:font-serif prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-a:text-blue-600">
              <ReactMarkdown>{processedContent}</ReactMarkdown>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
