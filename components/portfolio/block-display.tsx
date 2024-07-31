import { Artifact, ArtifactContent } from "@/app/lib/definitions/definitions";

export const ArtifactDisplay = ({ block }: { block: Artifact }) => {
  return (
    <div className="block">
      {block.name && <h3>{block.name}</h3>}
      {block.description && <p>{block.description}</p>}
      {block.contents.map((content) => (
        <ContentDisplay key={content.id} content={content} />
      ))}
    </div>
  );
};

export const ContentDisplay = ({ content }: { content: ArtifactContent }) => {
  switch (content.type) {
    case 'text':
      return <TextContent content={content} />;
    case 'image':
      return <ImageContent content={content} />;
    case 'file':
      return <FileContent content={content} />;
    case 'link':
      return <LinkContent content={content} />;
    default:
      return null;
  }
};

export const TextContent = ({ content }: { content: ArtifactContent }) => (
  <p>{content.content}</p>
);

import Image from 'next/image';

export const ImageContent = ({ content }: { content: ArtifactContent }) => (
  <Image src={content.content} alt={content.metadata ? content.metadata.toString() : 'Image'} width={500} height={500} />
);

// Implement other content type components...
// (I just made a few of them up to temporarily get rid of red lines)
export const FileContent = ({ content }: { content: ArtifactContent }) => (
  <p>
    <a href={content.content}></a>
  </p>
);

export const LinkContent = ({ content }: { content: ArtifactContent }) => (
  <p>
    <a href={content.content}></a>
  </p>
);

export const EmbedContent = ({ content }: { content: ArtifactContent }) => (
  <p>
    <a href={content.content}></a>
  </p>
);