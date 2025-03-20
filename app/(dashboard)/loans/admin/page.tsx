"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/context/wallet-context"
// Update the import for useToast to match your project's structure
// Change from:
// To:
import { toast } from "sonner"
import { type Loan, formatEther, formatDate } from "@/lib/contract"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminPage() {
  const { address, contract, isOwner, connect } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [loans, setLoans] = useState<Loan[]>([])
  const [processingLoanId, setProcessingLoanId] = useState<number | null>(null)
  const [contractError, setContractError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllLoans = async () => {
      if (!address || !isOwner) return

      if (!contract) {
        setContractError("Contract not available. Please check your connection and contract address.")
        return
      }

      setIsLoading(true)
      try {
        // Get total number of loans
        const loanCounter = await contract.loanCounter()

        // Fetch all loans
        const loanPromises = []
        for (let i = 1; i < Number(loanCounter); i++) {
          loanPromises.push(contract.loans(i))
        }

        const loanResults = await Promise.all(loanPromises)

        const formattedLoans = loanResults.map((loanData) => ({
          id: Number(loanData.id),
          borrower: loanData.borrower,
          amount: loanData.amount,
          interestRate: loanData.interestRate,
          repaymentDeadline: loanData.repaymentDeadline,
          totalRepaymentAmount: loanData.totalRepaymentAmount,
          amountRepaid: loanData.amountRepaid,
          isApproved: loanData.isApproved,
          isRepaid: loanData.isRepaid,
        }))

        setLoans(formattedLoans)
        setContractError(null)
      } catch (error: any) {
        console.error("Error fetching loans:", error)
        setContractError(error.message || "Failed to fetch loans from contract")
        toast.error("Failed to fetch loans")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllLoans()
  }, [address, contract, isOwner])

  const handleApproveLoan = async (loanId: number) => {
    if (!contract) return

    setProcessingLoanId(loanId)
    try {
      const tx = await contract.approveLoan(loanId)

      toast.success("Loan approval is being processed...")

      await tx.wait()

      toast.success(`Loan #${loanId} has been approved successfully`)

      // Update loan in state
      setLoans(loans.map((loan) => (loan.id === loanId ? { ...loan, isApproved: true } : loan)))
    } catch (error: any) {
      console.error("Error approving loan:", error)
      toast.error(error.message || "Failed to approve loan")
    } finally {
      setProcessingLoanId(null)
    }
  }

  const handleApplyPenalty = async (loanId: number) => {
    if (!contract) return

    setProcessingLoanId(loanId)
    try {
      const tx = await contract.applyPenalty(loanId)

      toast.success("Penalty application is being processed...")

      await tx.wait()

      toast.success(`Penalty has been applied to Loan #${loanId}`)

      // Refresh loan data
      const loanData = await contract.loans(loanId)
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

      setLoans(loans.map((loan) => (loan.id === loanId ? updatedLoan : loan)))
    } catch (error: any) {
      console.error("Error applying penalty:", error)
      toast.error(error.message || "Failed to apply penalty")
    } finally {
      setProcessingLoanId(null)
    }
  }

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>You need to connect your wallet to access the admin panel</CardDescription>
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

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only the contract owner can access the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Unauthorized</AlertTitle>
              <AlertDescription>Your wallet address does not have admin privileges</AlertDescription>
            </Alert>
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Manage loan approvals and penalties</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="active">Active Loans</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Loans</TabsTrigger>
          <TabsTrigger value="all">All Loans</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loans.filter((loan) => !loan.isApproved).length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Pending Loans</CardTitle>
                <CardDescription>There are no loans waiting for approval</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            loans
              .filter((loan) => !loan.isApproved)
              .map((loan) => (
                <AdminLoanCard
                  key={loan.id}
                  loan={loan}
                  onApprove={handleApproveLoan}
                  onPenalty={handleApplyPenalty}
                  isProcessing={processingLoanId === loan.id}
                />
              ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {loans.filter((loan) => loan.isApproved && !loan.isRepaid).length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Active Loans</CardTitle>
                <CardDescription>There are no active loans at the moment</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            loans
              .filter((loan) => loan.isApproved && !loan.isRepaid)
              .map((loan) => (
                <AdminLoanCard
                  key={loan.id}
                  loan={loan}
                  onApprove={handleApproveLoan}
                  onPenalty={handleApplyPenalty}
                  isProcessing={processingLoanId === loan.id}
                />
              ))
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {loans.filter((loan) => {
            const now = Math.floor(Date.now() / 1000)
            return loan.isApproved && !loan.isRepaid && Number(loan.repaymentDeadline) < now
          }).length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Overdue Loans</CardTitle>
                <CardDescription>There are no overdue loans at the moment</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            loans
              .filter((loan) => {
                const now = Math.floor(Date.now() / 1000)
                return loan.isApproved && !loan.isRepaid && Number(loan.repaymentDeadline) < now
              })
              .map((loan) => (
                <AdminLoanCard
                  key={loan.id}
                  loan={loan}
                  onApprove={handleApproveLoan}
                  onPenalty={handleApplyPenalty}
                  isProcessing={processingLoanId === loan.id}
                />
              ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {loans.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Loans</CardTitle>
                <CardDescription>There are no loans in the system</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            loans.map((loan) => (
              <AdminLoanCard
                key={loan.id}
                loan={loan}
                onApprove={handleApproveLoan}
                onPenalty={handleApplyPenalty}
                isProcessing={processingLoanId === loan.id}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Admin Loan Card Component
function AdminLoanCard({
  loan,
  onApprove,
  onPenalty,
  isProcessing,
}: {
  loan: Loan
  onApprove: (loanId: number) => void
  onPenalty: (loanId: number) => void
  isProcessing: boolean
}) {
  const now = Math.floor(Date.now() / 1000)
  const isOverdue = Number(loan.repaymentDeadline) < now && !loan.isRepaid && loan.isApproved

  return (
    <Card className={isOverdue ? "border-red-500" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Loan #{loan.id}</CardTitle>
            <CardDescription>
              Borrower: {loan.borrower.substring(0, 6)}...{loan.borrower.substring(loan.borrower.length - 4)}
            </CardDescription>
          </div>
          <Badge variant={loan.isApproved ? (loan.isRepaid ? "outline" : "default") : "secondary"}>
            {loan.isRepaid ? "Repaid" : loan.isApproved ? "Approved" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-medium">{formatEther(loan.amount)} ETH</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Interest</p>
            <p className="font-medium">{Number(loan.interestRate)}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total to Repay</p>
            <p className="font-medium">{formatEther(loan.totalRepaymentAmount)} ETH</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Deadline</p>
            <p className="font-medium flex items-center gap-1">
              {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
              {formatDate(loan.repaymentDeadline)}
            </p>
          </div>
        </div>

        {loan.isApproved && !loan.isRepaid && (
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Repaid Amount</p>
              <p className="font-medium">{formatEther(loan.amountRepaid)} ETH</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="font-medium">{formatEther(loan.totalRepaymentAmount - loan.amountRepaid)} ETH</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!loan.isApproved ? (
          <Button onClick={() => onApprove(loan.id)} disabled={isProcessing} className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Approve Loan"
            )}
          </Button>
        ) : loan.isRepaid ? (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <span>Fully Repaid</span>
          </div>
        ) : isOverdue ? (
          <Button onClick={() => onPenalty(loan.id)} disabled={isProcessing} variant="destructive" className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Apply Penalty"
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Waiting for repayment</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

