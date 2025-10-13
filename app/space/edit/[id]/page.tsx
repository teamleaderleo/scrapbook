import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { EditItemClient } from "@/components/space/edit-item-client";

export const dynamic = 'force-dynamic';

async function getItem(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data;
}

export default async function EditItemPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await getItem(params.id);
  
  if (!item) {
    notFound(); // Shows 404 page
  }
  
  return <EditItemClient item={item} />;
}