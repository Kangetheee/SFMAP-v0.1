import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.accounts[":id"]["$delete"]>;

export const useDeleteAccount = (id?: string) => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error>({
        mutationFn: async () => {
            const response = await client.api.accounts[":id"]["$delete"]({ 
                param: { id }, 
            });
            // if (!response.ok) {
            //     throw new Error("Faile:id accounts");
            // }
            return await response.json();
        },
        onSuccess: () => {
            toast.success("Accounts Deleted.");
            queryClient.invalidateQueries({ queryKey: ["accounts", { id }] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            // TODO: Also invalidate summary and transactions
        },
        onError: (error) => {
            toast.error(`Failed to Deleted account: ${error.message}`);
        },
    });

    return mutation;
};
