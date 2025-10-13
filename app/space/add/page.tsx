import { AddItemForm } from "@/components/space/add-item-form";

export const dynamic = 'force-dynamic';

export default function AddItemPage() {
  return (
    <div className="min-h-screen bg-background">
      <AddItemForm />
    </div>
  );
}