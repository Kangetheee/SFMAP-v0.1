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

