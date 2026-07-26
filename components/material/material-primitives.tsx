import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type MaterialRole =
  | 'steel'
  | 'phenolic'
  | 'glass'
  | 'slate'
  | 'paper'
  | 'tape';

type MaterialElement = 'div' | 'section' | 'aside' | 'header' | 'span';

type MaterialSurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: MaterialElement;
  material: MaterialRole;
  children?: ReactNode;
};

export function MaterialSurface({
  as: Component = 'div',
  material,
  className,
  children,
  ...props
}: MaterialSurfaceProps) {
  return (
    <Component
      data-material={material}
      className={cn('material-surface', `material-${material}`, className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function InsetSeam({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('material-inset-seam', className)} />;
}

export function HardwareScrew({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('material-screw', className)} />;
}

export function GlassLens({ className }: { className?: string }) {
  return <i aria-hidden="true" className={cn('material-glass-lens', className)} />;
}

export function EngravedLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn('material-label-engraved', className)}>{children}</span>;
}

export function StampedLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn('material-label-stamped', className)}>{children}</span>;
}

export function PaperEdge({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('material-paper-edge', className)} />;
}

export function TapeStrip({
  className,
  side = 'top',
}: {
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  return (
    <span
      aria-hidden="true"
      data-side={side}
      className={cn('material-tape-strip', className)}
    />
  );
}
