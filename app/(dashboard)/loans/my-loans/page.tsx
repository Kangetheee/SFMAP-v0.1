"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/context/wallet-context"
import { toast } from "sonner"
import { type Loan, formatEther, formatDate, getRemainingTime } from "@/lib/contract"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function MyLoans() {
  const { address, contract, connect } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [loans, setLoans] = useState<Loan[]>([])

  useEffect(() => {
    const fetchLoans = async () => {
      if (!address || !contract) return

      setIsLoading(true)
      try {
        // Get all loans for the current user
        const loanIds = await contract.getBorrowerLoans(address)
        const loanPromises = loanIds.map(async (id: bigint) => {
          const loanData = await contract.loans(id)
          return {
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
        })

        const fetchedLoans = await Promise.all(loanPromises)
        setLoans(fetchedLoans)
      } catch (error) {
        console.error("Error fetching loans:", error)
        toast.error("Failed to fetch your loans", {
          description: "An error occurred while retrieving your loan information"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchLoans()
  }, [address, contract])

  const getLoanStatus = (loan: Loan) => {
    if (loan.isRepaid) return "Repaid"
    if (!loan.isApproved) return "Pending"

    const now = Math.floor(Date.now() / 1000)
    if (Number(loan.repaymentDeadline) < now) return "Overdue"
    return "Active"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Repaid":
        return <Badge className="bg-green-500">Repaid</Badge>
      case "Pending":
        return <Badge variant="outline">Pending</Badge>
      case "Overdue":
        return <Badge variant="destructive">Overdue</Badge>
      case "Active":
        return <Badge className="bg-blue-500">Active</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRepaymentProgress = (loan: Loan) => {
    if (loan.totalRepaymentAmount === BigInt(0)) return 0
    return Number((loan.amountRepaid * BigInt(100)) / loan.totalRepaymentAmount)
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
              You need to connect your wallet to view your loans
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl line-clamp-1">My Loans</CardTitle>
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
          <CardTitle className="text-xl line-clamp-1">My Loans</CardTitle>
          <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
            <Button asChild size="sm" className="w-full lg:w-auto">
              <Link href="/request-loan">Request New Loan</Link>
            </Button>
          </div>
          <CardDescription>View and manage all your loans</CardDescription>
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't requested any loans yet</p>
              <Button asChild size="sm">
                <Link href="/request-loan">Request a Loan</Link>
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Loans</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="repaid">Repaid</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {loans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} />
                ))}
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                {loans
                  .filter((loan) => loan.isApproved && !loan.isRepaid)
                  .map((loan) => (
                    <LoanCard key={loan.id} loan={loan} />
                  ))}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                {loans
                  .filter((loan) => !loan.isApproved)
                  .map((loan) => (
                    <LoanCard key={loan.id} loan={loan} />
                  ))}
              </TabsContent>

              <TabsContent value="repaid" className="space-y-4">
                {loans
                  .filter((loan) => loan.isRepaid)
                  .map((loan) => (
                    <LoanCard key={loan.id} loan={loan} />
                  ))}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Loan Card Component
function LoanCard({ loan }: { loan: Loan }) {
  const status = getLoanStatus(loan)
  const progress = getRepaymentProgress(loan)
  const now = Math.floor(Date.now() / 1000)
  const isOverdue = Number(loan.repaymentDeadline) < now && !loan.isRepaid && loan.isApproved

  function getLoanStatus(loan: Loan) {
    if (loan.isRepaid) return "Repaid"
    if (!loan.isApproved) return "Pending"

    const now = Math.floor(Date.now() / 1000)
    if (Number(loan.repaymentDeadline) < now) return "Overdue"
    return "Active"
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "Repaid":
        return <Badge className="bg-green-500">Repaid</Badge>
      case "Pending":
        return <Badge variant="outline">Pending</Badge>
      case "Overdue":
        return <Badge variant="destructive">Overdue</Badge>
      case "Active":
        return <Badge className="bg-blue-500">Active</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  function getRepaymentProgress(loan: Loan) {
    if (loan.totalRepaymentAmount === BigInt(0)) return 0
    return Number((loan.amountRepaid * BigInt(100)) / loan.totalRepaymentAmount)
  }

  return (
    <Card className={isOverdue ? "border-red-500" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Loan #{loan.id}</CardTitle>
            <CardDescription>Requested on {formatDate(loan.repaymentDeadline - BigInt(30 * 86400))}</CardDescription>
          </div>
          {getStatusBadge(status)}
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
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Repayment Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />

            <div className="flex items-center gap-2 text-sm mt-2">
              <Clock className="h-4 w-4" />
              <span>
                {isOverdue ? "Overdue! Penalties may apply." : `${getRemainingTime(loan.repaymentDeadline)} remaining`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {loan.isApproved && !loan.isRepaid ? (
          <Button asChild size="sm" className="w-full">
            <Link href={`/repay-loan?id=${loan.id}`}>Repay Loan</Link>
          </Button>
        ) : loan.isRepaid ? (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <span>Fully Repaid</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Waiting for approval</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}