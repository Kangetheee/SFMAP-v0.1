import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.transactions["bulk-delete"]["$post"]>;
type RequestType = InferRequestType<typeof client.api.transactions["bulk-delete"]["$post"]>["json"];

export const useBulkDeleteTransactions = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (json) => {
            const response = await client.api.transactions["bulk-delete"]["$post"]({ json });
            // if (!response.ok) {
            //     throw new Error("Failed to delete transactions");
            // }
            return await response.json();
        },
        onSuccess: () => {
            toast.success("Transactions successfully deleted.");
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["summary"] });
            // TODO: Also invalidate summary or other related queries
        },
        onError: (error) => {
            toast.error(`Failed to delete transactions: ${error.message}`);
        },
    });

    return mutation;
};
