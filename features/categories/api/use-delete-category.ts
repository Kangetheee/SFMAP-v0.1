import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.categories[":id"]["$delete"]>;

export const useDeleteCategory = (id?: string) => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error>({
        mutationFn: async () => {
            const response = await client.api.categories[":id"]["$delete"]({ 
                param: { id }, 
            });
            // if (!response.ok) {
            //     throw new Error("Faile:id categories");
            // }
            return await response.json();
        },
        onSuccess: () => {
            toast.success("Categories Deleted.");
            queryClient.invalidateQueries({ queryKey: ["category", { id }] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            // TODO: Also invalidate summary and transactions
        },
        onError: (error) => {
            toast.error(`Failed to Deleted Categories: ${error.message}`);
        },
    });

    return mutation;
};
