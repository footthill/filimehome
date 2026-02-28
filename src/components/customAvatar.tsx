import { useState } from 'react';
import fallabck from '../assets/fallaback.png';

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

function AvatarImage({ src, alt, ...rest }: AvatarImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallabck);

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(fallabck)}
      {...rest} // spreads any additional props (e.g., className, style)
    />
  );
}

export default AvatarImage;
