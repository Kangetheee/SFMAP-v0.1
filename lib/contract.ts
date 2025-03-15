import { ethers } from "ethers"

// ABI for the LoanManagement contract
const loanABI = [
  "function numberOfLoans() view returns (uint256)",
  "function createLoan(string memory _title, string memory _description, uint256 _amountRequired, uint256 _deadline, string memory _documentLink) returns (uint256)",
  "function donateToLoan(uint256 _id) payable",
  "function getAllLoans(uint256 start, uint256 count) view returns (tuple(address borrower, string title, string description, uint256 amountRequired, uint256 deadline, uint256 amountCollected, string documentLink, address[] lenders, uint256[] donations, bool approved)[])",
  "function getLenders(uint256 _id) view returns (address[], uint256[])",
  "event LoanCreated(uint256 indexed loanId, address indexed borrower, string title, uint256 amountRequired)",
  "event DonatedToLoan(uint256 indexed loanId, address indexed donor, uint256 amount)",
  "event LoanFunded(uint256 indexed loanId, address indexed borrower, uint256 totalAmount)",
]

// Contract address - this would be set after deployment
const CONTRACT_ADDRESS = "0xe46B96B92543AA5E843d21A1bbE63320Eb1e9f49" // Replace with actual contract address

export async function getLoanContract() {
  if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
    console.error("Ethereum object not found, install MetaMask")
    return null
  }

  try {
    // Get the provider from window.ethereum
    const provider = new ethers.BrowserProvider(window.ethereum)

    // Get the signer
    const signer = await provider.getSigner()

    // Create a contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, loanABI, signer)

    return contract
  } catch (error) {
    console.error("Error getting contract:", error)
    return null
  }
}

