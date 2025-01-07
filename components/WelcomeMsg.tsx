"use client"

import { useUser } from '@clerk/nextjs'
import React from 'react'

export const WelcomeMsg = () => {
    const { user, isLoaded } = useUser();

    return (
        <div className='space-y-2 mb-4'>
            <h2 className='text-2xl lg:text-4xl text-white font-bold'>
                Karibu Benki { isLoaded ? "," : ""} {user?.firstName} 🏦 
            </h2>
            <p className='text-sm lg:text-base text-[#c6d8f7] text-semibold'>This is your Financial Overview Report</p>
        </div>
    )
}
