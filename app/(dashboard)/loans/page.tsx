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
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6">
        <Card className="w-full max-w-md">
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
          <h1 className="text-3xl font-bold tracking-tight">Loans Dashboard</h1>
          <p className="text-muted-foreground">Overview of your loan activities and statistics</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Contract Error</AlertTitle>
          <AlertDescription>{contractError}</AlertDescription>
        </Alert>

        <Card>
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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Button variant="outline" size="sm" onClick={() => setShowContractForm(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Configure Contract
          </Button>
        </div>
        <p className="text-muted-foreground">Overview of your loan activities and statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLoans}</div>
            <p className="text-xs text-muted-foreground">Loans you have requested</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLoans}</div>
            <p className="text-xs text-muted-foreground">Loans pending repayment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEther(stats.totalBorrowed)} ETH</div>
            <p className="text-xs text-muted-foreground">Total amount borrowed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repaid</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEther(stats.totalRepaid)} ETH</div>
            <p className="text-xs text-muted-foreground">Total amount repaid</p>
          </CardContent>
        </Card>
      </div>

      {stats.nextDeadline && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Upcoming Deadline</AlertTitle>
          <AlertDescription>
            Your next loan repayment is due {formatDate(stats.nextDeadline)} ({getRemainingTime(stats.nextDeadline)}{" "}
            remaining)
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 md:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild>
              <Link href="/request-loan">Request New Loan</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/my-loans">View My Loans</Link>
            </Button>
            {stats.activeLoans > 0 && (
              <Button
                asChild
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 hover:text-blue-900"
              >
                <Link href="/my-loans?tab=active">Repay Active Loans</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {stats.activeLoans > 0 && (
          <Card className="flex-1">
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
    </div>
  )
}

