// SPDX-License-Identifier: MIT
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
    }
}