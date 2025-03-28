"use client";

import { useState, useEffect } from 'react';
import { useGetSummary } from "@/features/summary/api/use-get-summary";
import { Chart, ChartLoading } from "./chart";
import { SpendingCardLoading, SpendingPie } from "./spending-pie";
import axios from 'axios';
import { useAuth } from "@clerk/nextjs";  // Assume you are using Clerk for authentication

export const DataChart = () => {
    const { data, isLoading } = useGetSummary();
    const { userId } = useAuth();  // Get userId from authentication context

    // useEffect(() => {
    //     const fetchCreditScore = async () => {
    //         if (userId) {
    //             try {
    //                 const response = await axios.get(`/api/credit-score?userId=${userId}`);
    //                 setCreditScore(response.data.creditScore);
    //             } catch (error) {
    //                 console.error('Failed to fetch credit score', error);
    //             }
    //         }
    //     };

    //     fetchCreditScore();
    // }, [userId]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                <div className="col-span-1 lg:col-span-3 xl:col-span-4">
                    <ChartLoading />
                </div>
                <div className="col-span-1 lg:col-span-3 xl:col-span-2">
                    <SpendingCardLoading />
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
            <div className="col-span-1 lg:grid-cols-3 xl:col-span-4">
                <Chart data={data?.days} />
            </div>
            <div className="col-span-1 lg:grid-cols-2 xl:col-span-2 space-y-6">
                {/* Spending Pie Chart */}
                <SpendingPie data={data?.categories} />

<<<<<<< HEAD
                {/* Credit Score Progress Bar
                <div className="bg-white shadow-md rounded-lg p-4">
=======
                {/* Credit Score Progress Bar */}
                {/* <div className="bg-white shadow-md rounded-lg p-4">
>>>>>>> 96fcce8914b5c267ae71ff1f62cb3deea8b11efb
                    <h3 className="text-lg font-semibold mb-2">Credit Score</h3>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                            className="bg-blue-500 h-4 rounded-full"
                            style={{ width: `${creditScore || 0}%` }}
                        ></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Your current credit score is <span className="font-bold">{creditScore || 0}</span>.
                    </p>
                </div> */}
            </div>
        </div>
    );
};