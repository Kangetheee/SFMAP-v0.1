"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, RefreshCw } from "lucide-react"
import { getContractAddress, setContractAddress, isValidAddress, DEFAULT_CONTRACT_ADDRESS } from "@/lib/contract"

interface ContractAddressFormProps {
  onSave: () => void
}

export function ContractAddressForm({ onSave }: ContractAddressFormProps) {
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedAddress = getContractAddress()
    if (savedAddress) {
      setAddress(savedAddress)
    }
  }, [])

  const handleSave = () => {
    if (!address) {
      setError("Contract address is required")
      return
    }

    if (!isValidAddress(address)) {
      setError("Invalid Ethereum address format")
      return
    }

    setContractAddress(address)
    setError(null)
    setSaved(true)

    // Show saved message for 2 seconds
    setTimeout(() => {
      setSaved(false)
      onSave()
    }, 2000)
  }

  const resetToDefault = () => {
    setAddress(DEFAULT_CONTRACT_ADDRESS)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Contract Configuration</CardTitle>
        <CardDescription>The contract address is pre-configured, but you can change it if needed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {saved && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <Check className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Contract address saved successfully!</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="contractAddress">Contract Address</Label>
          <div className="flex gap-2">
            <Input
              id="contractAddress"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={resetToDefault} title="Reset to default address">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This is the address where your Loan Management contract is deployed
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onSave}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Contract Address</Button>
      </CardFooter>
    </Card>
  )
}

