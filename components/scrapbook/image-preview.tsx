import { Card } from '@/components/ui/card';
import Image from 'next/image';

interface ImageAttachment {
  src: string;
  alt: string;
}

const ImagePreview = ({ 
  image, 
  isExpanded, 
  transformClass 
}: { 
  image: ImageAttachment;
  isExpanded: boolean;
  transformClass: string;
}) => (
  <Card className={`
    absolute top-0 left-0 bg-gray-50 border border-gray-200
    transition-all duration-300 ease-out -rotate-1 w-80
    ${transformClass}
  `}>
    {isExpanded ? (
        <Image
          src={image.src}
          alt={image.alt}
          className="rounded w-full h-auto"
          layout="responsive"
          width={500}
          height={300}
      />
    ) : (
      <div className="h-[120px]">
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          IMG
        </div>
      </div>
    )}
  </Card>
);

export default ImagePreview;