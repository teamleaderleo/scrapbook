import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      data-skeleton
      className={cn('skeleton-surface rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
