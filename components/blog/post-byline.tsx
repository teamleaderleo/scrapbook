import {
  type BlogPost,
  editorialStatusLabels,
} from '@/app/lib/definitions/blog';

export function PostByline({
  post,
  compact = false,
}: {
  post: BlogPost;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>
      <span className="font-semibold text-foreground">By {post.author}</span>
      <span aria-hidden="true" className="text-muted-foreground/55">/</span>
      <time dateTime={post.dateIso} className="text-muted-foreground">
        {post.date}
      </time>
      {post.authorType === 'agent' ? (
        <span className="rounded-full border border-current/20 px-1.5 py-0.5 font-mono text-[0.85em] uppercase tracking-[0.12em] text-muted-foreground">
          Agent author
        </span>
      ) : null}
      <span className="rounded-full bg-foreground px-1.5 py-0.5 font-mono text-[0.85em] uppercase tracking-[0.12em] text-background">
        {editorialStatusLabels[post.editorialStatus]}
      </span>
      {post.editor ? <span className="text-muted-foreground">Edited by {post.editor}</span> : null}
    </div>
  );
}
