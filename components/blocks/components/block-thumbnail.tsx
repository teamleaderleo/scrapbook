// 'use client';

// import React, { useState } from 'react';
// import Image from 'next/image';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Block } from "@/app/lib/definitions/definitions";
// import { getBlockThumbnail } from '@/app/lib/utils-client';

// interface BlockThumbnailProps {
//   block: Block;
//   contentIndex?: number;
//   size?: number;
//   priority?: boolean;
//   className?: string;
// }

// export const BlockThumbnail: React.FC<BlockThumbnailProps> = ({ 
//   block, 
//   contentIndex = 0, 
//   size = 40,
//   priority = true,
//   className = '',
// }) => {
//   const [isLoading, setIsLoading] = useState(true);
//   const thumbnailUrl = getBlockThumbnail(block, contentIndex);

//   return (
//     <div 
//     >
//       <AnimatePresence>
//         {isLoading && (
//           <motion.div
//             initial={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.6 }}
//             className={`relative overflow-hidden ${className}`}
//             style={{ width: size, height: size }}
//           />
//         )}
//       </AnimatePresence>
//       <Image
//         src={thumbnailUrl}
//         alt={`Thumbnail for ${block.name}`}
//         fill
//         sizes={`${size}px`}
//         style={{ objectFit: "cover" }}
//         priority={priority}
//         className={`rounded-full`}
//         onLoad={() => setIsLoading(true)}
//       />
//     </div>
//   );
// };