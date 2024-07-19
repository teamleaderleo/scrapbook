// import React, { useState, useEffect } from 'react';
// import { Artifact } from '@/app/lib/definitions';
// import { fetchRecommendedArtifacts } from '@/app/lib/data/data';
// import { ADMIN_UUID } from '@/app/lib/constants';
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";

// export default function ForYouCarousel() {
//   const [artifacts, setArtifacts] = useState<Artifact[]>([]);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   useEffect(() => {
//     loadRecommendedArtifacts();
//   }, []);

//   const loadRecommendedArtifacts = async () => {
//     const recommendedArtifacts = await fetchRecommendedArtifacts(ADMIN_UUID);
//     setArtifacts(recommendedArtifacts);
//   };

//   const nextArtifact = () => {
//     setCurrentIndex((prevIndex) => (prevIndex + 1) % artifacts.length);
//   };

//   const prevArtifact = () => {
//     setCurrentIndex((prevIndex) => (prevIndex - 1 + artifacts.length) % artifacts.length);
//   };

//   if (artifacts.length === 0) {
//     return <div>Loading recommendations...</div>;
//   }

//   const currentArtifact = artifacts[currentIndex];

//   return (
//     <Card className="w-full max-w-md mx-auto">
//       <CardContent className="p-6">
//         <h2 className="text-2xl font-bold mb-4">For You</h2>
//         <div className="mb-4">
//           <h3 className="text-xl font-semibold">{currentArtifact.name}</h3>
//           <p className="text-gray-600">{currentArtifact.description}</p>
//           {/* Display more artifact details here */}
//         </div>
//         <div className="flex justify-between">
//           <Button onClick={prevArtifact}>Previous</Button>
//           <Button onClick={nextArtifact}>Next</Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }