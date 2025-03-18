"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, FileText, AlertCircle } from "lucide-react"
import { formatEther } from "ethers"
import type { Loan } from "@/components/loan-dashboard"
import { DonateDialog } from "@/components/donate-dialog"
import { LoanDetailsDialog } from "@/components/loan-details-dialog"

interface LoanCardProps {
  loan: Loan
}

export function LoanCard({ loan }: LoanCardProps) {
  const [donateDialogOpen, setDonateDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const calculateProgress = () => {
    const collected = BigInt(loan.amountCollected)
    const required = BigInt(loan.amountRequired)
    if (required === BigInt(0)) return 0
    return Number((collected * BigInt(100)) / required)
  }

  const isExpired = loan.deadline * 1000 < Date.now()
  const isFunded = BigInt(loan.amountCollected) >= BigInt(loan.amountRequired)

  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow transition-shadow">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{loan.title}</CardTitle>
          {loan.approved ? (
            <Badge
              variant="outline"
              className="bg-green-50/50 text-green-700 dark:bg-green-900/50 dark:text-green-300 font-normal"
            >
              Approved
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-red-50/50 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-normal"
            >
              Not Approved
            </Badge>
          )}
        </div>
        <CardDescription className="flex items-center gap-1">By {formatAddress(loan.borrower)}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2 px-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">{loan.description}</p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600 dark:text-slate-400">{formatEther(loan.amountCollected)} ETH raised</span>
              <span className="font-medium">{formatEther(loan.amountRequired)} ETH</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(loan.deadline)}</span>
            </div>

            {isExpired && !isFunded && (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>Expired</span>
              </div>
            )}

            {isFunded && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Badge
                  variant="outline"
                  className="bg-green-50/50 text-green-700 dark:bg-green-900/50 dark:text-green-300 font-normal"
                >
                  Funded
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-2 px-4 pb-4">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetailsDialogOpen(true)}>
          <FileText className="h-4 w-4 mr-2" />
          Details
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={!loan.approved || isExpired || isFunded}
          onClick={() => setDonateDialogOpen(true)}
        >
          Donate
        </Button>
      </CardFooter>

      <DonateDialog open={donateDialogOpen} onOpenChange={setDonateDialogOpen} loan={loan} />

      <LoanDetailsDialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen} loan={loan} />
    </Card>
  )
}

