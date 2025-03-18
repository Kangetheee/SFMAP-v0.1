import { ethers } from "ethers"

// ABI for the LoanManagementSystem contract
export const LoanManagementSystemABI = [
  "function owner() view returns (address)",
  "function loanCounter() view returns (uint256)",
  "function loans(uint256) view returns (uint256 id, address borrower, uint256 amount, uint256 interestRate, uint256 repaymentDeadline, uint256 totalRepaymentAmount, uint256 amountRepaid, bool isApproved, bool isRepaid)",
  "function borrowerLoans(address) view returns (uint256[])",
  "function requestLoan(uint256 _amount, uint256 _interestRate, uint256 _repaymentPeriod)",
  "function approveLoan(uint256 _loanId)",
  "function repayLoan(uint256 _loanId) payable",
  "function applyPenalty(uint256 _loanId)",
  "function getBorrowerLoans(address _borrower) view returns (uint256[])",
]

// Default contract address from environment variable
export const DEFAULT_CONTRACT_ADDRESS = "0xb6be0666bd2f5bef9bcdd7637907451f68a985b3"

// Get contract address from local storage or use default
export function getContractAddress(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("contractAddress") || DEFAULT_CONTRACT_ADDRESS
  }
  return DEFAULT_CONTRACT_ADDRESS
}

// Set contract address in local storage
export function setContractAddress(address: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("contractAddress", address)
  }
}

// Helper function to get contract instance
export async function getContract(signer: ethers.Signer | null) {
  if (!signer) return null

  const contractAddress = getContractAddress()

  // Validate contract address
  if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
    console.error("Contract address is not set or is invalid")
    return null
  }

  try {
    return new ethers.Contract(contractAddress, LoanManagementSystemABI, signer)
  } catch (error) {
    console.error("Error creating contract instance:", error)
    return null
  }
}

// Check if an address is the contract owner
export async function isContractOwner(contract: ethers.Contract | null, address: string): Promise<boolean> {
  if (!contract || !address) return false

  try {
    const ownerAddress = await contract.owner()
    return address.toLowerCase() === ownerAddress.toLowerCase()
  } catch (error) {
    console.error("Error checking contract owner:", error)
    return false
  }
}

// Loan type definition matching the contract struct
export interface Loan {
  id: number
  borrower: string
  amount: bigint
  interestRate: bigint
  repaymentDeadline: bigint
  totalRepaymentAmount: bigint
  amountRepaid: bigint
  isApproved: boolean
  isRepaid: boolean
}

// Format loan data from contract response
export function formatLoan(loanData: any): Loan {
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
}

// Format ethers to display in UI
export function formatEther(wei: bigint): string {
  return ethers.formatEther(wei)
}

// Parse ether string to bigint
export function parseEther(ether: string): bigint {
  return ethers.parseEther(ether)
}

// Format timestamp to readable date
export function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleString()
}

// Calculate remaining time until deadline
export function getRemainingTime(deadline: bigint): string {
  const now = Math.floor(Date.now() / 1000)
  const remaining = Number(deadline) - now

  if (remaining <= 0) return "Expired"

  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)

  return `${days}d ${hours}h`
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

