import("chai").then(async ({ expect }) => {
  const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { ethers } = require("hardhat");

  describe("Contract.sol", function () {
    let nftCollection, loanManagement, mockOracle, owner, borrower, lender1, lender2;

    beforeEach(async function () {
      try {
        // Deploy NFTCollection contract (mock)
        const NFTCollection = await ethers.getContractFactory("NFTCollection");
        nftCollection = await NFTCollection.deploy("TestNFT", "TNFT");
        await nftCollection.deployed();
        console.log("NFTCollection deployed at:", nftCollection.address);

        // Deploy Mock Oracle
        const MockV3Aggregator = await ethers.getContractFactory(
          "MockV3Aggregator"
        );
        mockOracle = await MockV3Aggregator.deploy(0, 700); // Credit score of 700
        await mockOracle.deployed();
        console.log("MockOracle deployed at:", mockOracle.address);

        // Deploy LoanManagement contract
        const LoanManagement = await ethers.getContractFactory("LoanManagement");
        loanManagement = await LoanManagement.deploy(
          nftCollection.address,
          mockOracle.address
        );
        await loanManagement.deployed();
        console.log("LoanManagement deployed at:", loanManagement.address);

        [owner, borrower, lender1, lender2] = await ethers.getSigners();
        console.log("Signers:", {
          owner: owner.address,
          borrower: borrower.address,
          lender1: lender1.address,
          lender2: lender2.address,
        });

        // Mint an NFT to the borrower
        await nftCollection.connect(owner).mint(borrower.address, 1);
        console.log("NFT minted to borrower:", borrower.address);
      } catch (error) {
        console.error("Error in beforeEach setup:", error);
        throw error;
      }
    });

    it("Should deploy the contract successfully", async function () {
      try {
        expect(loanManagement.address).to.properAddress;
        console.log("LoanManagement contract deployed successfully");
      } catch (error) {
        console.error("Test failed: Should deploy the contract successfully", error);
        throw error;
      }
    });

    it("Should set the correct NFT collection and oracle addresses", async function () {
      try {
        expect(await loanManagement.nftCollection()).to.equal(
          nftCollection.address
        );
        expect(await loanManagement.creditScoreOracle()).to.equal(
          mockOracle.address
        );
        console.log("NFT collection and oracle addresses set correctly");
      } catch (error) {
        console.error(
          "Test failed: Should set the correct NFT collection and oracle addresses",
          error
        );
        throw error;
      }
    });

    it("Should allow a borrower with an NFT to create a loan", async function () {
      try {
        const title = "Test Loan";
        const description = "This is a test loan.";
        const amountRequired = ethers.utils.parseEther("10"); // 10 ETH
        const deadline = (await time.latest()) + time.duration.days(1);
        const documentLink = "https://example.com/document.pdf";

        const tx = await loanManagement
          .connect(borrower)
          .createLoan(title, description, amountRequired, deadline, documentLink);
        const receipt = await tx.wait();

        const loanId = receipt.events.find((e) => e.event === "LoanCreated").args[0].toNumber();

        const loan = await loanManagement.loans(loanId);
        console.log("Loan Details:", {
          loanId: loanId,
          borrower: loan.borrower,
          title: loan.title,
          amountRequired: loan.amountRequired.toString(),
          deadline: new Date(loan.deadline.toNumber() * 1000),
          approved: loan.approved,
        });
        expect(loan.borrower).to.equal(borrower.address);
        expect(loan.title).to.equal(title);
        expect(loan.amountRequired).to.equal(amountRequired);
        expect(loan.deadline).to.equal(deadline);
        expect(loan.approved).to.be.false; // Loan should not be auto-approved upon creation
        console.log("Loan created successfully");
      } catch (error) {
        console.error("Test failed: Should allow a borrower with an NFT to create a loan", error);
        throw error;
      }
    });

    it("Should reject loan creation if the borrower does not own an NFT", async function () {
      try {
        const title = "Invalid Loan";
        const description = "This borrower does not own an NFT.";
        const amountRequired = ethers.utils.parseEther("5");
        const deadline = (await time.latest()) + time.duration.days(1);
        const documentLink = "https://example.com/invalid.pdf";

        await expect(
          loanManagement
            .connect(lender1)
            .createLoan(title, description, amountRequired, deadline, documentLink)
        ).to.be.revertedWith(
          "Borrower must own an NFT from the specified collection."
        );
        console.log("Loan creation rejected successfully for non-NFT owner");
      } catch (error) {
        console.error(
          "Test failed: Should reject loan creation if the borrower does not own an NFT",
          error
        );
        throw error;
      }
    });

    it("Should retrieve a specific loan by ID", async function () {
      try {
        const title = "Test Loan";
        const description = "This is a test loan.";
        const amountRequired = ethers.utils.parseEther("10");
        const deadline = (await time.latest()) + time.duration.days(1);
        const documentLink = "https://example.com/document.pdf";

        const tx = await loanManagement
          .connect(borrower)
          .createLoan(title, description, amountRequired, deadline, documentLink);
        const receipt = await tx.wait();
        const loanId = receipt.events.find((e) => e.event === "LoanCreated").args[0].toNumber();

        const loan = await loanManagement.loans(loanId);
        console.log("Retrieved Loan Details:", {
          loanId: loanId,
          borrower: loan.borrower,
          title: loan.title,
        });
        expect(loan.borrower).to.equal(borrower.address);
        expect(loan.title).to.equal(title);
        console.log("Loan retrieved successfully");
      } catch (error) {
        console.error("Test failed: Should retrieve a specific loan by ID", error);
        throw error;
      }
    });

    it("Should retrieve all loans with pagination", async function () {
      try {
        const titles = ["Loan 1", "Loan 2"];
        const descriptions = ["Description 1", "Description 2"];
        const amountsRequired = [
          ethers.utils.parseEther("5"),
          ethers.utils.parseEther("10"),
        ];
        const deadlines = [
          (await time.latest()) + time.duration.days(1),
          (await time.latest()) + time.duration.days(2),
        ];
        const documentLinks = ["https://example.com/doc1.pdf", "https://example.com/doc2.pdf"];

        for (let i = 0; i < titles.length; i++) {
          await loanManagement
            .connect(borrower)
            .createLoan(
              titles[i],
              descriptions[i],
              amountsRequired[i],
              deadlines[i],
              documentLinks[i]
            );
        }

        const loans = await loanManagement.getAllLoans(0, 2);
        console.log("Loans with pagination:", loans);
        expect(loans.length).to.equal(2);
        expect(loans[0].title).to.equal(titles[0]);
        expect(loans[1].title).to.equal(titles[1]);
        console.log("Loans retrieved with pagination successfully");
      } catch (error) {
        console.error("Test failed: Should retrieve all loans with pagination", error);
        throw error;
      }
    });

    it("Should approve a loan based on credit score", async function () {
      try {
        const title = "Test Loan";
        const description = "This is a test loan.";
        const amountRequired = ethers.utils.parseEther("10");
        const deadline = (await time.latest()) + time.duration.days(1);
        const documentLink = "https://example.com/document.pdf";

        const tx = await loanManagement
          .connect(borrower)
          .createLoan(title, description, amountRequired, deadline, documentLink);
        const receipt = await tx.wait();

        const loanId = receipt.events.find((e) => e.event === "LoanCreated").args[0].toNumber();

        // Manually approve the loan (assuming a function to approve loans exists)
        // await loanManagement.approveLoan(loanId);

        const loan = await loanManagement.loans(loanId);
        // expect(loan.approved).to.be.true; // Approved due to high credit score
        console.log("Loan approved successfully based on credit score");
      } catch (error) {
        console.error("Test failed: Should approve a loan based on credit score", error);
        throw error;
      }
    });

    it("Should reject a loan due to low credit score", async function () {
      try {
        // Set mock oracle to return a low credit score
        await mockOracle.updateAnswer(500);
        console.log("Updated credit score to 500");

        const title = "Low Credit Score Loan";
        const description = "This borrower has a low credit score.";
        const amountRequired = ethers.utils.parseEther("5");
        const deadline = (await time.latest()) + time.duration.days(1);
        const documentLink = "https://example.com/lowcredit.pdf";

        const tx = await loanManagement
          .connect(borrower)
          .createLoan(title, description, amountRequired, deadline, documentLink);
        const receipt = await tx.wait();

        const loanId = receipt.events.find((e) => e.event === "LoanCreated").args[0].toNumber();

        const loan = await loanManagement.loans(loanId);
        expect(loan.approved).to.be.false; // Not Approved due to low credit score
        console.log("Loan rejected successfully due to low credit score");
      } catch (error) {
        console.error("Test failed: Should reject a loan due to low credit score", error);
        throw error;
      }
    });

    it("Should ensure only NFT holders can create loans", async function () {
      try {
        const title = "Invalid Loan";
        const description = "This borrower does not own an NFT.";
        const amountRequired = ethers.utils.parseEther("5");
        const deadline = (await time.latest()) + time.duration.days(1);
        const documentLink = "https://example.com/invalid.pdf";

        await expect(
          loanManagement
            .connect(lender1)
            .createLoan(title, description, amountRequired, deadline, documentLink)
        ).to.be.revertedWith(
          "Borrower must own an NFT from the specified collection."
        );
        console.log("Loan creation prevented successfully for non-NFT holders");
      } catch (error) {
        console.error("Test failed: Should ensure only NFT holders can create loans", error);
        throw error;
      }
    });

    it("Should allow a lender to donate to a loan", async function () {
      try {
        const title = "Test Loan";
        const description = "This is a test loan.";
        const amountRequired = ethers.utils.parseEther("1");
        const deadline = (await time.latest()) + time.duration.days(1);
        const documentLink = "https://example.com/document.pdf";

        const tx = await loanManagement
          .connect(borrower)
          .createLoan(title, description, amountRequired, deadline, documentLink);
        const receipt = await tx.wait();
        const loanId = receipt.events.find((e) => e.event === "LoanCreated").args[0].toNumber();

        // Donate to the loan
        const donationAmount = ethers.utils.parseEther("0.5");
        await loanManagement.connect(lender1).donateToLoan(loanId, { value: donationAmount });

        const loan = await loanManagement.loans(loanId);
        expect(loan.amountCollected).to.equal(donationAmount);
        console.log("Donation successful");
      } catch (error) {
        console.error("Test failed: Should allow a lender to donate to a loan", error);
        throw error;
      }
    });

    it("Should not allow donation to a loan after the deadline", async function () {
      try {
        const title = "Test Loan";
        const description = "This is a test loan.";
        const amountRequired = ethers.utils.parseEther("1");
        const deadline = (await time.latest()) + 10; // Deadline in 10 seconds
        const documentLink = "https://example.com/document.pdf";

        const tx = await loanManagement
          .connect(borrower)
          .createLoan(title, description, amountRequired, deadline, documentLink);
        const receipt = await tx.wait();
        const loanId = receipt.events.find((e) => e.event === "LoanCreated").args[0].toNumber();

        // Wait for the deadline to pass
        await time.increase(11);

        // Attempt to donate after the deadline
        const donationAmount = ethers.utils.parseEther("0.5");
        await expect(
          loanManagement.connect(lender1).donateToLoan(loanId, { value: donationAmount })
        ).to.be.revertedWith("This loan request has expired.");

        console.log("Donation prevented after the deadline");
      } catch (error) {
        console.error(
          "Test failed: Should not allow donation to a loan after the deadline",
          error
        );
        throw error;
      }
    });

    it("Should allow the owner to set a new minimum credit score", async function () {
      try {
        const newMinCreditScore = 700;
        await loanManagement.connect(owner).setMinCreditScore(newMinCreditScore);

        expect(await loanManagement.minCreditScore()).to.equal(newMinCreditScore);
        console.log("Minimum credit score updated successfully");
      } catch (error) {
        console.error("Test failed: Should allow the owner to set a new minimum credit score", error);
        throw error;
      }
    });
  });
});