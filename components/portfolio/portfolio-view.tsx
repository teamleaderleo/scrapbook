'use client';

import React from 'react';
import { useArtifacts } from '@/app/lib/hooks/useArtifacts';
import { PortfolioArtifact } from './portfolio-artifact';
import { ADMIN_UUID } from '@/app/lib/constants';

export const PortfolioView: React.FC = () => {
  const { 
    artifacts,
    isLoading,
    error,
  } = useArtifacts();

  if (isLoading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-center py-4 text-red-500">Error: {error.message}</div>;

  // Filter artifacts that have at least one image content
  const portfolioArtifacts = artifacts?.filter(artifact => 
    artifact.contents.some(content => content.type === 'image')
  ) || [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Portfolio</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {portfolioArtifacts.map(artifact => (
          <PortfolioArtifact key={artifact.id} artifact={artifact} />
        ))}
      </div>
    </div>
  );
};