// import React, { useState, useEffect } from 'react';
// import { Block } from '@/app/lib/definitions';
// import { fetchRecommendedBlocks } from '@/app/lib/data/data';
// import { ADMIN_UUID } from '@/app/lib/constants';
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";

// export default function ForYouCarousel() {
//   const [blocks, setBlocks] = useState<Block[]>([]);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   useEffect(() => {
//     loadRecommendedBlocks();
//   }, []);

//   const loadRecommendedBlocks = async () => {
//     const recommendedBlocks = await fetchRecommendedBlocks(ADMIN_UUID);
//     setBlocks(recommendedBlocks);
//   };

//   const nextBlock = () => {
//     setCurrentIndex((prevIndex) => (prevIndex + 1) % blocks.length);
//   };

//   const prevBlock = () => {
//     setCurrentIndex((prevIndex) => (prevIndex - 1 + blocks.length) % blocks.length);
//   };

//   if (blocks.length === 0) {
//     return <div>Loading recommendations...</div>;
//   }

//   const currentBlock = blocks[currentIndex];

//   return (
//     <Card className="w-full max-w-md mx-auto">
//       <CardContent className="p-6">
//         <h2 className="text-2xl font-bold mb-4">For You</h2>
//         <div className="mb-4">
//           <h3 className="text-xl font-semibold">{currentBlock.name}</h3>
//           <p className="text-gray-600">{currentBlock.description}</p>
//           {/* Display more block details here */}
//         </div>
//         <div className="flex justify-between">
//           <Button onClick={prevBlock}>Previous</Button>
//           <Button onClick={nextBlock}>Next</Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }