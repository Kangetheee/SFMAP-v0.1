"use client";

import { useMountedState } from "react-use";
import { NewAccountSheet } from "@/features/accounts/components/new-account-sheet";
import { EditAccountSheet } from "@/features/accounts/components/edit-account-sheet";
import { useEffect, useState } from "react";

export const SheetProvider = () =>{

    const isMounted = useMountedState();

    if(!isMounted) return null;

    return(
        <>
            <NewAccountSheet />
            <EditAccountSheet />
        </>
    )
}