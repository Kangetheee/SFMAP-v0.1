import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import {
  integer,
  pgTable,
  text,
  timestamp,
  primaryKey,
  boolean,
  bigint,
  doublePrecision,
  uniqueIndex,
  index,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Accounts Table
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  plaidId: text("plaid_id"),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

export const insertAccountSchema = createInsertSchema(accounts);

// Categories Table
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  plaidId: text("plaid_id"),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const insertCategorySchema = createInsertSchema(categories);

// Transactions Table
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  amount: integer("amount").notNull(),
  payee: text("payee").notNull(),
  notes: text("notes"),
  date: timestamp("date", { mode: "date" }).notNull(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const insertTransactionSchema = createInsertSchema(transactions, {
  date: z.coerce.date(),
});

// Users Table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  address: text("address").notNull().unique(),
  walletAddress: text("wallet_address").notNull(),
  nftBalance: integer("nft_balance").default(0),
  createdAt: timestamp("created_at", { mode: "date" })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  loans: many(loans),
  donations: many(loanDonations),
}));

export const insertUserSchema = createInsertSchema(users);

// Loans Table
export const loans = pgTable("loans", {
  id: text("id").primaryKey(),
  contractLoanId: integer("contract_loan_id").notNull(),
  borrower: text("borrower").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  amountRequired: integer("amount_required").notNull(),
  deadline: timestamp("deadline", { mode: "date" }).notNull(),
  amountCollected: integer("amount_collected").notNull().default(0),
  documentLink: text("document_link").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const loansRelations = relations(loans, ({ one, many }) => ({
  user: one(users, {
    fields: [loans.userId],
    references: [users.id],
  }),
  loanDonations: many(loanDonations),
}));

export const insertLoanSchema = createInsertSchema(loans, {
  deadline: z.coerce.date(),
});

// Loan Donations Table
export const loanDonations = pgTable("loan_donations", {
  id: text("id").primaryKey(),
  loanId: text("loan_id")
    .notNull()
    .references(() => loans.id, { onDelete: "cascade" }),
  lender: text("lender").notNull(),
  amount: integer("amount").notNull(),
  txHash: text("tx_hash").notNull(),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

export const loanDonationsRelations = relations(loanDonations, ({ one }) => ({
  loan: one(loans, {
    fields: [loanDonations.loanId],
    references: [loans.id],
  }),
}));

export const insertLoanDonationSchema = createInsertSchema(loanDonations);

// Credit Score History Table
export const creditScores = pgTable("credit_scores", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  timestamp: timestamp("timestamp", { mode: "date" })
    .notNull()
    .defaultNow(),
});

export const insertCreditScoreSchema = createInsertSchema(creditScores);

// NFT Ownership Table
export const nftOwnership = pgTable("nft_ownership", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nftContract: text("nft_contract").notNull(),
  tokenId: integer("token_id").notNull(),
  acquired: timestamp("acquired", { mode: "date" })
    .notNull()
    .defaultNow(),
});

export const insertNftOwnershipSchema = createInsertSchema(nftOwnership);

// Loan Events Table
export const loanEvents = pgTable("loan_events", {
  id: text("id").primaryKey(),
  loanId: text("loan_id")
    .notNull()
    .references(() => loans.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // LoanCreated, DonatedToLoan, LoanFunded
  txHash: text("tx_hash").notNull(),
  blockNumber: integer("block_number").notNull(),
  data: text("data").notNull(), // JSON stringified event data
  timestamp: timestamp("timestamp", { mode: "date" })
    .notNull()
    .defaultNow(),
});

export const insertLoanEventSchema = createInsertSchema(loanEvents);