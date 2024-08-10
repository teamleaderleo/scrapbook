// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { ProjectForm } from './project-form';
// import { useProjects } from '@/app/lib/hooks/useProjects';
// import { useBlocks } from '@/app/lib/hooks/useBlocks';
// import { useTags } from '@/app/lib/hooks/useTags';
// import { useToastMessages } from '@/app/lib/hooks/useToastMessages';
// import { ADMIN_UUID } from '@/app/lib/constants';
// import { ProjectFormSubmission } from '@/app/lib/definitions/definitions';

// interface ProjectFormWrapperProps {
//   projectId?: string;
// }

// export function ProjectFormWrapper({ projectId }: ProjectFormWrapperProps) {
//   const router = useRouter();
//   const { projects, addProject, updateProject, isLoading: isLoadingProjects } = useProjects();
//   const { blocks, isLoading: isLoadingBlocks, error: blocksError } = useBlocks();
//   const { tagNamesToTags } = useTags();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

//   const { showToast } = useToastMessages();

//   const project = projectId ? projects?.find(p => p.id === projectId) : null;

//   useEffect(() => {
//     if (!isLoadingProjects && projectId && !project) {
//       router.replace('/dashboard/projects');
//     }
//   }, [project, projectId, router, isLoadingProjects]);

//   if (isLoadingProjects || isLoadingBlocks) {
//     return <div>Loading...</div>;
//   }

//   if (blocksError) {
//     return <div>Error loading blocks: {blocksError.message}</div>;
//   }

//   const defaultProject = {
//     accountId: ADMIN_UUID,
//     id: '',
//     name: '',
//     description: '',
//     status: 'pending' as const,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     tags: [],
//     blocks: []
//   };

//   const handleSubmit = async (data: ProjectFormSubmission) => {
//     setIsSubmitting(true);
//     try {
//       if (project) {
//         await updateProject({ id: projectId!, data });
//         showToast('success', 'update', 'project');
//       } else {
//         await addProject(data);
//         showToast('success', 'create', 'project');
//       }
//       router.push('/dashboard/projects');
//     } catch (error) {
//       console.error(`Failed to ${project ? 'update' : 'create'} project:`, error);
//       showToast('error', project ? 'update' : 'create', 'project');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Uncomment when we want to add AI suggestions back
//   // const handleGetAISuggestions = async () => {
//   //   const name = project ? project.name : '';
//   //   const description = project ? project.description || '' : '';
//   //   const { tags } = await getAISuggestions(name, description);
//   //   setSuggestedTags(tags);
//   // };

//   return (
//     <ProjectForm
//       project={project || defaultProject}
//       blocks={blocks || []}
//       onSubmit={handleSubmit}
//       isSubmitting={isSubmitting}
//       submitButtonText={project ? "Update Project" : "Create Project"}
//       cancelHref="/dashboard/projects"
//       suggestedTags={suggestedTags}
//       // onGetAISuggestions={handleGetAISuggestions}
//     />
//   );
// }