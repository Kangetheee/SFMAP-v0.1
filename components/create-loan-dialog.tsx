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
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { parseEther } from "ethers"
import { getLoanContract } from "@/lib/contract"

interface CreateLoanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoanCreated: () => void
}

export function CreateLoanDialog({ open, onOpenChange, onLoanCreated }: CreateLoanDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [documentLink, setDocumentLink] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setAmount("")
    setDate(undefined)
    setDocumentLink("")
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
    if (!title || !description || !amount || !date || !documentLink) {
      setError("All fields are required")
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

      // Convert date to unix timestamp
      const deadlineTimestamp = Math.floor(date.getTime() / 1000)

      // Create loan
      const tx = await contract.createLoan(title, description, amountInWei, deadlineTimestamp, documentLink)

      await tx.wait()

      // Close dialog and refresh loans
      onOpenChange(false)
      resetForm()
      onLoanCreated()
    } catch (err: any) {
      console.error("Error creating loan:", err)
      setError(err.message || "Failed to create loan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Loan</DialogTitle>
          <DialogDescription>
            Fill out the form below to request a new loan. You must own an NFT from the collection to create a loan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Loan Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your loan"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of your loan"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount Required (ETH)</Label>
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

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">Document Link</Label>
            <Input
              id="document"
              value={documentLink}
              onChange={(e) => setDocumentLink(e.target.value)}
              placeholder="Link to supporting documents (IPFS or other)"
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
                  Creating...
                </>
              ) : (
                "Create Loan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

