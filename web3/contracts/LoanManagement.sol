// SPDX-License-Identifier: MIT
<<<<<<< HEAD
pragma solidity ^0.8.20;

contract LoanManagementSystem {
    // Struct to represent a loan
    struct Loan {
        uint256 id; // Unique ID for the loan
        address borrower; // Address of the borrower
        address lender; // Address of the lender who funded the loan
        uint256 amount; // Loan amount requested
        uint256 interestRate; // Interest rate (in percentage)
        uint256 repaymentDeadline; // Timestamp by which the loan must be repaid
        uint256 totalRepaymentAmount; // Total amount to be repaid (principal + interest)
        uint256 amountRepaid; // Amount repaid so far
        uint256 creditScore; // FICO credit score of the borrower
        LoanStatus status; // Current status of the loan
    }

    // Enum to represent loan status
    enum LoanStatus {
        Requested,
        Approved,
        Funded,
        Repaid,
        Defaulted
    }

    // Risk category based on FICO score
    enum RiskCategory {
        VeryHigh, // Below 580
        High,     // 580-669
        Medium,   // 670-739
        Low,      // 740-799
        VeryLow   // 800-850
    }

    // State variables
    address public owner; // Owner of the contract
    uint256 public loanCounter; // Counter to generate unique loan IDs
    mapping(uint256 => Loan) public loans; // Mapping of loan ID to Loan details
    mapping(address => uint256[]) public borrowerLoans; // Loans associated with each borrower
    mapping(address => uint256[]) public lenderLoans; // Loans associated with each lender
    mapping(address => uint256) public borrowerCreditScores; // FICO credit scores of borrowers
    mapping(RiskCategory => uint256) public riskBasedInterestRates; // Base interest rates by risk category

    // Events
    event LoanRequested(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 creditScore);
    event LoanApproved(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event LoanFunded(uint256 indexed loanId, address indexed lender, address indexed borrower, uint256 amount);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amountRepaid);
    event PenaltyApplied(uint256 indexed loanId, address indexed borrower, uint256 penaltyAmount);
    event CreditScoreUpdated(address indexed borrower, uint256 oldScore, uint256 newScore);
    event LenderRegistered(address indexed lender);

    // Reentrancy Guard
    bool private locked;

    // Modifier to restrict access to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    // Modifier to restrict access to the loan's lender
    modifier onlyLender(uint256 _loanId) {
        require(loans[_loanId].lender == msg.sender, "Only the lender of this loan can perform this action");
        _;
    }

    // Reentrancy Guard Modifier
    modifier nonReentrant() {
        require(!locked, "Reentrant call detected");
        locked = true;
        _;
        locked = false;
    }

    // Constructor to set the owner and default risk-based interest rates
    constructor() {
        owner = msg.sender;
        loanCounter = 1;
        locked = false;
        
        // Set default risk-based interest rates
        riskBasedInterestRates[RiskCategory.VeryHigh] = 25; // 25%
        riskBasedInterestRates[RiskCategory.High] = 18;     // 18%
        riskBasedInterestRates[RiskCategory.Medium] = 12;   // 12%
        riskBasedInterestRates[RiskCategory.Low] = 8;       // 8%
        riskBasedInterestRates[RiskCategory.VeryLow] = 5;   // 5%
    }

    /**
     * @notice Allows the owner to update risk-based interest rates
     * @param _category The risk category to update
     * @param _rate The new interest rate for the category
     */
    function updateRiskBasedInterestRate(RiskCategory _category, uint256 _rate) external onlyOwner {
        require(_rate > 0, "Interest rate must be greater than zero");
        riskBasedInterestRates[_category] = _rate;
    }

    /**
     * @notice Updates a borrower's credit score (only owner can do this)
     * @param _borrower The borrower's address
     * @param _creditScore The new FICO credit score (300-850)
     */
    function updateCreditScore(address _borrower, uint256 _creditScore) external onlyOwner {
        require(_creditScore >= 300 && _creditScore <= 850, "Credit score must be between 300 and 850");
        
        uint256 oldScore = borrowerCreditScores[_borrower];
        borrowerCreditScores[_borrower] = _creditScore;
        
        emit CreditScoreUpdated(_borrower, oldScore, _creditScore);
    }

    /**
     * @notice Determines the risk category based on FICO credit score
     * @param _creditScore The FICO credit score
     * @return The risk category
     */
    function determineRiskCategory(uint256 _creditScore) public pure returns (RiskCategory) {
        if (_creditScore < 580) return RiskCategory.VeryHigh;
        if (_creditScore < 670) return RiskCategory.High;
        if (_creditScore < 740) return RiskCategory.Medium;
        if (_creditScore < 800) return RiskCategory.Low;
        return RiskCategory.VeryLow;
    }

    /**
     * @notice Allows a borrower to request a loan (interest rate now calculated based on credit score)
     * @param _amount The loan amount requested
     * @param _repaymentPeriod The repayment period in seconds
     */
    function requestLoan(
        uint256 _amount,
        uint256 _repaymentPeriod
    ) external {
        require(_amount > 0, "Loan amount must be greater than zero");
        require(_repaymentPeriod > 0, "Repayment period must be greater than zero");
        require(borrowerCreditScores[msg.sender] >= 300, "Borrower must have a credit score registered");

        uint256 creditScore = borrowerCreditScores[msg.sender];
        RiskCategory riskCategory = determineRiskCategory(creditScore);
        uint256 interestRate = riskBasedInterestRates[riskCategory];
        
        uint256 repaymentDeadline = block.timestamp + _repaymentPeriod;
        uint256 totalRepaymentAmount = calculateTotalRepayment(_amount, interestRate);

        Loan memory newLoan = Loan({
            id: loanCounter,
            borrower: msg.sender,
            lender: address(0), // No lender assigned yet
            amount: _amount,
            interestRate: interestRate,
            repaymentDeadline: repaymentDeadline,
            totalRepaymentAmount: totalRepaymentAmount,
            amountRepaid: 0,
            creditScore: creditScore,
            status: LoanStatus.Requested
        });

        loans[loanCounter] = newLoan;
        borrowerLoans[msg.sender].push(loanCounter);

        emit LoanRequested(loanCounter, msg.sender, _amount, creditScore);
        loanCounter++;
    }

    /**
     * @notice Allows the owner to approve a loan (admin verification step)
     * @param _loanId The ID of the loan to approve
     */
    function approveLoan(uint256 _loanId) external onlyOwner {
        require(loans[_loanId].borrower != address(0), "Loan does not exist");
        require(loans[_loanId].status == LoanStatus.Requested, "Loan is not in requested state");

        loans[_loanId].status = LoanStatus.Approved;

        emit LoanApproved(_loanId, loans[_loanId].borrower, loans[_loanId].amount);
    }

    /**
     * @notice Allows a lender to fund an approved loan
     * @param _loanId The ID of the loan to fund
     */
    function fundLoan(uint256 _loanId) external payable nonReentrant {
        Loan storage loan = loans[_loanId];
        
        require(loan.borrower != address(0), "Loan does not exist");
        require(loan.status == LoanStatus.Approved, "Loan is not approved");
        require(msg.value >= loan.amount, "Insufficient funds to fund the loan");

        // Assign the lender
        loan.lender = msg.sender;
        loan.status = LoanStatus.Funded;
        
        // Add to lender's loans
        lenderLoans[msg.sender].push(_loanId);

        // Transfer the loan amount to the borrower
        payable(loan.borrower).transfer(loan.amount);
        
        // Refund excess amount to the lender if applicable
        uint256 excessAmount = msg.value - loan.amount;
        if (excessAmount > 0) {
            payable(msg.sender).transfer(excessAmount);
        }

        emit LoanFunded(_loanId, msg.sender, loan.borrower, loan.amount);
    }

    /**
     * @notice Allows a borrower to repay their loan
     * @param _loanId The ID of the loan to repay
     */
    function repayLoan(uint256 _loanId) external payable nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.borrower == msg.sender, "You are not the borrower of this loan");
        require(loan.status == LoanStatus.Funded, "Loan is not in funded state");

        uint256 remainingAmount = loan.totalRepaymentAmount - loan.amountRepaid;
        require(msg.value > 0, "Payment amount must be greater than zero");
        
        uint256 actualPayment = msg.value;
        uint256 excessAmount = 0;
        
        // Handle excess payment
        if (msg.value > remainingAmount) {
            actualPayment = remainingAmount;
            excessAmount = msg.value - remainingAmount;
        }
        
        loan.amountRepaid += actualPayment;

        // Transfer payment to the lender
        payable(loan.lender).transfer(actualPayment);

        // Check if loan is fully repaid
        if (loan.amountRepaid >= loan.totalRepaymentAmount) {
            loan.status = LoanStatus.Repaid;
        }

        // Refund excess payment to the borrower if applicable
        if (excessAmount > 0) {
            payable(msg.sender).transfer(excessAmount);
        }

        emit LoanRepaid(_loanId, msg.sender, actualPayment);
    }

    /**
     * @notice Apply a penalty for late loan repayment
     * @param _loanId The ID of the loan
     */
    function applyPenalty(uint256 _loanId) external onlyLender(_loanId) nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "Loan is not in funded state");
        require(block.timestamp > loan.repaymentDeadline, "Repayment deadline has not passed");

        uint256 penaltyAmount = loan.totalRepaymentAmount / 10; // 10% penalty
        loan.totalRepaymentAmount += penaltyAmount;

        emit PenaltyApplied(_loanId, loan.borrower, penaltyAmount);
    }

    /**
     * @notice Mark a loan as defaulted (can only be done by the lender after deadline)
     * @param _loanId The ID of the loan
     */
    function markAsDefaulted(uint256 _loanId) external onlyLender(_loanId) {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Funded, "Loan is not in funded state");
        require(block.timestamp > loan.repaymentDeadline + 30 days, "Must wait 30 days after deadline before marking as defaulted");
        
        loan.status = LoanStatus.Defaulted;
        
        // This could trigger additional logic like credit score reduction in a more complex system
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
     * @notice Get loans by status (useful for lenders to browse available loans)
     * @param _status The loan status to filter by
     * @return An array of loan IDs
     */
    function getLoansByStatus(LoanStatus _status) external view returns (uint256[] memory) {
        // First, count loans with the given status
        uint256 count = 0;
        for (uint256 i = 1; i < loanCounter; i++) {
            if (loans[i].status == _status) {
                count++;
            }
        }
        
        // Then create an array of the right size and fill it
        uint256[] memory result = new uint256[](count);
        uint256 resultIndex = 0;
        
        for (uint256 i = 1; i < loanCounter; i++) {
            if (loans[i].status == _status) {
                result[resultIndex] = i;
                resultIndex++;
            }
        }
        
        return result;
    }

    /**
     * @notice Get all loans associated with a borrower
     * @param _borrower The borrower's address
     * @return An array of loan IDs
     */
    function getBorrowerLoans(address _borrower) external view returns (uint256[] memory) {
        return borrowerLoans[_borrower];
    }

    /**
     * @notice Get all loans associated with a lender
     * @param _lender The lender's address
     * @return An array of loan IDs
     */
    function getLenderLoans(address _lender) external view returns (uint256[] memory) {
        return lenderLoans[_lender];
    }

    /**
     * @notice Get loan details including risk assessment
     * @param _loanId The ID of the loan
     * @return loanDetails The loan details
     * @return riskCategory The risk category of the loan
     */
    function getLoanWithRiskAssessment(uint256 _loanId) external view returns (Loan memory, RiskCategory) {
        Loan memory loan = loans[_loanId];
        RiskCategory risk = determineRiskCategory(loan.creditScore);
        return (loan, risk);
    }

    /**
     * @notice Get a borrower's credit score
     * @param _borrower The borrower's address
     * @return creditScore The FICO credit score
     * @return riskCategory The risk category based on the credit score
     */
    function getBorrowerCreditInfo(address _borrower) external view returns (uint256, RiskCategory) {
        uint256 creditScore = borrowerCreditScores[_borrower];
        RiskCategory risk = determineRiskCategory(creditScore);
        return (creditScore, risk);
    }

    /**
     * @notice Withdraws contract balance to the owner
     * @dev This function should only be used for administrative purposes
     */
    function withdrawContractBalance() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "Contract balance is empty");
        payable(owner).transfer(balance);
    }

    /**
     * @notice Checks if a loan is overdue
     * @param _loanId The ID of the loan
     * @return bool True if the loan is overdue
     */
    function isLoanOverdue(uint256 _loanId) public view returns (bool) {
        Loan memory loan = loans[_loanId];
        return (loan.status == LoanStatus.Funded && 
                block.timestamp > loan.repaymentDeadline &&
                loan.amountRepaid < loan.totalRepaymentAmount);
    }

    /**
     * @notice Gets the count of total loans in the system
     * @return uint256 The total number of loans
     */
    function getTotalLoanCount() external view returns (uint256) {
        return loanCounter - 1;
    }

    /**
     * @notice Updates the contract owner
     * @param _newOwner The address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be the zero address");
        owner = _newOwner;
    }

    /**
     * @notice Calculates the remaining repayment amount for a loan
     * @param _loanId The ID of the loan
     * @return uint256 The remaining amount to be repaid
     */
    function getRemainingRepaymentAmount(uint256 _loanId) external view returns (uint256) {
        Loan memory loan = loans[_loanId];
        if (loan.amountRepaid >= loan.totalRepaymentAmount) {
            return 0;
        }
        return loan.totalRepaymentAmount - loan.amountRepaid;
    }

    /**
     * @notice Allows a borrower to make a partial repayment
     * @param _loanId The ID of the loan to repay partially
     */
    function makePartialRepayment(uint256 _loanId) external payable nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.borrower == msg.sender, "You are not the borrower of this loan");
        require(loan.status == LoanStatus.Funded, "Loan is not in funded state");
        require(msg.value > 0, "Payment amount must be greater than zero");
        
        loan.amountRepaid += msg.value;
        
        // Transfer payment to the lender
        payable(loan.lender).transfer(msg.value);
        
        // Check if loan is fully repaid
        if (loan.amountRepaid >= loan.totalRepaymentAmount) {
            loan.status = LoanStatus.Repaid;
        }
        
        emit LoanRepaid(_loanId, msg.sender, msg.value);
    }

    /**
     * @notice Emergency function to pause all loan activities in case of critical issues
     * @dev This can be extended with a paused state variable and associated modifiers
     */
    function emergencyPause() external onlyOwner {
        // Implementation would depend on the pause mechanism
        // For example, setting a paused state variable
        // paused = true;
    }

    /**
     * @notice Fallback function to accept ETH payments
     */
    receive() external payable {
        // Funds received
=======
pragma solidity ^0.8.9;

import "./NFTCollection.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract LoanManagement is ReentrancyGuard {
    // Reference to the NFT collection
    NFTCollection public nftCollection;

    // Oracle for fetching credit scores
    AggregatorV3Interface internal creditScoreOracle;

    // Minimum credit score required for loan approval
    uint256 public minCreditScore = 650;

    // Struct to represent a loan
    struct Loan {
        address borrower; // The person requesting the loan
        string title; // Title of the loan request
        string description; // Description of the loan purpose
        uint256 amountRequired; // Total amount required for the loan
        uint256 deadline; // Deadline for the loan request
        uint256 amountCollected; // Amount collected so far
        string documentLink; // Link to any supporting documents
        address[] lenders; // List of lenders who donated
        uint256[] donations; // List of donation amounts
        bool approved; // Indicates if the loan is approved based on credit score
    }

    // Mapping to store all loans
    mapping(uint256 => Loan) public loans;

    // Total number of loans created
    uint256 public numberOfLoans = 0;

    // Owner of the contract
    address private owner;

    // Constructor to set the NFT collection address and credit score oracle
    constructor(NFTCollection _nftCollectionAddress, address _creditScoreOracleAddress) {
        nftCollection = _nftCollectionAddress;
        creditScoreOracle = AggregatorV3Interface(_creditScoreOracleAddress);
        owner = msg.sender; // Set contract deployer as owner
    }

    // Modifier to restrict access to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    // Function to set the minimum credit score threshold
    function setMinCreditScore(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold > 0, "Threshold must be greater than 0");
        minCreditScore = _newThreshold;
    }

    // Function to create a new loan request
    function createLoan(
        string memory _title,
        string memory _description,
        uint256 _amountRequired,
        uint256 _deadline,
        string memory _documentLink
    ) public returns (uint256) {
        // Ensure the borrower owns at least one NFT from the specified collection
        require(
            nftCollection.balanceOf(msg.sender) > 0,
            "Borrower must own an NFT from the specified collection."
        );

        // Validate input parameters
        require(bytes(_title).length > 0, "Title cannot be empty.");
        require(bytes(_description).length > 0, "Description cannot be empty.");
        require(_amountRequired > 0, "Loan amount must be greater than 0.");
        require(_deadline > block.timestamp, "Deadline must be in the future.");
        require(bytes(_documentLink).length > 0, "Document link cannot be empty.");

        // Create the loan
        Loan storage loan = loans[numberOfLoans];
        loan.borrower = msg.sender;
        loan.title = _title;
        loan.description = _description;
        loan.amountRequired = _amountRequired;
        loan.deadline = _deadline;
        loan.amountCollected = 0;
        loan.documentLink = _documentLink;

        // Check the borrower's credit score and approve the loan if eligible
        bool isApproved = checkCreditScore();
        loan.approved = isApproved;

        // Increment the loan counter
        numberOfLoans++;

        // Emit an event for loan creation
        emit LoanCreated(numberOfLoans - 1, msg.sender, _title, _amountRequired);

        return numberOfLoans - 1;
    }

    // Function to donate to a specific loan
    function donateToLoan(uint256 _id) public payable nonReentrant {
        // Ensure the loan exists and is approved
        Loan storage loan = loans[_id];
        require(loan.approved, "Loan is not approved due to insufficient credit score.");
        uint256 amount = msg.value;
        require(amount > 0, "Donation amount must be greater than 0.");
        require(block.timestamp <= loan.deadline, "This loan request has expired.");

        // Add the donor and donation amount to the loan
        loan.lenders.push(msg.sender);
        loan.donations.push(amount);
        loan.amountCollected += amount;

        // Emit an event for the donation
        emit DonatedToLoan(_id, msg.sender, amount);

        // If the loan is fully funded, send the total amount to the borrower
        if (loan.amountCollected >= loan.amountRequired) {
            (bool sent, ) = payable(loan.borrower).call{value: loan.amountCollected}("");
            require(sent, "Failed to send the loan amount to the borrower.");
            emit LoanFunded(_id, loan.borrower, loan.amountCollected);
        }
    }

    // Function to get the list of lenders and their donations for a specific loan
    function getLenders(uint256 _id) public view returns (address[] memory, uint256[] memory) {
        return (loans[_id].lenders, loans[_id].donations);
    }

    // Function to get all loans with pagination
    function getAllLoans(uint256 start, uint256 count) public view returns (Loan[] memory) {
        uint256 end = start + count;
        if (end > numberOfLoans) {
            end = numberOfLoans;
        }
        Loan[] memory result = new Loan[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = loans[i];
        }
        return result;
    }

    // Function to check the borrower's credit score
    function checkCreditScore() internal view returns (bool) {
        (
            /* uint80 roundID */,
            int256 creditScore,
            /* uint256 startedAt */,
            uint256 updatedAt,
            /* uint80 answeredInRound */
        ) = creditScoreOracle.latestRoundData();
        require(creditScore > 0, "Invalid credit score");
        require(uint256(creditScore) >= minCreditScore, "Credit score below minimum threshold");
        require(updatedAt + 1 days >= block.timestamp, "Stale credit score data");
        return true;
    }

    // Events for logging important actions
    event LoanCreated(uint256 indexed loanId, address indexed borrower, string title, uint256 amountRequired);
    event DonatedToLoan(uint256 indexed loanId, address indexed donor, uint256 amount);
    event LoanFunded(uint256 indexed loanId, address indexed borrower, uint256 totalAmount);

    // Reject unintended Ether transfers
    receive() external payable {
        revert("Direct Ether transfer not allowed.");
    }

    fallback() external payable {
        revert("Fallback function not implemented.");
>>>>>>> 96fcce8914b5c267ae71ff1f62cb3deea8b11efb
    }
}