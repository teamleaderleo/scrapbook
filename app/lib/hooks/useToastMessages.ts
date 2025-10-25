// import { useToast } from "@/components/ui/use-toast";

// type ToastType = 'success' | 'error';
// type ActionType = 'create' | 'update' | 'delete' | 'updateTags';
// type ItemType = 'block' | 'project' | 'tag';

// export function useToastMessages() {
//   const { toast } = useToast();

//   const showToast = (type: ToastType, action: ActionType, item: ItemType) => {
//     const title = type === 'success' ? 'Success' : 'Error';
//     let description: string;

//     if (action === 'updateTags') {
//       description = type === 'success'
//         ? `${item} tags updated successfully`
//         : `Failed to update ${item} tags`;
//     } else {
//       const actionPast = action === 'create' ? 'created' : action === 'update' ? 'updated' : 'deleted';
//       description = type === 'success'
//         ? `${item} ${actionPast} successfully`
//         : `Failed to ${action} ${item}`;
//     }

//     toast({
//       title,
//       description,
//       variant: type === 'success' ? 'default' : 'destructive',
//     });
//   };

//   return { showToast };
// }