// import { ArrowPathIcon } from '@heroicons/react/24/outline';
// import clsx from 'clsx';
// import Image from 'next/image';
// import { lusitana } from '@/components/ui/fonts';
// import { fetchLatestProjects } from '@/app/lib/data/data';
// import { getBlockThumbnail } from '@/app/lib/utils-client';

// const ADMIN_UUID = '410544b2-4001-4271-9855-fec4b6a6442a'
// export default async function LatestProjects() {
//   const latestProjects = await fetchLatestProjects(ADMIN_UUID);
//   return (
//     <div className="flex w-full flex-col md:col-span-4">
//       <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
//         Latest Project Activity
//       </h2>
//       <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
//         <div className="bg-white px-6">
//           {latestProjects.map((project, i) => {
//             const latestBlock = project.blocks && project.blocks.length > 0 ? project.blocks[0] : null;
//             return (
//               <div
//                 key={project.id}
//                 className={clsx(
//                   'flex flex-row items-center justify-between py-4',
//                   {
//                     'border-t': i !== 0,
//                   },
//                 )}
//               >
//                 <div className="flex items-center">
//                   {latestBlock ? (
//                     <Image
//                       src={getBlockThumbnail(latestBlock)}
//                       alt={`${project.name}'s latest block`}
//                       className="mr-4 rounded-full"
//                       width={32}
//                       height={32}
//                     />
//                   ) : (
//                     <div className="mr-4 h-8 w-8 rounded-full bg-gray-200"></div>
//                   )}
//                   <div className="min-w-0">
//                     <p className="truncate text-sm font-semibold md:text-base">
//                       {project.name}
//                     </p>
//                     <p className="hidden text-sm text-gray-500 sm:block">
//                       {project.description || 'No description'}
//                     </p>
//                   </div>
//                 </div>
//                 <p
//                   className={`${lusitana.className} truncate text-sm font-medium md:text-base`}
//                 >
//                   {project.status}
//                 </p>
//               </div>
//             );
//           })}
//         </div>
//         <div className="flex items-center pb-2 pt-6">
//           <ArrowPathIcon className="h-5 w-5 text-gray-500" />
//           <h3 className="ml-2 text-sm text-gray-500 ">Updated just now</h3>
//         </div>
//       </div>
//     </div>
//   );
// }