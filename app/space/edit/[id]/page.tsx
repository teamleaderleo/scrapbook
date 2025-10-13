"use client";
import { useParams, useRouter } from "next/navigation";
import { useItems } from "@/app/lib/contexts/item-context";
import { EditItemClient } from "@/components/space/edit-item-client";
import { SpaceHeader } from "@/components/space/space-header";
import { Button } from "@/components/ui/button";
import { use } from "react";

export default function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params); // Unwrapped Promise
  const router = useRouter();
  const { items } = useItems();
  
  // Find item from context - already loaded in layout!
  const item = items.find(it => it.id === id);

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <SpaceHeader leftContent="Item Not Found" />
        <div className="p-6 text-foreground">
          <p>Item not found.</p>
          <Button onClick={() => router.push('/space')} className="mt-4">
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  return <EditItemClient item={item} />;
}