"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import { getContract as getContractHelper, isContractOwner } from "@/lib/contract"

interface WalletContextType {
  address: string | null
  signer: ethers.Signer | null
  provider: ethers.BrowserProvider | null
  contract: ethers.Contract | null
  isOwner: boolean
  connect: () => Promise<void>
  disconnect: () => void
  isConnecting: boolean
  error: string | null
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  signer: null,
  provider: null,
  contract: null,
  isOwner: false,
  connect: async () => {},
  disconnect: () => {},
  isConnecting: false,
  error: null,
})

export const useWallet = () => useContext(WalletContext)

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.listAccounts()

          if (accounts.length > 0) {
            const signer = await provider.getSigner()
            const address = await signer.getAddress()

            setProvider(provider)
            setSigner(signer)
            setAddress(address)

            // Setup contract
            const contractInstance = await getContractHelper(signer)
            if (contractInstance) {
              setContract(contractInstance)

              // Check if connected address is the contract owner
              try {
                const ownerStatus = await isContractOwner(contractInstance, address)
                setIsOwner(ownerStatus)
              } catch (err) {
                console.warn("Could not determine owner status:", err)
              }
            }
          }
        } catch (err) {
          console.error("Error checking wallet connection:", err)
        }
      }
    }

    checkConnection()
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setAddress(null)
          setSigner(null)
          setProvider(null)
          setContract(null)
          setIsOwner(false)
        } else {
          // User switched accounts
          try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()
            const address = await signer.getAddress()

            setProvider(provider)
            setSigner(signer)
            setAddress(address)

            // Setup contract
            const contractInstance = await getContractHelper(signer)
            if (contractInstance) {
              setContract(contractInstance)

              // Check if connected address is the contract owner
              try {
                const ownerStatus = await isContractOwner(contractInstance, address)
                setIsOwner(ownerStatus)
              } catch (err) {
                console.warn("Could not determine owner status:", err)
              }
            }
          } catch (err) {
            console.error("Error handling account change:", err)
          }
        }
      }

      const handleChainChanged = () => {
        // Reload the page when the chain changes
        window.location.reload()
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  // Connect function
  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("No wallet provider found. Please install MetaMask or another Ethereum wallet.")
      return
    }

    try {
      setIsConnecting(true)
      setError(null)

      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      setProvider(provider)
      setSigner(signer)
      setAddress(address)

      // Get contract instance
      const contractInstance = await getContractHelper(signer)
      if (contractInstance) {
        setContract(contractInstance)

        // Check if connected address is the contract owner
        try {
          const ownerStatus = await isContractOwner(contractInstance, address)
          setIsOwner(ownerStatus)
        } catch (err) {
          console.warn("Could not determine owner status:", err)
        }
      }
    } catch (err: any) {
      console.error("Connection error:", err)
      setError(err.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  // Disconnect function
  const disconnect = () => {
    setAddress(null)
    setSigner(null)
    setProvider(null)
    setContract(null)
    setIsOwner(false)

    // Note: There's no standard way to disconnect in Web3,
    // we just clear our state and the user would need to disconnect from their wallet directly
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        signer,
        provider,
        contract,
        isOwner,
        connect,
        disconnect,
        isConnecting,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

