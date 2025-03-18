"use client"

import { useState } from "react"
import { useWallet } from "@/context/wallet-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { parseEther } from "@/lib/contract"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
 
// Form validation schema
const formSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: "Amount must be a positive number" }),
  interestRate: z
    .string()
    .min(1, "Interest rate is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: "Interest rate must be a positive number" }),
  repaymentPeriod: z
    .string()
    .min(1, "Repayment period is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: "Repayment period must be a positive number" }),
})

export default function RequestLoan() {
  const { address, contract, connect } = useWallet()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      interestRate: "",
      repaymentPeriod: "",
    },
  })

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!address || !contract) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to request a loan"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Convert values to appropriate formats for the contract
      const amount = parseEther(values.amount)
      const interestRate = BigInt(Math.floor(Number(values.interestRate)))
      const repaymentPeriod = BigInt(Math.floor(Number(values.repaymentPeriod) * 86400)) // Convert days to seconds

      // Call the contract method
      const tx = await contract.requestLoan(amount, interestRate, repaymentPeriod)

      // Wait for transaction to be mined
      toast.success("Transaction Submitted", {
        description: "Your loan request is being processed..."
      })

      toast.success("Loan Requested Successfully", {
        description: "Your loan request has been submitted and is pending approval"
      })
    } catch (error: any) {
      console.error("Error requesting loan:", error)
      toast.error("Transaction Failed", {
        description: error.message || "Failed to request loan"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!address) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl line-clamp-1">Connect Wallet</CardTitle>
            <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
              <Button onClick={connect} size="sm" className="w-full lg:w-auto">
                Connect Wallet
              </Button>
            </div>
            <CardDescription>
              You need to connect your wallet to request a loan
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Request a Loan
          </CardTitle>
          <CardDescription>
            Fill out the form below to request a new loan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Amount (ETH)</FormLabel>
                        <FormControl>
                          <Input placeholder="0.1" {...field} type="number" step="0.01" min="0.01" />
                        </FormControl>
                        <FormDescription>Enter the amount of ETH you wish to borrow</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
                        <FormControl>
                          <Input placeholder="5" {...field} type="number" step="1" min="1" />
                        </FormControl>
                        <FormDescription>Enter the interest rate percentage for the loan</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="repaymentPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repayment Period (Days)</FormLabel>
                        <FormControl>
                          <Input placeholder="30" {...field} type="number" step="1" min="1" />
                        </FormControl>
                        <FormDescription>Enter the number of days for loan repayment</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="sm" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Request Loan"
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="space-y-4">
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Loan Terms</AlertTitle>
                <AlertDescription>
                  All loans must be repaid by the deadline or penalties may be applied. The total repayment amount
                  includes the principal plus interest.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="font-medium">How it works:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Submit your loan request with desired amount and terms</li>
                  <li>Wait for approval from the contract owner</li>
                  <li>Once approved, the loan amount will be transferred to your wallet</li>
                  <li>Repay the loan before the deadline to avoid penalties</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Penalties:</h3>
                <p className="text-sm">
                  Failure to repay by the deadline may result in a 10% penalty added to your total repayment amount.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}