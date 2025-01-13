import { z } from "zod";
import { Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { insertTransactionSchema } from "@/db/schema";
import { DatePicker } from "@/components/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { convertAmountToMiliunits } from "@/lib/utils";

const formSchema = z.object({
  date: z.coerce.date(),
  accountId: z.string(),
  categoryId: z.string().optional(),
  payee: z.string(),
  amount: z.string(),
  notes: z.string().optional(),
});

const apiSchema = insertTransactionSchema.omit({
  id: true,
});

type FormValues = z.input<typeof formSchema>;
type ApiFormValues = z.input<typeof apiSchema>;

type Props = {
  id?: string;
  defaultValues?: FormValues;
  onSubmit: (values: ApiFormValues) => void;
  onDelete?: () => void;
  disabled?: boolean;
  accountOptions: { label: string; value: string }[];
  categoryOptions: { label: string; value: string }[];
  onCreateAccount: (name: string) => void;
  onCreateCategory: (name: string) => void;
};

export const TransactionForm = ({
  id,
  defaultValues,
  onSubmit,
  onDelete,
  disabled,
  accountOptions,
  categoryOptions,
  onCreateAccount,
  onCreateCategory,
}: Props) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      date: new Date(),
      accountId: "",
      categoryId: "",
      payee: "",
      amount: "",
      notes: "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    const amount = parseFloat(values.amount);
    const amountInMiliunits = convertAmountToMiliunits(amount)
    // console.log({values})
    onSubmit({
      ...values,
      amount: amountInMiliunits,
    });
  };

  const handleDelete = () => {
    onDelete?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
        {/* Date Field */}
        <FormField
          name="date"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  aria-label="Transaction Date"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Account Field */}
        <FormField
          name="accountId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select an Account"
                  options={accountOptions}
                  onCreate={onCreateAccount}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  aria-label="Select Account"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Category Field */}
        <FormField
          name="categoryId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Select
                  placeholder="Select a Category"
                  options={categoryOptions}
                  onCreate={onCreateCategory}
                  value={field.value || ""}
                  onChange={field.onChange}
                  disabled={disabled}
                  aria-label="Select Category"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Payee Field */}
        <FormField
          name="payee"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payee</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={disabled}
                  placeholder="Add Payee"
                  aria-label="Transaction Payee"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Amount Field */}
        <FormField
          name="amount"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <AmountInput
                  {...field}
                  disabled={disabled}
                  placeholder="0.00"
                  aria-label="Transaction Amount"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Notes Field */}
        <FormField
          name="notes"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  disabled={disabled}
                  placeholder="Optional transaction notes"
                  aria-label="Transaction Notes"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button className="w-full" disabled={disabled}>
          {id ? "Save Changes" : "Create Transaction"}
        </Button>

        {/* Delete Button */}
        {!!id && (
          <Button
            type="button"
            disabled={disabled}
            onClick={handleDelete}
            className="w-full"
            size="icon"
            variant="outline"
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete Transaction
          </Button>
        )}
      </form>
    </Form>
  );
};
