'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import Image from 'next/image';
import Link from 'next/link';
import { CheckIcon } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  dueDate: string;
  progress: number;
  images: string[];
}

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
  <Card className="relative overflow-hidden group">
    <Link href={`/projects/${project.id}`} className="absolute inset-0 z-10">
      <span className="sr-only">View project</span>
    </Link>
    <div className="grid grid-cols-2 gap-2 h-[200px] md:h-[250px]">
      <Image
        src={project.images[0]}
        width={300}
        height={300}
        alt={`${project.name} image 1`}
        className="object-cover w-full h-full rounded-tl-lg"
      />
      <div className="grid grid-rows-2 gap-2">
        <Image
          src={project.images[1]}
          width={300}
          height={300}
          alt={`${project.name} image 2`}
          className="object-cover w-full h-full rounded-tr-lg"
        />
        <Image
          src={project.images[2]}
          width={300}
          height={300}
          alt={`${project.name} image 3`}
          className="object-cover w-full h-full rounded-bl-lg"
        />
      </div>
      <Image
        src={project.images[3]}
        width={300}
        height={300}
        alt={`${project.name} image 4`}
        className="object-cover w-full h-full rounded-br-lg"
      />
    </div>
    <div className="p-4 bg-background">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{project.name}</h3>
        <div className="text-sm text-muted-foreground">Due: {project.dueDate}</div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-sm text-muted-foreground">Progress: {project.progress}%</div>
        <div className="flex items-center gap-1 text-sm font-medium">
          <CheckIcon className="w-4 h-4 text-primary" />
          {project.progress}%
        </div>
      </div>
    </div>
  </Card>
);

const InfiniteScrollProjectGallery: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const loader = useRef<HTMLDivElement>(null);
  const totalProjects = 16; // Total number of unique projects

  const loadMoreProjects = async () => {
    if (loading) return;
    setLoading(true);
    // Simulated API call - replace with actual API call
    const newProjects = await fetchProjects(page);
    setProjects(prevProjects => {
      const updatedProjects = [...prevProjects, ...newProjects];
      // If we've loaded all projects, start removing from the beginning
      if (updatedProjects.length > totalProjects) {
        return updatedProjects.slice(-totalProjects);
      }
      return updatedProjects;
    });
    setPage(prevPage => (prevPage % (totalProjects / 4)) + 1); // Loop back to 1 after reaching the end
    setLoading(false);
  };

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "20px",
      threshold: 1.0
    };

    const observer = new IntersectionObserver(handleObserver, options);
    if (loader.current) {
      observer.observe(loader.current);
    }

    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, []);

  const handleObserver = (entities: IntersectionObserverEntry[]) => {
    const target = entities[0];
    if (target.isIntersecting) {
      loadMoreProjects();
    }
  };

  // Simulated fetch function - replace with actual API call
  const fetchProjects = async (page: number): Promise<Project[]> => {
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return Array(4).fill(null).map((_, index) => ({
      id: `project-${((page - 1) * 4 + index) % totalProjects + 1}`,
      name: `Project ${((page - 1) * 4 + index) % totalProjects + 1}`,
      dueDate: new Date(Date.now() + Math.random() * 10000000000).toLocaleDateString(),
      progress: Math.floor(Math.random() * 100),
      images: Array(4).fill('/placeholder.svg')
    }));
  };

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <div ref={loader} className="h-10 flex items-center justify-center">
        {loading && <p>Loading more projects...</p>}
      </div>
    </div>
  );
};

export default InfiniteScrollProjectGallery;