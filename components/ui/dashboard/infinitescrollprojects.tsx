import React, { useState, useEffect, useRef } from 'react';
import { Project } from '@/app/lib/definitions';
import { fetchProjects } from '@/app/lib/data';
import { ADMIN_UUID } from '@/app/lib/constants';

const ITEMS_PER_PAGE = 10;

export default function InfiniteScrollProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProjectRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadMoreProjects();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (lastProjectRef.current) {
      observer.current.observe(lastProjectRef.current);
    }
  }, [loading]);

  const loadMoreProjects = async () => {
    setLoading(true);
    const newProjects = await fetchProjects(ADMIN_UUID, page.toString(), ITEMS_PER_PAGE);
    setProjects(prevProjects => [...prevProjects, ...newProjects]);
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {projects.map((project, index) => (
        <div
          key={project.id}
          ref={index === projects.length - 1 ? lastProjectRef : null}
          className="bg-white p-4 rounded shadow"
        >
          <h3 className="font-bold">{project.name}</h3>
          <p>{project.description}</p>
          {/* Add more project details here */}
        </div>
      ))}
      {loading && <div>Loading more projects...</div>}
    </div>
  );
}