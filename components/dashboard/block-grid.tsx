import React from 'react';
import Link from 'next/link';
import { ArtifactWithRelations } from "@/app/lib/definitions/definitions";
import { ErrorBoundaryWithToast } from '@/components/errors/error-boundary';
import { ArtifactThumbnail } from '@/components/blocks/components/block-thumbnail';

export const ArtifactGrid = ({ blocks }: { blocks: ArtifactWithRelations[] }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
    {blocks.map((block) => (
      <Link href={`/dashboard/blocks/${block.id}`} key={block.id} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg group">
          <ErrorBoundaryWithToast>
            <ArtifactThumbnail
              block={block}
              size={300}
              priority={true}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </ErrorBoundaryWithToast>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-end">
            <h3 className="text-white text-sm font-medium p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {block.name}
            </h3>
          </div>
        </div>
      </Link>
    ))}
  </div>
);