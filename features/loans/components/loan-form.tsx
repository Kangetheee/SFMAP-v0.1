import { z } from "zod";
import { Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid"; // You'll need to install this package

import { AmountInput } from "@/components/amount-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Select } from "@/components/select";
import { insertLoanSchema } from "@/db/schema";
import { DatePicker } from "@/components/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { convertAmountToMiliunits } from "@/lib/utils";



const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  amountRequired: z.string().min(1, "Amount is required"),
  borrowerId: z.string().min(1, "Borrower is required"),
  deadline: z.coerce.date(),
  documentLink: z.string().min(1, "Document link is required"),
  status: z.enum(["pending", "active", "completed", "expired"]).default("pending"),
  loanId: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type ApiFormValues = z.infer<typeof insertLoanSchema>;

type Props = {
  id?: string;
  defaultValues?: Partial<FormValues>;
  onSubmit: (values: ApiFormValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  borrowerOptions: { label: string; value: string }[];
};

export const LoanForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  borrowerOptions,
}: Props) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      title: "",
      description: "",
      amountRequired: "",
      borrowerId: "",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default: 30 days from now
      documentLink: "",
      status: "pending",
    },
  });

  const handleSubmit = (values: FormValues) => {
    const amount = parseFloat(values.amountRequired);
    // Convert amount to miliunits (amount * 1000)
    const amountInMiliunits = convertAmountToMiliunits(amount);
    
    // Generate a new UUID if no ID is provided
    const loanId = id || uuidv4();
    
    onSubmit({
      id: loanId, // This is now always a string, not undefined
      title: values.title,
      description: values.description,
      amountRequired: amountInMiliunits,
      borrowerId: values.borrowerId,
      deadline: values.deadline,
      documentLink: values.documentLink,
      loanId: values.loanId || 0, // Default to 0 if not provided
      status: values.status,
      amountCollected: 0,
      approved: false,
    });
  };

  const handleDelete = () => {
    onDelete?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
        {/* Title Field */}
        <FormField
          name="title"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={disabled}
                  placeholder="Enter loan title"
                  aria-label="Loan Title"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Borrower Field */}
        <FormField
          name="borrowerId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Borrower</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a Borrower"
                  options={borrowerOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  aria-label="Select Borrower"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Amount Required Field */}
        <FormField
          name="amountRequired"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount Required</FormLabel>
              <FormControl>
                <AmountInput
                  {...field}
                  disabled={disabled}
                  placeholder="0.00"
                  aria-label="Amount Required"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Deadline Field */}
        <FormField
          name="deadline"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deadline</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  aria-label="Loan Deadline"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={disabled}
                  placeholder="Describe the purpose of this loan"
                  aria-label="Loan Description"
                  rows={4}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Document Link Field */}
        <FormField
          name="documentLink"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supporting Document Link</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={disabled}
                  placeholder="https://example.com/document"
                  aria-label="Document Link"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Status Field (if editing) */}
        {id && (
          <FormField
            name="status"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select
                    placeholder="Select Status"
                    options={[
                      { label: "Pending", value: "pending" },
                      { label: "Active", value: "active" },
                      { label: "Completed", value: "completed" },
                      { label: "Expired", value: "expired" },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled}
                    aria-label="Loan Status"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Submit Button */}
        <Button className="w-full" disabled={disabled}>
          {id ? "Save Loan Changes" : "Create Loan Request"}
        </Button>

        {/* Delete Button */}
        {!!id && (
          <Button
            type="button"
            disabled={disabled}
            onClick={handleDelete}
            className="w-full"
            variant="destructive"
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete Loan
          </Button>
        )}
      </form>
    </Form>
  );
};