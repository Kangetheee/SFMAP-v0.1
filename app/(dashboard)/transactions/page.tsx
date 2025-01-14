"use client";
import { useNewTransaction } from '@/features/transactions/hooks/use-new-transactions'
import { useGetTransactions } from '@/features/transactions/api/use-get-transactions';
import { transactions as transactionSchema } from '@/db/schema';

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus } from 'lucide-react'
import React, { useState } from 'react'
import { columns } from './columns';
import { DataTable } from '@/components/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useBulkDeleteTransactions } from '@/features/transactions/api/use-bulk-delete-transactions';
import { UploadButton } from './upload-button';
import { ImportCard } from './import-card';

// const data = [
//   {
//     id: "728ed52f",
//     amount: 100,
//     status: "pending",
//     email: "m@example.com",
//   },
//   {
//     id: "728ed52f",
//     amount: 50,
//     status: "success",
//     email: "m2@example.com",
//   },
// ];

enum VARIANTS {
  LIST="LIST",
  IMPORT="IMPORT"
};

const INTIAL_IMPORT_RESULTS = {
  data: [],
  errors: [],
  meta: {},
}

const TransactionsPage = () => {

  const [variant, setVariant] = useState<VARIANTS>(VARIANTS.LIST);
  const [importResults, setImportResults] = useState(INTIAL_IMPORT_RESULTS);

  const onUpload = (  results: typeof INTIAL_IMPORT_RESULTS) => {
    console.log({ results })
    setImportResults(results);
    setVariant(VARIANTS.IMPORT);
  };

  const onCancelImport = () => {
    setImportResults(INTIAL_IMPORT_RESULTS);
    setVariant(VARIANTS.LIST)
  }

  const newTransaction = useNewTransaction();
  const transactionsQuery = useGetTransactions();
  const deleteTransactions = useBulkDeleteTransactions();
  const transactions = transactionsQuery.data || [];

  const isDisabled =
    transactionsQuery.isLoading ||
    deleteTransactions.isPending;

  const onSubmitImport = async (
    values: typeof transactionSchema.$inferInsert[],
  ) => {
    
  };

  if(transactionsQuery.isLoading){
    return(
      <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
          <Card className='border-none drop-shadow-sm'>
            <CardHeader>
              <Skeleton className='h-8 w-48'/>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full flex items-center justify-center">
                <Loader2 className='size-6 text-slate-300 animate-spin'/>
              </div>
            </CardContent>
          </Card>
      </div>
    );
  }

  if ( variant === VARIANTS.IMPORT) {
    return(
      <>
        <ImportCard
          data={importResults.data}
          onCancel={onCancelImport}
          onSubmit={onSubmitImport} 
        />
      </>
    )
  }

  return (  
    <div className='max-w-screen-2xl mx-auto w-full pb-10 -mt-24'>
        <Card className='border-none drop-shadow-sm'>
            <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
                <CardTitle className='text-xl line-clamp-1'>
                  Transaction History
                </CardTitle>
                <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
                  <Button onClick={newTransaction.onOpen} size="sm" className='w-full lg:w-auto'>
                    <Plus className='size-4 mr-2'/>
                    Add New
                  </Button>
                  <UploadButton
                    onUpload={onUpload} 
                  />
                </div>
            </CardHeader>
            <CardContent>
              <DataTable 
                  filterKey='payee' 
                  columns={columns} 
                  data={transactions} 
                  onDelete={(row)=>{
                    const ids = row.map((r)=> r.original.id);
                    deleteTransactions.mutate({ ids });
                  }} 
                  disabled={isDisabled} 
                  />
            </CardContent>
        </Card>
    </div>
  )
}

export default TransactionsPage