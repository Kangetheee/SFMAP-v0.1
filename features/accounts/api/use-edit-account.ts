import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.accounts[":id"]["$patch"]>;
type RequestType = InferRequestType<typeof client.api.accounts[":id"]["$patch"]>["json"];

export const useEditAccount = (id?: string) => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (json) => {
            const response = await client.api.accounts[":id"]["$patch"]({ 
                param: { id }, 
                json,
            });
            // if (!response.ok) {
            //     throw new Error("Faile:id accounts");
            // }
            return await response.json();
        },
        onSuccess: () => {
            toast.success("Accounts Updated.");
            queryClient.invalidateQueries({ queryKey: ["accounts", { id }] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["summary"] });
            // TODO: Also invalidate summary and transactions
        },
        onError: (error) => {
            toast.error(`Failed to Edit account: ${error.message}`);
        },
    });

    return mutation;
};
