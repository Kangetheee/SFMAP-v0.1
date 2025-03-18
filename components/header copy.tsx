"use client"

import { useWallet } from "@/context/wallet-context"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut, LayoutDashboard, PlusCircle, FileText, ShieldCheck, AlertCircle, Settings } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState, useEffect } from "react"

export function Header() {
  const { address, connect, disconnect, isConnecting, isOwner, error } = useWallet()
  const pathname = usePathname()
  const router = useRouter()
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (error) {
      setShowError(true)
      const timer = setTimeout(() => setShowError(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleConnect = async () => {
    try {
      await connect()
    } catch (err: any) {
      toast.error("Connection Error", {
        description: err.message || "Failed to connect wallet",
      })
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
      requiresAuth: true,
    },
    {
      name: "Request Loan",
      path: "/request-loan",
      icon: <PlusCircle className="h-4 w-4 mr-2" />,
      requiresAuth: true,
    },
    {
      name: "My Loans",
      path: "/my-loans",
      icon: <FileText className="h-4 w-4 mr-2" />,
      requiresAuth: true,
    },
    {
      name: "Admin",
      path: "/admin",
      icon: <ShieldCheck className="h-4 w-4 mr-2" />,
      requiresAuth: true,
      requiresOwner: true,
    },
  ]

  const handleConfigureClick = () => {
    router.push("/?configure=true")
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {showError && (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Loan Management System</h1>
        </div>

        <div className="flex items-center gap-2">
          {address && (
            <nav className="hidden md:flex items-center mr-4">
              {navItems.map((item) => {
                // Skip routes that require authentication if not connected
                if (item.requiresAuth && !address) return null

                // Skip routes that require owner access if not owner
                if (item.requiresOwner && !isOwner) return null

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium transition-colors",
                      pathname === item.path ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          )}

          <Button variant="outline" size="sm" onClick={handleConfigureClick} className="mr-2">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline ml-2">Configure</span>
          </Button>

          {address ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">{formatAddress(address)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={disconnect} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Disconnect</span>
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnect} disabled={isConnecting} className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {address && (
        <div className="md:hidden border-t">
          <div className="container flex justify-between">
            {navItems.map((item) => {
              // Skip routes that require authentication if not connected
              if (item.requiresAuth && !address) return null

              // Skip routes that require owner access if not owner
              if (item.requiresOwner && !isOwner) return null

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center py-2 text-xs font-medium transition-colors",
                    pathname === item.path ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.icon}
                  <span className="mt-1">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}

