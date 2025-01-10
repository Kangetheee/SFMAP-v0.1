"use client";
import { useNewCategory } from '@/features/categories/hooks/use-new-category';
import { useGetCategories } from '@/features/categories/api/use-get-categories';

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus } from 'lucide-react'
import React from 'react'
import { columns } from './columns';
import { DataTable } from '@/components/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useBulkDeleteCategories } from '@/features/categories/api/use-bulk-delete-categories';

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

const CategoriesPage = () => {

  const newCategory = useNewCategory();
  const categoriesQuery = useGetCategories();
  const deleteCategores = useBulkDeleteCategories();
  const categories = categoriesQuery.data || [];

  const isDisabled =
    categoriesQuery.isLoading ||
    deleteCategores.isPending;

  if(categoriesQuery.isLoading){
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

  return (  
    <div className='max-w-screen-2xl mx-auto w-full pb-10 -mt-24'>
        <Card className='border-none drop-shadow-sm'>
            <CardHeader className='gap-y-2 lg:flex-row lg:items-center lg:justify-between'>
                <CardTitle className='text-xl line-clamp-1'>
                  Categories Page
                </CardTitle>
                <Button onClick={newCategory.onOpen} size="sm">
                  <Plus className='size-4 mr-2'/>
                  Add New
                </Button>
            </CardHeader>
            <CardContent>
              <DataTable 
                  filterKey='name' 
                  columns={columns} 
                  data={categories} 
                  onDelete={(row)=>{
                    const ids = row.map((r)=> r.original.id);
                    deleteCategores.mutate({ ids });
                  }} 
                  disabled={isDisabled} 
                  />
            </CardContent>
        </Card>
    </div>
  )
}

export default CategoriesPage;