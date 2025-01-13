import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.categories[":id"]["$patch"]>;
type RequestType = InferRequestType<typeof client.api.categories[":id"]["$patch"]>["json"];

export const useEditCategory = (id?: string) => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (json) => {
            const response = await client.api.categories[":id"]["$patch"]({ 
                param: { id }, 
                json,
            });
            // if (!response.ok) {
            //     throw new Error("Faile:id categories");
            // }
            return await response.json();
        },
        onSuccess: () => {
            toast.success("Category Updated.");
            queryClient.invalidateQueries({ queryKey: ["category", { id }] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            // TODO: Also invalidate summary and transactions
        },
        onError: (error) => {
            toast.error(`Failed to Edit Category: ${error.message}`);
        },
    });

    return mutation;
};
