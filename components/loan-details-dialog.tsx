"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, FileText, ExternalLink, User } from "lucide-react"
import { formatEther } from "ethers"
import type { Loan } from "@/components/loan-dashboard"
import { getLoanContract } from "@/lib/contract"

interface LoanDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loan: Loan
}

interface Lender {
  address: string
  amount: string
}

export function LoanDetailsDialog({ open, onOpenChange, loan }: LoanDetailsDialogProps) {
  const [lenders, setLenders] = useState<Lender[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchLenders()
    }
  }, [open, loan.id])

  const fetchLenders = async () => {
    try {
      setIsLoading(true)
      const contract = await getLoanContract()

      if (!contract) {
        console.error("Contract not initialized")
        return
      }

      const [addresses, amounts] = await contract.getLenders(loan.id)

      const lendersData: Lender[] = addresses.map((address: string, index: number) => ({
        address,
        amount: formatEther(amounts[index]),
      }))

      setLenders(lendersData)
    } catch (error) {
      console.error("Error fetching lenders:", error)
    } finally {
      setIsLoading(false)
    }
  }

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{loan.title}</span>
            {loan.approved ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                Approved
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300">
                Not Approved
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{loan.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Loan Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <User className="h-4 w-4" />
                <span>Borrower: {formatAddress(loan.borrower)}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                <span>Deadline: {formatDate(loan.deadline)}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <FileText className="h-4 w-4" />
                <a
                  href={loan.documentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:underline"
                >
                  Documents <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>

              {isExpired && !isFunded && (
                <div className="text-amber-600 dark:text-amber-400 text-sm">Status: Expired</div>
              )}

              {isFunded && <div className="text-green-600 dark:text-green-400 text-sm">Status: Funded</div>}

              {!isExpired && !isFunded && (
                <div className="text-blue-600 dark:text-blue-400 text-sm">Status: Active</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Funding Progress</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {formatEther(loan.amountCollected)} ETH raised
                </span>
                <span className="font-medium">{formatEther(loan.amountRequired)} ETH goal</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Lenders</h3>
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">Loading lenders...</p>
              </div>
            ) : lenders.length === 0 ? (
              <div className="text-center py-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">No lenders yet</p>
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {lenders.map((lender, index) => (
                  <div key={index} className="flex justify-between items-center p-3">
                    <span className="text-sm">{formatAddress(lender.address)}</span>
                    <span className="text-sm font-medium">{lender.amount} ETH</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

