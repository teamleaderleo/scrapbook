// import { Metadata } from 'next';
// import { ProjectFormWrapper } from '@/components/projects/forms/project-form-wrapper';
// // import Breadcrumbs from '@/components/ui/components/breadcrumbs';
// import { Suspense } from 'react';

// export const metadata: Metadata = {
//   title: 'Edit Project',
// };

// export default function Page({ params }: { params: { id: string } }) {
//   return (
//     <main>
//       {/* <Breadcrumbs
//         breadcrumbs={[
//           { label: 'Projects', href: '/dashboard/projects' },
//           {
//             label: 'Edit Project',
//             href: `/dashboard/projects/${params.id}/edit`,
//             active: true,
//           },
//         ]}
//       /> */}
//       <Suspense fallback={<div>Loading form...</div>}>
//         {/* <ProjectFormWrapper projectId={params.id} /> */}
//       </Suspense>
//     </main>
//   );
// }