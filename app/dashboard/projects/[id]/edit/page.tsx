// import { Metadata } from 'next';
// import { ProjectFormWrapper } from '@/components/projects/forms/project-form-wrapper';
// import Breadcrumbs from '@/components/ui/components/breadcrumbs';
// import { Suspense } from 'react';

// export const metadata: Metadata = {
//   title: 'Edit Project',
// };

export default function Page({ 
    params 
  }: {
    params: Promise<any> | undefined;
  }) {
    const getId = async () => {
      if (!params) return "";
      const resolvedParams = params instanceof Promise ? await params : params;
      return resolvedParams.id;
    };
  
  //   return (
  //     <main>
  //       {/* <Breadcrumbs
  //         breadcrumbs={[
  //           { label: 'Projects', href: '/dashboard/projects' },
  //           {
  //             label: 'Edit Project',
  //             href: `/dashboard/projects/${getId()}/edit`,
  //             active: true,
  //           },
  //         ]}
  //       /> */}
  //       <Suspense fallback={<div>Loading form...</div>}>
  //         {/* <ProjectFormWrapper projectId={getId()} /> */}
  //       </Suspense>
  //     </main>
  //   );
  }