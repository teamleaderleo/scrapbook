import ViewportPageShell from '@/components/viewport-page-shell';

export default function LearningSpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="min-h-[calc(100dvh-3rem)]"
    >
      {children}
    </ViewportPageShell>
  );
}
