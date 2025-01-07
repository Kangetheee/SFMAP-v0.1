import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.accounts["bulk-delete"]["$post"]>;
type RequestType = InferRequestType<typeof client.api.accounts["bulk-delete"]["$post"]>["json"];

export const useBulkDeleteAccounts = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (json) => {
            const response = await client.api.accounts["bulk-delete"]["$post"]({ json });
            // if (!response.ok) {
            //     throw new Error("Failed to delete accounts");
            // }
            return await response.json();
        },
        onSuccess: () => {
            toast.success("Accounts successfully deleted.");
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            // TODO: Also invalidate summary or other related queries
        },
        onError: (error) => {
            toast.error(`Failed to delete accounts: ${error.message}`);
        },
    });

    return mutation;
};
