"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoanCard } from "@/components/loan-card"
import { CreateLoanDialog } from "@/components/create-loan-dialog"
import { Plus } from "lucide-react"
import { getLoanContract } from "@/lib/contract"

export type Loan = {
  id: number
  borrower: string
  title: string
  description: string
  amountRequired: string
  deadline: number
  amountCollected: string
  documentLink: string
  approved: boolean
}

export function LoanDashboard() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchLoans()
  }, [])

  const fetchLoans = async () => {
    try {
      setIsLoading(true)
      const contract = await getLoanContract()

      if (!contract) {
        console.error("Contract not initialized")
        return
      }

      const loanCount = await contract.numberOfLoans()
      const fetchedLoans: Loan[] = []

      // Fetch loans in batches of 10
      for (let i = 0; i < loanCount; i += 10) {
        const count = Math.min(10, loanCount - i)
        const loansData = await contract.getAllLoans(i, count)

        loansData.forEach((loan: any, index: number) => {
          fetchedLoans.push({
            id: i + index,
            borrower: loan.borrower,
            title: loan.title,
            description: loan.description,
            amountRequired: loan.amountRequired.toString(),
            deadline: loan.deadline.toNumber(),
            amountCollected: loan.amountCollected.toString(),
            documentLink: loan.documentLink,
            approved: loan.approved,
          })
        })
      }

      setLoans(fetchedLoans)
    } catch (error) {
      console.error("Error fetching loans:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLoans = () => {
    if (activeTab === "all") return loans
    if (activeTab === "active")
      return loans.filter(
        (loan) =>
          loan.approved &&
          loan.deadline * 1000 > Date.now() &&
          BigInt(loan.amountCollected) < BigInt(loan.amountRequired),
      )
    if (activeTab === "funded")
      return loans.filter((loan) => BigInt(loan.amountCollected) >= BigInt(loan.amountRequired))
    return loans
  }

  return (
    <div>
      <div className="px-6 pb-6">
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">All Loans</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="funded">Funded</TabsTrigger>
            </TabsList>
            <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Create Loan
            </Button>
          </div>

          <TabsContent value="all" className="mt-6">
            {renderLoansList(filteredLoans(), isLoading)}
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            {renderLoansList(filteredLoans(), isLoading)}
          </TabsContent>

          <TabsContent value="funded" className="mt-6">
            {renderLoansList(filteredLoans(), isLoading)}
          </TabsContent>
        </Tabs>
      </div>

      <CreateLoanDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} onLoanCreated={fetchLoans} />
    </div>
  )
}

function renderLoansList(loans: Loan[], isLoading: boolean) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-muted/50 rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (loans.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">No loans found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loans.map((loan) => (
        <LoanCard key={loan.id} loan={loan} />
      ))}
    </div>
  )
}

