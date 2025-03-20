import type React from "react"
import { Header } from "@/components/Header"
import { WalletProvider } from "@/context/wallet-context"

type Props = {
  children: React.ReactNode
}

const DashboardLayout = ({ children }: Props) => {
  return (
    <WalletProvider>
      <div className="flex min-h-screen flex-col">
        <main className="px-3 lg:px-14">{children}</main>
      </div>
    </WalletProvider>
  )
}

export default DashboardLayout

