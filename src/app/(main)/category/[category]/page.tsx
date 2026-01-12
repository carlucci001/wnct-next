import { Metadata } from 'next';
import CategoryClient from './CategoryClient';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  
  const pageTitle = decodedCategory.toLowerCase().endsWith('news')
    ? decodedCategory
    : `${decodedCategory} News`;
    
  const title = `${pageTitle} | WNC Times - Local Western North Carolina News`;
  const description = `Read the latest ${decodedCategory} news and updates from WNC Times. Your source for local community stories in Western North Carolina.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://wnctimes.com/category/${category}`,
      siteName: 'WNC Times',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `https://wnctimes.com/category/${category}`,
    },
  };
}

export default async function Page({ params }: Props) {
  const { category } = await params;
  
  return <CategoryClient category={category} />;
}
