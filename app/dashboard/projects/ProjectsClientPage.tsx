// 'use client';

// import { useEffect } from 'react';
// import { useQueryClient } from '@tanstack/react-query';
// import { Suspense } from 'react';
// import dynamic from 'next/dynamic';
// import Search from '@/components/ui/components/search';
// import { CreateProject } from '@/components/projects/components/button';
// import { ProjectsTableSkeleton } from '@/components/ui/components/skeletons';
// import { ADMIN_UUID } from '@/app/lib/constants';
// import { getCachedProjectBasics, } from '@/app/lib/data/cached-project-data';

// const ProjectsTable = dynamic(
//   () => import('@/components/projects/components/table').then((mod) => mod.ProjectsTable),
//   { ssr: false }
// );

// export default function ProjectsClientPage() {
//   const queryClient = useQueryClient();

//   useEffect(() => {
//     queryClient.prefetchQuery({
//       queryKey: ['projectBasics', ADMIN_UUID],
//     });
//   }, [queryClient]);

//   return (
//     <div className="w-full">
//       <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
//         <Suspense fallback={<div>Loading search...</div>}>
//           <Search placeholder="Search projects..." />
//         </Suspense>
//         <CreateProject />
//       </div>
//       <Suspense fallback={<ProjectsTableSkeleton />}>
//         <ProjectsTable accountId={ADMIN_UUID} />
//       </Suspense>
//     </div>
//   );
// }