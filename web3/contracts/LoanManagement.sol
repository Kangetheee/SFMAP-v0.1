// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LoanManagementSystem {
    // Struct to represent a loan
    struct Loan {
        uint256 id; // Unique ID for the loan
        address borrower; // Address of the borrower
        uint256 amount; // Loan amount requested
        uint256 interestRate; // Interest rate (in percentage)
        uint256 repaymentDeadline; // Timestamp by which the loan must be repaid
        uint256 totalRepaymentAmount; // Total amount to be repaid (principal + interest)
        uint256 amountRepaid; // Amount repaid so far
        bool isApproved; // Whether the loan has been approved
        bool isRepaid; // Whether the loan has been fully repaid
    }

    // State variables
    address public owner; // Owner of the contract
    uint256 public loanCounter; // Counter to generate unique loan IDs
    mapping(uint256 => Loan) public loans; // Mapping of loan ID to Loan details
    mapping(address => uint256[]) public borrowerLoans; // Loans associated with each borrower

    // Events
    event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanApproved(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amountRepaid);
    event PenaltyApplied(uint256 indexed loanId, address indexed borrower, uint256 penaltyAmount);

    // Reentrancy Guard
    bool private locked;

    // Modifier to restrict access to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    // Reentrancy Guard Modifier
    modifier nonReentrant() {
        require(!locked, "Reentrant call detected");
        locked = true;
        _;
        locked = false;
    }

    // Constructor to set the owner
    constructor() {
        owner = msg.sender;
        loanCounter = 1;
        locked = false;
    }

    /**
     * @notice Allows a borrower to request a loan
     * @param _amount The loan amount requested
     * @param _interestRate The interest rate (in percentage)
     * @param _repaymentPeriod The repayment period in seconds
     */
    function requestLoan(
        uint256 _amount,
        uint256 _interestRate,
        uint256 _repaymentPeriod
    ) external {
        require(_amount > 0, "Loan amount must be greater than zero");
        require(_interestRate > 0, "Interest rate must be greater than zero");
        require(_repaymentPeriod > 0, "Repayment period must be greater than zero");

        uint256 repaymentDeadline = block.timestamp + _repaymentPeriod;
        uint256 totalRepaymentAmount = calculateTotalRepayment(_amount, _interestRate);

        Loan memory newLoan = Loan({
            id: loanCounter,
            borrower: msg.sender,
            amount: _amount,
            interestRate: _interestRate,
            repaymentDeadline: repaymentDeadline,
            totalRepaymentAmount: totalRepaymentAmount,
            amountRepaid: 0,
            isApproved: false,
            isRepaid: false
        });

        loans[loanCounter] = newLoan;
        borrowerLoans[msg.sender].push(loanCounter);

        emit LoanRequested(loanCounter, msg.sender, _amount);
        loanCounter++;
    }

    /**
     * @notice Allows the owner to approve a loan
     * @param _loanId The ID of the loan to approve
     */
    function approveLoan(uint256 _loanId) external onlyOwner nonReentrant {
        require(loans[_loanId].borrower != address(0), "Loan does not exist");
        require(!loans[_loanId].isApproved, "Loan is already approved");

        loans[_loanId].isApproved = true;

        // Transfer the loan amount to the borrower
        payable(loans[_loanId].borrower).transfer(loans[_loanId].amount);

        emit LoanApproved(_loanId, loans[_loanId].borrower, loans[_loanId].amount);
    }

    /**
     * @notice Allows a borrower to repay their loan
     * @param _loanId The ID of the loan to repay
     */
    function repayLoan(uint256 _loanId) external payable nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.borrower == msg.sender, "You are not the borrower of this loan");
        require(loan.isApproved, "Loan has not been approved");
        require(!loan.isRepaid, "Loan is already fully repaid");

        uint256 remainingAmount = loan.totalRepaymentAmount - loan.amountRepaid;
        require(msg.value >= remainingAmount, "Insufficient payment to fully repay the loan");

        uint256 excessAmount = msg.value - remainingAmount;
        loan.amountRepaid += msg.value;

        if (loan.amountRepaid >= loan.totalRepaymentAmount) {
            loan.isRepaid = true;
        }

        // Refund excess payment to the borrower
        if (excessAmount > 0) {
            payable(msg.sender).transfer(excessAmount);
        }

        emit LoanRepaid(_loanId, msg.sender, loan.amountRepaid);
    }

    /**
     * @notice Apply a penalty for late loan repayment
     * @param _loanId The ID of the loan
     */
    function applyPenalty(uint256 _loanId) external onlyOwner nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.borrower != address(0), "Loan does not exist");
        require(!loan.isRepaid, "Loan is already fully repaid");
        require(block.timestamp > loan.repaymentDeadline, "Repayment deadline has not passed");

        uint256 penaltyAmount = loan.totalRepaymentAmount / 10; // 10% penalty
        loan.totalRepaymentAmount += penaltyAmount;

        emit PenaltyApplied(_loanId, loan.borrower, penaltyAmount);
    }

    /**
     * @notice Helper function to calculate total repayment amount
     * @param _amount The loan amount
     * @param _interestRate The interest rate (in percentage)
     * @return The total repayment amount
     */
    function calculateTotalRepayment(uint256 _amount, uint256 _interestRate)
        internal
        pure
        returns (uint256)
    {
        return (_amount * (100 + _interestRate)) / 100;
    }

    /**
     * @notice Get all loans associated with a borrower
     * @param _borrower The borrower's address
     * @return An array of loan IDs
     */
    function getBorrowerLoans(address _borrower) external view returns (uint256[] memory) {
        return borrowerLoans[_borrower];
    }
}