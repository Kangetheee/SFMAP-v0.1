"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/context/wallet-context"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { type Loan, formatEther, formatDate, getRemainingTime } from "@/lib/contract"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Clock, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function RepayLoanPage() {
  const { address, contract, connect } = useWallet()
  const router = useRouter()
  const searchParams = useSearchParams()
  const loanId = searchParams.get("id")

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loan, setLoan] = useState<Loan | null>(null)
  const [repayAmount, setRepayAmount] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch loan details
  useEffect(() => {
    const fetchLoan = async () => {
      if (!address || !contract || !loanId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const loanData = await contract.loans(loanId)

        // Verify the loan belongs to the connected user
        if (loanData.borrower.toLowerCase() !== address.toLowerCase()) {
          setError("You are not authorized to repay this loan")
          setIsLoading(false)
          return
        }

        const formattedLoan = {
          id: Number(loanData.id),
          borrower: loanData.borrower,
          amount: loanData.amount,
          interestRate: loanData.interestRate,
          repaymentDeadline: loanData.repaymentDeadline,
          totalRepaymentAmount: loanData.totalRepaymentAmount,
          amountRepaid: loanData.amountRepaid,
          isApproved: loanData.isApproved,
          isRepaid: loanData.isRepaid,
        }

        setLoan(formattedLoan)

        // Set default repayment amount to remaining balance
        if (formattedLoan.isApproved && !formattedLoan.isRepaid) {
          const remainingAmount = formattedLoan.totalRepaymentAmount - formattedLoan.amountRepaid
          setRepayAmount(formatEther(remainingAmount))
        }
      } catch (error: any) {
        console.error("Error fetching loan:", error)
        setError("Failed to fetch loan details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLoan()
  }, [address, contract, loanId])

  const handleRepayLoan = async () => {
    if (!loan || !contract || !repayAmount) {
      setError("Invalid loan or repayment amount")
      return
    }

    if (loan.isRepaid) {
      setError("This loan has already been fully repaid")
      return
    }

    if (!loan.isApproved) {
      setError("This loan has not been approved yet")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const remainingAmount = loan.totalRepaymentAmount - loan.amountRepaid
      const amountToSend = ethers.parseEther(repayAmount)

      if (amountToSend < remainingAmount) {
        setError(`You need to repay at least ${formatEther(remainingAmount)} ETH`)
        setIsSubmitting(false)
        return
      }

      const tx = await contract.repayLoan(loan.id, { value: amountToSend })

      toast.success("Transaction Submitted", {
        description: "Your loan repayment is being processed...",
      })

      await tx.wait()

      toast.success("Loan Repaid Successfully", {
        description: "Your loan has been repaid successfully",
      })

      setSuccess(true)

      // Refresh loan data
      const loanData = await contract.loans(loan.id)
      const updatedLoan = {
        id: Number(loanData.id),
        borrower: loanData.borrower,
        amount: loanData.amount,
        interestRate: loanData.interestRate,
        repaymentDeadline: loanData.repaymentDeadline,
        totalRepaymentAmount: loanData.totalRepaymentAmount,
        amountRepaid: loanData.amountRepaid,
        isApproved: loanData.isApproved,
        isRepaid: loanData.isRepaid,
      }

      setLoan(updatedLoan)
    } catch (error: any) {
      console.error("Error repaying loan:", error)
      setError(error.message || "Failed to repay loan")
      toast.error("Transaction Failed", {
        description: error.message || "Failed to repay loan",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRepaymentProgress = (loan: Loan) => {
    if (loan.totalRepaymentAmount === BigInt(0)) return 0
    return Number((loan.amountRepaid * BigInt(100)) / loan.totalRepaymentAmount)
  }

  const isOverdue = loan
    ? Number(loan.repaymentDeadline) < Math.floor(Date.now() / 1000) && !loan.isRepaid && loan.isApproved
    : false

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>You need to connect your wallet to repay a loan</CardDescription>
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!loanId) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Repay Loan</h1>
          <p className="text-muted-foreground">No loan selected for repayment</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Loan Selected</CardTitle>
            <CardDescription>Please select a loan to repay from your loans page</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/my-loans">View My Loans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !loan) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Repay Loan</h1>
          <p className="text-muted-foreground">Error loading loan details</p>
        </div>

        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button asChild variant="outline">
          <Link href="/my-loans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Loans
          </Link>
        </Button>
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Repay Loan</h1>
          <p className="text-muted-foreground">Loan not found</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loan Not Found</CardTitle>
            <CardDescription>The requested loan could not be found</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/my-loans">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My Loans
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repay Loan #{loan.id}</h1>
          <p className="text-muted-foreground">Make a payment towards your loan</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/my-loans">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Loans
          </Link>
        </Button>
      </div>

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Payment Successful</AlertTitle>
          <AlertDescription>
            Your loan payment has been processed successfully.
            {loan.isRepaid && " Your loan has been fully repaid!"}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={isOverdue ? "border-red-500" : ""}>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
            <CardDescription>Information about your loan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Loan Amount</p>
                <p className="font-medium">{formatEther(loan.amount)} ETH</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interest Rate</p>
                <p className="font-medium">{Number(loan.interestRate)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total to Repay</p>
                <p className="font-medium">{formatEther(loan.totalRepaymentAmount)} ETH</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Already Repaid</p>
                <p className="font-medium">{formatEther(loan.amountRepaid)} ETH</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Remaining Amount</p>
              <p className="font-bold">{formatEther(loan.totalRepaymentAmount - loan.amountRepaid)} ETH</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Repayment Deadline</p>
              <p className="font-medium flex items-center gap-1">
                {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
                {formatDate(loan.repaymentDeadline)}
                {!loan.isRepaid && (
                  <span className="ml-2 text-sm">
                    ({isOverdue ? "Overdue" : getRemainingTime(loan.repaymentDeadline)})
                  </span>
                )}
              </p>
            </div>

            {loan.isApproved && !loan.isRepaid && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Repayment Progress</span>
                  <span>{getRepaymentProgress(loan)}%</span>
                </div>
                <Progress value={getRepaymentProgress(loan)} className="h-2" />
              </div>
            )}

            {isOverdue && !loan.isRepaid && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Loan Overdue</AlertTitle>
                <AlertDescription>This loan is past its repayment deadline. Penalties may apply.</AlertDescription>
              </Alert>
            )}

            {loan.isRepaid && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Loan Fully Repaid</AlertTitle>
                <AlertDescription>Congratulations! This loan has been fully repaid.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Make a Payment</CardTitle>
            <CardDescription>Enter the amount you want to repay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!loan.isApproved ? (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>Loan Pending Approval</AlertTitle>
                <AlertDescription>
                  This loan has not been approved yet. You can repay it once it's approved.
                </AlertDescription>
              </Alert>
            ) : loan.isRepaid ? (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>No Payment Needed</AlertTitle>
                <AlertDescription>This loan has been fully repaid. No further payment is required.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repayAmount">Amount to Repay (ETH)</Label>
                  <Input
                    id="repayAmount"
                    type="number"
                    step="0.001"
                    min={formatEther(loan.totalRepaymentAmount - loan.amountRepaid)}
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    disabled={isSubmitting || loan.isRepaid}
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum payment: {formatEther(loan.totalRepaymentAmount - loan.amountRepaid)} ETH
                  </p>
                </div>

                <Button
                  onClick={handleRepayLoan}
                  disabled={isSubmitting || loan.isRepaid || !repayAmount}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Repay Loan"
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  By clicking "Repay Loan", you'll be prompted to confirm the transaction in your wallet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

