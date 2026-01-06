import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paper Partner Program - Launch Your Local News Empire',
  description: 'AI-powered local news platform. Keep 100% of your advertising revenue. Only pay for the AI tools you use.',
  keywords: ['local news', 'AI journalism', 'news platform', 'SaaS', 'content generation'],
};

export default function SaaSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="saas-landing">
      {children}
    </div>
  );
}
