import { Suspense } from "react";
import { AddItemForm } from "@/components/space/add-item-form";

export default function AddItemPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <AddItemForm />
    </Suspense>
  );
}