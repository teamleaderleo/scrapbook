import { ArtifactWithRelations } from "@/app/lib/definitions";
import { ImageContent, ContentDisplay } from "./artifact-display";

export const PortfolioArtifact = ({ artifact }: { artifact: ArtifactWithRelations }) => {
  const mainImage = artifact.contents.find(c => c.type === 'image');
  const otherContents = artifact.contents.filter(c => c !== mainImage);

  return (
    <div className="portfolio-artifact">
      {mainImage && <ImageContent content={mainImage} />}
      <h3>{artifact.name}</h3>
      {artifact.description && <p>{artifact.description}</p>}
      {otherContents.length > 0 && (
        <details>
          <summary>Additional Details</summary>
          {otherContents.map(content => (
            <ContentDisplay key={content.id} content={content} />
          ))}
        </details>
      )}
    </div>
  );
};