"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";

// Inline SVG placeholder as base64 - can never be corrupted since it's in code
const INLINE_PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5NGEzYjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc = "/placeholder.jpg",
  alt,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [errorCount, setErrorCount] = useState(0);

  const handleError = () => {
    if (errorCount === 0) {
      // First error: try the file-based placeholder
      setErrorCount(1);
      setImgSrc(fallbackSrc);
    } else if (errorCount === 1) {
      // Second error: placeholder.jpg also failed, use inline SVG
      setErrorCount(2);
      setImgSrc(INLINE_PLACEHOLDER);
    }
    // If errorCount >= 2, we've already tried everything
  };

  // Reset error state if src changes
  React.useEffect(() => {
    setImgSrc(src);
    setErrorCount(0);
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
      unoptimized={true}
    />
  );
};

export default ImageWithFallback;