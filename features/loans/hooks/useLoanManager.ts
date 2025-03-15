import { useAccount, usePublicClient, useWriteContract, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { LOAN_MANAGEMENT_ADDRESS } from '../../../web3/contracts/addresses';
import { abi as LoanManagementAbi } from '../../../web3/contracts/abis/LoanManagement.json';
import { CreateLoanParams, DonateToLoanParams, Loan } from '../../loans/types';

export function useLoanManager() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();
  
  // Create a new loan
  const createLoan = async ({
    title,
    description,
    amountRequired,
    deadline,
    documentLink,
  }: CreateLoanParams) => {
    try {
      const deadlineTimestamp = BigInt(Math.floor(deadline.getTime() / 1000));
      const amount = parseEther(amountRequired);
      
      const hash = await writeContractAsync({
        abi: LoanManagementAbi,
        address: LOAN_MANAGEMENT_ADDRESS,
        functionName: 'createLoan',
        args: [title, description, amount, deadlineTimestamp, documentLink],
      });
      
      return { success: true, hash };
    } catch (error) {
      console.error('Error creating loan:', error);
      return { success: false, error };
    }
  };

  // Donate to a loan
  const donateToLoan = async ({ loanId, amount }: DonateToLoanParams) => {
    try {
      const etherAmount = parseEther(amount);
      
      const hash = await writeContractAsync({
        abi: LoanManagementAbi,
        address: LOAN_MANAGEMENT_ADDRESS,
        functionName: 'donateToLoan',
        args: [BigInt(loanId)],
        value: etherAmount,
      });
      
      return { success: true, hash };
    } catch (error) {
      console.error('Error donating to loan:', error);
      return { success: false, error };
    }
  };

  // Get all loans with pagination
  const { data: loans, isLoading: isLoadingLoans, refetch: refetchLoans } = useReadContract({
    abi: LoanManagementAbi,
    address: LOAN_MANAGEMENT_ADDRESS,
    functionName: 'getAllLoans',
    args: [0n, 100n], // Get first 100 loans
  });

  // Get a specific loan by ID
  const getLoanById = async (loanId: number) => {
    try {
      const loan = await publicClient.readContract({
        abi: LoanManagementAbi,
        address: LOAN_MANAGEMENT_ADDRESS,
        functionName: 'loans',
        args: [BigInt(loanId)],
      });
      
      return { success: true, loan };
    } catch (error) {
      console.error('Error getting loan:', error);
      return { success: false, error };
    }
  };

  // Get lenders for a specific loan
  const getLenders = async (loanId: number) => {
    try {
      const [lenders, donations] = await publicClient.readContract({
        abi: LoanManagementAbi,
        address: LOAN_MANAGEMENT_ADDRESS,
        functionName: 'getLenders',
        args: [BigInt(loanId)],
      });
      
      return { success: true, lenders, donations };
    } catch (error) {
      console.error('Error getting lenders:', error);
      return { success: false, error };
    }
  };

  return {
    createLoan,
    donateToLoan,
    getLoanById,
    getLenders,
    loans: loans as Loan[] | undefined,
    isLoadingLoans,
    refetchLoans,
    isWritePending,
    walletAddress: address,
  };
}
