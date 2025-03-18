"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/context/wallet-context"
import { toast } from "sonner"
import { type Loan, formatEther, formatDate } from "@/lib/contract"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, AlertCircle, CheckCircle2, ShieldAlert, Filter } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminLoanCard } from "./admin-loan-card"

export default function AdminPage() {
  const { address, contract, isOwner, connect } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [loans, setLoans] = useState<Loan[]>([])
  const [processingLoanId, setProcessingLoanId] = useState<number | null>(null)
  const [contractError, setContractError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    fetchAllLoans()
  }, [address, contract, isOwner])

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

  // Helper function to get filtered loans based on active tab
  const getFilteredLoans = () => {
    const now = Math.floor(Date.now() / 1000)
    
    switch(activeTab) {
      case "pending":
        return loans.filter(loan => !loan.isApproved)
      case "active":
        return loans.filter(loan => loan.isApproved && !loan.isRepaid)
      case "overdue":
        return loans.filter(loan => loan.isApproved && !loan.isRepaid && Number(loan.repaymentDeadline) < now)
      case "all":
      default:
        return loans
    }
  }

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">You need to connect your wallet to access the admin panel</p>
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
      <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full flex items-center justify-center">
              <Loader2 className="size-6 text-slate-300 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">Admin Panel</CardTitle>
          <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
            <TabsList className="mb-0">
              <TabsTrigger 
                value="pending" 
                onClick={() => setActiveTab("pending")}
                className={activeTab === "pending" ? "bg-primary text-primary-foreground" : ""}
              >
                Pending
              </TabsTrigger>
              <TabsTrigger 
                value="active" 
                onClick={() => setActiveTab("active")}
                className={activeTab === "active" ? "bg-primary text-primary-foreground" : ""}
              >
                Active
              </TabsTrigger>
              <TabsTrigger 
                value="overdue" 
                onClick={() => setActiveTab("overdue")}
                className={activeTab === "overdue" ? "bg-primary text-primary-foreground" : ""}
              >
                Overdue
              </TabsTrigger>
              <TabsTrigger 
                value="all" 
                onClick={() => setActiveTab("all")}
                className={activeTab === "all" ? "bg-primary text-primary-foreground" : ""}
              >
                All
              </TabsTrigger>
            </TabsList>
            <Button size="sm" onClick={fetchAllLoans}>
              <Filter className="size-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contractError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{contractError}</AlertDescription>
            </Alert>
          )}
          
          {getFilteredLoans().length === 0 ? (
            <div className="bg-muted/30 rounded-lg flex flex-col items-center justify-center p-10">
              <p className="text-muted-foreground">No loans found for the selected filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredLoans().map((loan) => (
                <AdminLoanCard
                  key={loan.id}
                  loan={loan}
                  onApprove={handleApproveLoan}
                  onPenalty={handleApplyPenalty}
                  isProcessing={processingLoanId === loan.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}