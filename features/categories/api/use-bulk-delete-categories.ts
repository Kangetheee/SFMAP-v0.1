import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.categories["bulk-delete"]["$post"]>;
type RequestType = InferRequestType<typeof client.api.categories["bulk-delete"]["$post"]>["json"];

export const useBulkDeleteCategories = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (json) => {
            const response = await client.api.categories["bulk-delete"]["$post"]({ json });
            // if (!response.ok) {
            //     throw new Error("Failed to delete categories");
            // }
            return await response.json();
        },
        onSuccess: () => {
            toast.success("Categories successfully deleted.");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            // TODO: Also invalidate summary or other related queries
        },
        onError: (error) => {
            toast.error(`Failed to delete Categories: ${error.message}`);
        },
    });

    return mutation;
};
