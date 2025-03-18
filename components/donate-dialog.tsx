"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { formatEther, parseEther } from "ethers"
import type { Loan } from "@/components/loan-dashboard"
import { getLoanContract } from "@/lib/contract"

interface DonateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loan: Loan
}

export function DonateDialog({ open, onOpenChange, loan }: DonateDialogProps) {
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const resetForm = () => {
    setAmount("")
    setError("")
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onOpenChange(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate form
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    try {
      setIsSubmitting(true)
      const contract = await getLoanContract()

      if (!contract) {
        setError("Contract not initialized")
        return
      }

      // Convert amount to wei
      const amountInWei = parseEther(amount)

      // Donate to loan
      const tx = await contract.donateToLoan(loan.id, {
        value: amountInWei,
      })

      await tx.wait()

      // Close dialog
      onOpenChange(false)
      resetForm()

      // Refresh page to show updated loan
      window.location.reload()
    } catch (err: any) {
      console.error("Error donating to loan:", err)
      setError(err.message || "Failed to donate to loan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const remainingAmount = () => {
    const collected = BigInt(loan.amountCollected)
    const required = BigInt(loan.amountRequired)
    return formatEther(required - collected)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Donate to Loan</DialogTitle>
          <DialogDescription>
            Support this loan by donating ETH. The borrower will receive funds once the goal is reached.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label htmlFor="title">Loan Title</Label>
              <span className="text-sm text-slate-600 dark:text-slate-400">{loan.title}</span>
            </div>

            <div className="flex justify-between mb-2">
              <Label htmlFor="borrower">Borrower</Label>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {`${loan.borrower.substring(0, 6)}...${loan.borrower.substring(loan.borrower.length - 4)}`}
              </span>
            </div>

            <div className="flex justify-between mb-4">
              <Label htmlFor="remaining">Remaining Amount</Label>
              <span className="text-sm text-slate-600 dark:text-slate-400">{remainingAmount()} ETH</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Donation Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {error && <div className="text-sm text-red-500 dark:text-red-400">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Donate"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

