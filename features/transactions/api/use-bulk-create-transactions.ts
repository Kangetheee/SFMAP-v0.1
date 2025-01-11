import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.transactions["bulk-create"]["$post"]>;
type RequestType = InferRequestType<typeof client.api.transactions["bulk-create"]["$post"]>["json"];

export const useBulkCreateTransactions = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async (json) => {
            const response = await client.api.transactions["bulk-create"]["$post"]({ json });
            // if (!response.ok) {
            //     throw new Error("Failed to delete transactions");
            // }
            return await response.json();
        },
        onSuccess: () => {
            toast.success("Transactions successfully created.");
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            // TODO: Also invalidate summary or other related queries
        },
        onError: (error) => {
            toast.error(`Failed to create transactions: ${error.message}`);
        },
    });

    return mutation;
};
