'use client';

import React from 'react';
import { useArtifacts } from '@/app/lib/hooks/useArtifacts';
import { PortfolioArtifact } from '../artifacts/displays/portfolio-artifact';
import { ADMIN_UUID } from '@/app/lib/constants';

export const PortfolioView: React.FC = () => {
  const { 
    artifacts,
    isLoading,
    error,
  } = useArtifacts();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Filter artifacts that have at least one image content
  const artArtifacts = artifacts?.filter(artifact => 
    artifact.contents.some(content => content.type === 'image')
  ) || [];

  return (
    <div className="art-portfolio-view">
      <h1>Art Portfolio</h1>
      <div className="artifact-grid">
        {artArtifacts.map(artifact => (
          <PortfolioArtifact key={artifact.id} artifact={artifact} />
        ))}
      </div>
    </div>
  );
};