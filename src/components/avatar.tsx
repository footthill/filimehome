import { useState } from 'react';
import fallabck from '../assets/fallaback.png';

function AvatarImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src || fallabck);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className="object-cover  w-full h-full"
      onError={() => setImgSrc(fallabck)}
    />
  );
}
export default AvatarImage;