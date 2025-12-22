import { Metadata } from 'next';
import { config } from '@/lib/config';

interface MetadataParams {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  authors?: string[];
  tags?: string[];
}

export function generateMetadata({
  title,
  description,
  image,
  type = 'website',
  publishedTime,
  authors,
  tags,
}: MetadataParams): Metadata {
  const fullTitle = title ? `${title} | ${config.app.name}` : config.app.name;
  const fullDescription = description || `Latest news and updates from ${config.app.name}`;
  const fullImage = image || `${config.app.url}/og-image.jpg`; // Fallback image

  return {
    title: fullTitle,
    description: fullDescription,
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: config.app.url,
      siteName: config.app.name,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      type,
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
      ...(type === 'article' && authors ? { authors } : {}),
      ...(type === 'article' && tags ? { tags } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
    },
    metadataBase: new URL(config.app.url),
  };
}
