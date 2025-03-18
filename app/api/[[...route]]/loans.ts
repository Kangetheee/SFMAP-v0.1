<<<<<<< HEAD
import { createThirdwebClient,  } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";



// Replace this with your client ID string
// refer to https://portal.thirdweb.com/typescript/v5/client on how to get a client ID
const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;

if (!clientId) {
  throw new Error("No client ID provided");
}

export const client = createThirdwebClient({
  clientId: clientId,
});
=======
// using third web sdk we're trying to build routes for 
    // getAllLoans
    // getLoan
    // createLoan
    // updateLoan
    // donateToLoan
    // getLenders
    // loans
    // minCreditScore
    // nftCollection
    // numberOfLoans
// this routes will be used in the frontend to interact with the smart contract
// the routes should also update db with the latest data from the smart contract
// the routes should also be able to interact with the smart contract
import { z } from "zod";
import { Hono } from "hono";
import { parse } from "date-fns";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ethers } from "ethers";

import db from "@/db/drizzle";
import { 
  loans, 
  insertLoanSchema, 
  users, 
  loanDonations, 
  systemSettings,
  loanEvents,
} from "@/db/schema";

// Initialize thirdweb SDK
const initializeSDK = async () => {
  // Get contract address from system settings
  const [settings] = await db
    .select({
      contractAddress: systemSettings.contractAddress,
    })
    .from(systemSettings)
    .limit(1);

  if (!settings) {
    throw new Error("System settings not found");
  }

  // Initialize provider - you might need to configure this based on your setup
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const sdk = ThirdwebSDK.fromProvider(provider);
  
  // Get contract instance
  const contract = await sdk.getContract(settings.contractAddress);
  
  return { sdk, contract };
};

const app = new Hono()
  .get(
    "/",
    zValidator(
      "query", 
      z.object({
        start: z.string().optional(),
        count: z.string().optional(),
        borrowerId: z.string().optional(),
        status: z.string().optional(),
      })
    ),
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);
      const { start, count, borrowerId, status } = c.req.valid("query");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Query from database
      const data = await db
        .select({
          id: loans.id,
          loanId: loans.loanId,
          title: loans.title,
          description: loans.description,
          amountRequired: loans.amountRequired,
          deadline: loans.deadline,
          amountCollected: loans.amountCollected,
          documentLink: loans.documentLink,
          approved: loans.approved,
          createdAt: loans.createdAt,
          status: loans.status,
          borrowerAddress: users.address,
          borrowerId: loans.borrowerId,
        })
        .from(loans)
        .innerJoin(users, eq(loans.borrowerId, users.id))
        .where(
          and(
            borrowerId ? eq(loans.borrowerId, borrowerId) : undefined,
            status ? eq(loans.status, status) : undefined,
          )
        )
        .orderBy(desc(loans.createdAt))
        .limit(count ? parseInt(count) : 10)
        .offset(start ? parseInt(start) : 0);

      return c.json({ data });
    }
  )
  .get(
    "/:id",
    zValidator("param", z.object({
      id: z.string(),
    })),
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [data] = await db
        .select({
          id: loans.id,
          loanId: loans.loanId,
          title: loans.title,
          description: loans.description,
          amountRequired: loans.amountRequired,
          deadline: loans.deadline,
          amountCollected: loans.amountCollected,
          documentLink: loans.documentLink,
          approved: loans.approved,
          createdAt: loans.createdAt,
          status: loans.status,
          borrowerId: loans.borrowerId,
          borrowerAddress: users.address,
        })
        .from(loans)
        .innerJoin(users, eq(loans.borrowerId, users.id))
        .where(eq(loans.id, id));

      if (!data) {
        return c.json({ error: "Not Found" }, 404);
      }

      return c.json({ data });
    }
  )
  .get(
    "/:id/lenders",
    zValidator("param", z.object({
      id: z.string(),
    })),
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get loan from database
      const [loan] = await db
        .select({
          id: loans.id,
          loanId: loans.loanId,
        })
        .from(loans)
        .where(eq(loans.id, id));

      if (!loan) {
        return c.json({ error: "Loan not found" }, 404);
      }

      // Get lenders from database
      const lenders = await db
        .select({
          id: loanDonations.id,
          lenderId: loanDonations.lenderId,
          amount: loanDonations.amount,
          createdAt: loanDonations.createdAt,
          transactionHash: loanDonations.transactionHash,
          lenderAddress: users.address,
        })
        .from(loanDonations)
        .innerJoin(users, eq(loanDonations.lenderId, users.id))
        .where(eq(loanDonations.loanId, loan.id))
        .orderBy(desc(loanDonations.createdAt));

      // Also fetch on-chain data for verification
      try {
        const { contract } = await initializeSDK();
        const onChainLenders = await contract.call("getLenders", [loan.loanId]);
        
        return c.json({ 
          data: {
            dbLenders: lenders,
            onChainLenders: {
              addresses: onChainLenders[0],
              amounts: onChainLenders[1],
            }
          }
        });
      } catch (error) {
        console.error("Error fetching on-chain lenders:", error);
        return c.json({ data: { dbLenders: lenders } });
      }
    }
  )
  .get(
    "/contract-info",
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        const { contract } = await initializeSDK();
        
        // Fetch contract information
        const minCreditScore = await contract.call("minCreditScore");
        const nftCollection = await contract.call("nftCollection");
        const numberOfLoans = await contract.call("numberOfLoans");
        
        return c.json({ 
          data: {
            minCreditScore: Number(minCreditScore),
            nftCollection,
            numberOfLoans: Number(numberOfLoans),
          }
        });
      } catch (error) {
        console.error("Error fetching contract info:", error);
        return c.json({ error: "Failed to fetch contract information" }, 500);
      }
    }
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator(
      "json", 
      z.object({
        title: z.string(),
        description: z.string(),
        amountRequired: z.number().int().positive(),
        deadline: z.string(), // ISO date string
        documentLink: z.string(),
        walletAddress: z.string(), // The address to use for the transaction
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Find user by Clerk ID
      const [user] = await db
        .select({
          id: users.id,
          address: users.address,
          walletAddress: users.walletAddress,
        })
        .from(users)
        .where(eq(users.id, auth.userId));

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      try {
        // Initialize SDK with signer
        const { sdk, contract } = await initializeSDK();
        
        // Convert the deadline to Unix timestamp
        const deadlineDate = new Date(values.deadline);
        const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);
        
        // Prepare transaction
        const tx = await contract.prepare(
          "createLoan",
          [
            values.title,
            values.description,
            ethers.utils.parseEther(values.amountRequired.toString()),
            deadlineTimestamp,
            values.documentLink
          ],
          { from: values.walletAddress }
        );
        
        // Return the prepared transaction for the frontend to sign and send
        return c.json({ 
          transaction: {
            to: tx.to,
            data: tx.data,
            value: tx.value,
          },
          insertData: {
            title: values.title,
            description: values.description,
            amountRequired: values.amountRequired,
            deadline: deadlineDate,
            documentLink: values.documentLink,
            borrowerId: user.id,
          }
        });
      } catch (error) {
        console.error("Error preparing transaction:", error);
        return c.json({ error: "Failed to prepare transaction" }, 500);
      }
    }
  )
  .post(
    "/confirm-creation",
    clerkMiddleware(),
    zValidator(
      "json",
      z.object({
        transactionHash: z.string(),
        loanId: z.number().int(),
        title: z.string(),
        description: z.string(),
        amountRequired: z.number().int().positive(),
        deadline: z.string(),
        documentLink: z.string(),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Insert the loan into the database
      const [data] = await db.insert(loans).values({
        id: createId(),
        loanId: values.loanId,
        borrowerId: auth.userId,
        title: values.title,
        description: values.description,
        amountRequired: values.amountRequired,
        deadline: new Date(values.deadline),
        documentLink: values.documentLink,
        approved: false, // Will be updated when we process the event
        status: "pending",
      }).returning();

      // Record the event
      await db.insert(loanEvents).values({
        id: createId(),
        eventType: "LoanCreated",
        loanId: data.id,
        transactionHash: values.transactionHash,
        blockNumber: 0, // Will be updated when we process the event
        fromAddress: "", // Will be updated when we process the event
        data: JSON.stringify(values),
        createdAt: new Date(),
      });

      return c.json({ data });
    }
  )
  .post(
    "/:id/donate",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    zValidator(
      "json",
      z.object({
        amount: z.number().positive(),
        walletAddress: z.string(),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get loan from database
      const [loan] = await db
        .select({
          id: loans.id,
          loanId: loans.loanId,
        })
        .from(loans)
        .where(eq(loans.id, id));

      if (!loan) {
        return c.json({ error: "Loan not found" }, 404);
      }

      try {
        // Initialize SDK
        const { contract } = await initializeSDK();
        
        // Prepare transaction
        const tx = await contract.prepare(
          "donateToLoan",
          [loan.loanId],
          { 
            value: ethers.utils.parseEther(values.amount.toString()),
            from: values.walletAddress,
          }
        );
        
        // Return the prepared transaction for the frontend to sign and send
        return c.json({ 
          transaction: {
            to: tx.to,
            data: tx.data,
            value: tx.value,
          },
          loanId: loan.id,
        });
      } catch (error) {
        console.error("Error preparing donation transaction:", error);
        return c.json({ error: "Failed to prepare transaction" }, 500);
      }
    }
  )
  .post(
    "/confirm-donation",
    clerkMiddleware(),
    zValidator(
      "json",
      z.object({
        loanId: z.string(),
        amount: z.number().positive(),
        transactionHash: z.string(),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get loan from database
      const [loan] = await db
        .select({
          id: loans.id,
          amountCollected: loans.amountCollected,
        })
        .from(loans)
        .where(eq(loans.id, values.loanId));

      if (!loan) {
        return c.json({ error: "Loan not found" }, 404);
      }

      // Record the donation
      const [donation] = await db.insert(loanDonations).values({
        id: createId(),
        loanId: values.loanId,
        lenderId: auth.userId,
        amount: values.amount,
        transactionHash: values.transactionHash,
        createdAt: new Date(),
      }).returning();

      // Update the loan's amountCollected
      await db
        .update(loans)
        .set({
          amountCollected: loan.amountCollected + values.amount,
        })
        .where(eq(loans.id, values.loanId));

      // Record the event
      await db.insert(loanEvents).values({
        id: createId(),
        eventType: "DonatedToLoan",
        loanId: values.loanId,
        transactionHash: values.transactionHash,
        blockNumber: 0, // Will be updated when we process the event
        fromAddress: "", // Will be updated when we process the event
        toAddress: "", // Will be updated when we process the event
        amount: values.amount,
        createdAt: new Date(),
      });

      return c.json({ data: donation });
    }
  )
  .patch(
    "/:id/status",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string(),
      })
    ),
    zValidator(
      "json",
      z.object({
        status: z.enum(["pending", "active", "completed", "expired"]),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get loan from database to check if user is the borrower
      const [loan] = await db
        .select({
          id: loans.id,
          borrowerId: loans.borrowerId,
        })
        .from(loans)
        .where(eq(loans.id, id));

      if (!loan) {
        return c.json({ error: "Loan not found" }, 404);
      }

      // Only allow borrower or admin to update status
      if (loan.borrowerId !== auth.userId) {
        // Here you would check if the user is an admin
        // For now just return unauthorized
        return c.json({ error: "Unauthorized to update this loan" }, 403);
      }

      // Update the loan status
      const [data] = await db
        .update(loans)
        .set({
          status: values.status,
        })
        .where(eq(loans.id, id))
        .returning();

      return c.json({ data });
    }
  )
  .get(
    "/sync",
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        const { contract } = await initializeSDK();
        
        // Get the total number of loans from the contract
        const numberOfLoans = await contract.call("numberOfLoans");
        
        // Define the batch size for fetching loans
        const batchSize = 10;
        let syncedCount = 0;
        
        // Fetch loans in batches
        for (let i = 0; i < numberOfLoans; i += batchSize) {
          const end = Math.min(i + batchSize, numberOfLoans);
          const onChainLoans = await contract.call("getAllLoans", [i, end - i]);
          
          // Process each loan
          for (let j = 0; j < onChainLoans.length; j++) {
            const loanIndex = i + j;
            const onChainLoan = onChainLoans[j];
            
            // Check if loan exists in database
            const [existingLoan] = await db
              .select({
                id: loans.id,
              })
              .from(loans)
              .where(eq(loans.loanId, loanIndex));
            
            if (!existingLoan) {
              // Find or create user for borrower
              let borrowerId = '';
              const [existingUser] = await db
                .select({
                  id: users.id,
                })
                .from(users)
                .where(eq(users.walletAddress, onChainLoan.borrower));
              
              if (existingUser) {
                borrowerId = existingUser.id;
              } else {
                // Create a new user for this borrower
                const [newUser] = await db
                  .insert(users)
                  .values({
                    id: createId(),
                    address: onChainLoan.borrower, // Using wallet address as temporary address
                    walletAddress: onChainLoan.borrower,
                    createdAt: new Date(),
                  })
                  .returning();
                borrowerId = newUser.id;
              }
              
              // Create the loan in the database
              await db
                .insert(loans)
                .values({
                  id: createId(),
                  loanId: loanIndex,
                  borrowerId: borrowerId,
                  title: onChainLoan.title,
                  description: onChainLoan.description,
                  amountRequired: parseInt(ethers.utils.formatEther(onChainLoan.amountRequired) || "0"),
                  deadline: new Date(parseInt(onChainLoan.deadline.toString()) * 1000),
                  amountCollected: parseInt(ethers.utils.formatEther(onChainLoan.amountCollected) || "0"),
                  documentLink: onChainLoan.documentLink,
                  approved: onChainLoan.approved,
                  status: Date.now() > parseInt(onChainLoan.deadline.toString()) * 1000 ? "expired" : 
                          parseInt(onChainLoan.amountCollected.toString()) >= parseInt(onChainLoan.amountRequired.toString()) ? "completed" : "active",
                  createdAt: new Date(),
                });
              
              syncedCount++;
            } else {
              // Update existing loan
              await db
                .update(loans)
                .set({
                  amountCollected: parseInt(ethers.utils.formatEther(onChainLoan.amountCollected) || "0"),
                  approved: onChainLoan.approved,
                  status: Date.now() > parseInt(onChainLoan.deadline.toString()) * 1000 ? "expired" : 
                          parseInt(onChainLoan.amountCollected.toString()) >= parseInt(onChainLoan.amountRequired.toString()) ? "completed" : "active",
                })
                .where(eq(loans.loanId, loanIndex));
            }
          }
        }
        
        return c.json({ 
          success: true, 
          data: { 
            totalOnChain: Number(numberOfLoans), 
            syncedCount 
          } 
        });
      } catch (error) {
        console.error("Error syncing loans:", error);
        return c.json({ error: "Failed to sync loans from blockchain" }, 500);
      }
    }
  );

export default app;
>>>>>>> 96fcce8914b5c267ae71ff1f62cb3deea8b11efb
