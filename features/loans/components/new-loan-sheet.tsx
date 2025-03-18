import { useNewLoan } from "../hooks/use-new-loans";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
  } from "@/components/ui/sheet";
import { LoanForm } from "./loan-form";
import { insertLoanSchema } from "@/db/schema";
import { z } from "zod";
import { useCreateLoan } from "../api/use-create-loan";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useCreateAccount } from "@/features/accounts/api/use-create-account";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useCreateCategory } from "@/features/categories/api/use-create-category";
import { Loader } from "lucide-react";

const formSchema = insertLoanSchema.omit({
    id: true,
});

type FormValues = z.input<typeof formSchema>;

export const NewTransactionSheet = () =>{

    const { isOpen, onClose } = useNewLoan();

    const createMutation = useCreateLoan();

    // handle category of transaction
    const categoryQuery = useGetCategories();
    const categoryMutation = useCreateCategory();
    const onCreateCategory = ( name:string ) => categoryMutation.mutate({
        name
    });
    const categoryOptions = ( categoryQuery.data ?? []).map((category) => ({
        label: category.name,
        value: category.id
    }));

     // handle account for transaction
     const accountsQuery = useGetAccounts();
     const accountMutation = useCreateAccount();
     const onCreateAccount = ( name:string ) => accountMutation.mutate({
         name
     });
     const accountOptions = ( accountsQuery.data ?? []).map((account) => ({
         label: account.name,
         value: account.id
     }));

     const isPending =
        createMutation.isPending ||
        categoryMutation.isPending ||
        accountMutation.isPending;

    const isLoading = 
        categoryQuery.isLoading ||
        accountsQuery.isLoading;

    const onSubmit = (values:FormValues) =>{
        createMutation.mutate(values, {
            onSuccess: () =>{
                onClose();
            },
        });
    }


    return(
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="space-y-4">
                <SheetHeader>
                    <SheetTitle>
                        New Transaction
                    </SheetTitle>
                    <SheetDescription>
                        Log your transactions.
                    </SheetDescription>
                </SheetHeader>
                {isLoading
                    ?(
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader className="size-4 text-muted-foreground animate-spin" />
                        </div>
                    ) : (

                        <LoanForm
                            onSubmit={onSubmit}
                            disabled={isPending}
                            categoryOptions={categoryOptions}
                            onCreateCategory={onCreateCategory}
                            accountOptions = {accountOptions}
                            onCreateAccount = {onCreateAccount}
                        />

                    )
                    }
                
            </SheetContent>
        </Sheet>
    )
}