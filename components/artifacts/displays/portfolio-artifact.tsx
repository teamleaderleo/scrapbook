import React from 'react';
import { ArtifactWithRelations } from "@/app/lib/definitions";
import { ImageContent, ContentDisplay } from "./artifact-display";

export const PortfolioArtifact: React.FC<{ artifact: ArtifactWithRelations }> = ({ artifact }) => {
  const mainImage = artifact.contents.find(c => c.type === 'image');
  const otherContents = artifact.contents.filter(c => c !== mainImage);

  return (
    <div className="portfolio-artifact">
      {mainImage && (
        <div className="main-image">
          <ImageContent content={mainImage} />
        </div>
      )}
      <h3 className="artifact-title">{artifact.name}</h3>
      {artifact.description && <p className="artifact-description">{artifact.description}</p>}
      {otherContents.length > 0 && (
        <details className="additional-details">
          <summary>Additional Details</summary>
          <div className="other-contents">
            {otherContents.map(content => (
              <ContentDisplay key={content.id} content={content} />
            ))}
          </div>
        </details>
      )}
      {artifact.tags && artifact.tags.length > 0 && (
        <div className="artifact-tags">
          {artifact.tags.map(tag => (
            <span key={tag.id} className="tag">{tag.name}</span>
          ))}
        </div>
      )}
    </div>
  );
};