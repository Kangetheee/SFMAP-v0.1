import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.transactions[":id"]["$delete"]>;

export const useDeleteTransaction = (id?: string) => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error>({
        mutationFn: async () => {
            const response = await client.api.transactions[":id"]["$delete"]({ 
                param: { id }, 
            });
            // if (!response.ok) {
            //     throw new Error("Faile:id transactions");
            // }
            return await response.json();
        },
        onSuccess: () => {
            toast.success("Transactions Deleted.");
            queryClient.invalidateQueries({ queryKey: ["transaction", { id }] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["summary"] });
            // TODO: Also invalidate transactions
        },
        onError: (error) => {
            toast.error(`Failed to Deleted account: ${error.message}`);
        },
    });

    return mutation;
};
