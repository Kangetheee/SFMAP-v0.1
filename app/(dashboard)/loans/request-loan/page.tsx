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
      toast.error("Wallet not connected. Please connect your wallet to request a loan.")
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
      toast("Transaction Submitted - Your loan request is being processed...")
      toast("Transaction Submitted - Your loan request is being processed...")
      toast("Loan Requested Successfully - Your loan request has been submitted and is pending approval")

      // Redirect to my loans page
      router.push("/loans/my-loans")
      toast("Loan Requested Successfully. Your loan request has been submitted and is pending approval.")
    } catch (error: any) {
      toast.error(error?.message || "Transaction Failed. Failed to request loan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!address) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>You need to connect your wallet to request a loan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={connect} className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Request a Loan</h1>
        <p className="text-muted-foreground">Fill out the form below to request a new loan</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Loan Request Form</CardTitle>
            <CardDescription>Provide the details for your loan request</CardDescription>
          </CardHeader>
          <CardContent>
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

                <Button type="submit" className="w-full" disabled={isSubmitting}>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loan Information</CardTitle>
            <CardDescription>Important details about requesting a loan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

