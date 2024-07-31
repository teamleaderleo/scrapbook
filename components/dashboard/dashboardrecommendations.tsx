// 'use client';

// import React, { useState, useEffect } from 'react';
// import { getRecommendations } from '@/app/lib/claude-utils';
// import { Button } from '@/components/ui/button';

// export function DashboardRecommendations() {
//   const [recommendations, setRecommendations] = useState<{projects: string[], blocks: string[], tags: string[]}>({
//     projects: [],
//     blocks: [],
//     tags: []
//   });
//   const [isLoading, setIsLoading] = useState(false);

//   const fetchRecommendations = async () => {
//     setIsLoading(true);
//     try {
//       const result = await getRecommendations({
//         includeProjects: true,
//         includeArtifacts: true,
//         includeTags: true,
//         includeContentExtensions: true
//       });
//       setRecommendations(result);
//     } catch (error) {
//       console.error('Failed to fetch recommendations:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="mt-6 p-4 bg-gray-50 rounded-lg">
//       <h2 className="text-xl font-bold mb-4">Recommendations</h2>
//       <Button onClick={fetchRecommendations} disabled={isLoading}>
//         {isLoading ? 'Loading...' : 'Get Recommendations'}
//       </Button>
//       {recommendations.projects.length > 0 && (
//         <div className="mt-4">
//           <h3 className="font-semibold">Recommended Projects</h3>
//           <ul className="list-disc pl-5">
//             {recommendations.projects.map((project, index) => (
//               <li key={index}>{project}</li>
//             ))}
//           </ul>
//         </div>
//       )}
//       {recommendations.blocks.length > 0 && (
//         <div className="mt-4">
//           <h3 className="font-semibold">Recommended Artifacts</h3>
//           <ul className="list-disc pl-5">
//             {recommendations.blocks.map((block, index) => (
//               <li key={index}>{block}</li>
//             ))}
//           </ul>
//         </div>
//       )}
//       {recommendations.tags.length > 0 && (
//         <div className="mt-4">
//           <h3 className="font-semibold">Recommended Tags</h3>
//           <div className="flex flex-wrap gap-2">
//             {recommendations.tags.map((tag, index) => (
//               <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
//                 {tag}
//               </span>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }