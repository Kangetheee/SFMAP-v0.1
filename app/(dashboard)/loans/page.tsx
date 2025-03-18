<<<<<<< HEAD
"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/context/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatEther, getRemainingTime, formatDate, getContractAddress } from "@/lib/contract"
import { Loader2, AlertCircle, Wallet, Clock, PiggyBank, FileText, Activity, Settings } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ContractAddressForm } from "@/components/contract-address-form"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

export default function Dashboard() {
  const { address, contract, connect, disconnect } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [contractError, setContractError] = useState<string | null>(null)
  const [showContractForm, setShowContractForm] = useState(false)
  const searchParams = useSearchParams()
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalBorrowed: BigInt(0),
    totalRepaid: BigInt(0),
    nextDeadline: null as bigint | null,
  })

  // Check if contract address is set or if configure param is present
  useEffect(() => {
    const contractAddress = getContractAddress()
    const configureParam = searchParams.get("configure")

    if (!contractAddress || configureParam === "true") {
      setShowContractForm(true)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!address) return

      if (!contract) {
        setContractError("Contract not available. Please check your connection and contract address.")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // Get all loans for the current user
        const loanIds = await contract.getBorrowerLoans(address)

        let totalBorrowed = BigInt(0)
        let totalRepaid = BigInt(0)
        let activeLoans = 0
        let nextDeadline: bigint | null = null

        // Process each loan
        for (let i = 0; i < loanIds.length; i++) {
          const loan = await contract.loans(loanIds[i])

          if (loan.isApproved && !loan.isRepaid) {
            activeLoans++

            // Find the closest deadline
            if (!nextDeadline || loan.repaymentDeadline < nextDeadline) {
              nextDeadline = loan.repaymentDeadline
            }
          }

          totalBorrowed += loan.amount
          totalRepaid += loan.amountRepaid
        }

        setStats({
          totalLoans: loanIds.length,
          activeLoans,
          totalRepaid,
          totalBorrowed,
          nextDeadline,
        })

        setContractError(null)
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error)
        setContractError(error.message || "Failed to fetch data from contract")
        toast.error("Error", {
          description: "Failed to fetch data from contract",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [address, contract])

  const handleContractSaved = () => {
    setShowContractForm(false)
    // Reconnect wallet to use the new contract address
    if (address) {
      disconnect()
      setTimeout(() => {
        connect()
      }, 500)
    }

    // Remove the configure parameter from the URL
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("configure")
      window.history.replaceState({}, "", url)
    }
  }

  if (showContractForm) {
    return (
      <div className="space-y-6 py-8">
        <div className="flex flex-col gap-2 text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Loan Management System</h1>
          <p className="text-muted-foreground">Configure your contract to get started</p>
        </div>

        <ContractAddressForm onSave={handleContractSaved} />
      </div>
    )
  }

  if (!address) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <CardTitle>Welcome to Loan Management System</CardTitle>
            <CardDescription>Connect your wallet to get started with decentralized loans</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button onClick={connect} className="w-full">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
            <Button variant="outline" onClick={() => setShowContractForm(true)} className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Configure Contract
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

  if (contractError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your loan activities and statistics</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Contract Error</AlertTitle>
          <AlertDescription>{contractError}</AlertDescription>
        </Alert>

        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <CardTitle>Contract Configuration</CardTitle>
            <CardDescription>There seems to be an issue with the contract configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Please make sure:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>The contract address is correctly set in the application</li>
              <li>The contract is deployed on the network you're connected to</li>
              <li>Your wallet is connected to the correct network</li>
            </ul>

            <Button onClick={() => setShowContractForm(true)} className="mt-4 w-full">
              <Settings className="mr-2 h-4 w-4" />
              Configure Contract
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <div className="border-none drop-shadow-sm p-6 bg-white rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/request-loan">Request Loan</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/my-loans">My Loans</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowContractForm(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Configure Contract
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">Overview of your loan activities and statistics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <Card className="p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Total Loans</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalLoans}</div>
            <p className="text-sm text-muted-foreground mt-2">Loans you have requested</p>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Active Loans</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.activeLoans}</div>
            <p className="text-sm text-muted-foreground mt-2">Loans pending repayment</p>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Total Borrowed</CardTitle>
            <PiggyBank className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatEther(stats.totalBorrowed)} ETH</div>
            <p className="text-sm text-muted-foreground mt-2">Total amount borrowed</p>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Total Repaid</CardTitle>
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatEther(stats.totalRepaid)} ETH</div>
            <p className="text-sm text-muted-foreground mt-2">Total amount repaid</p>
          </CardContent>
        </Card>
      </div>

      {stats.nextDeadline && (
        <Alert className="mt-6">
          <Clock className="h-4 w-4" />
          <AlertTitle>Upcoming Deadline</AlertTitle>
          <AlertDescription>
            Your next loan repayment is due {formatDate(stats.nextDeadline)} ({getRemainingTime(stats.nextDeadline)}{" "}
            remaining)
          </AlertDescription>
        </Alert>
      )}

      {stats.activeLoans > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Active Loans</CardTitle>
            <CardDescription>You have {stats.activeLoans} active loans</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Attention Required</AlertTitle>
              <AlertDescription>
                You have active loans that need to be repaid. Please check your loans page for details.
              </AlertDescription>
            </Alert>
            <Button className="w-full mt-4" asChild>
              <Link href="/my-loans">Manage Loans</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
=======
import { LoanDashboard } from "@/components/loan-dashboard"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Card className="border-none drop-shadow-sm">
        <CardHeader className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle className="text-xl line-clamp-1">
                Loan Management System
            </CardTitle>
            <ConnectWalletButton />
          </div>
          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">
            Create and fund loans securely on the blockchain. All loans require NFT ownership and credit score
            verification.
          </p>
        </CardHeader>
        <LoanDashboard />
      </Card>
    </div>
  )
}

>>>>>>> 96fcce8914b5c267ae71ff1f62cb3deea8b11efb
