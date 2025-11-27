import { Schema, model, Document } from "mongoose";

export type TraceData = {
  timestamp: number;
  open: number;
  close: number;
  max: number;
  min: number;
  buyVolSol: number;
  sellVolSol: number;
  jumpBuyCnt: number;
  jumpSellCnt: number;
};

export type BundleData = {
  blockTime: number;
  slotNumber: number;
  bundleSize: number;
  totalBuySol: number;
  users: string[];
  buySolAmt: number[];
}

export type TradeData = {
  blockTime: number;
  slotNumber: number;
  user: string;
  isBuy: boolean;
  tokenAmount: number;
  solAmount: number;
  program: string;
  feeReceiver: string;
  vToken: number;
  vSol: number;
  ixnOrder: string;
}

export interface ITokenInfo {
  mint: string;
  mintTime: number;
  mintSlot: number;
  firstSlotNumber: number;
  traces: TraceData[];
  trades: TradeData[];
  mintBuyAmt: number;
  maxSol: number;
  maxPrice: number;
  migrated: boolean;
  migrateTime: number;
  migrateSlot: number;
  mintSlotSol: number;
  firstSlotSol: number;
  postMintBundle: BundleData;
  preMigBundle: BundleData;
  mintPattern: string;
  tracesLen?: number;
  tradesLen?: number;
  unitPrice?: number;
  unitLimit?: number;
  maxTime: number;
  txnVersion?: number;
  extended?: boolean;
  jito?: number;
  bloxRoute?: number;
  photon?: number;
  lookupTable?: boolean;
  nextBlock?: number;
  slot0?: number;
  axiom?: number;
}

export interface IDBTokenInfo {
  mint: string;
  mintTime: number;
  mintSlot: number;
  firstSlotNumber: number;
  migrateSlot: number;
  mintSlotSol: number;
  firstSlotSol: number;
  postMintBundle: BundleData;
  preMigBundle: BundleData;
  mintBuyAmt: number;
  maxSol: number;
  maxPrice: number;
  migrated: boolean;
  mintPattern: string;
  migrateTime: number;
  tracesLen?: number;
  tradesLen?: number;
  unitPrice?: number;
  unitLimit?: number;
  txnVersion?: number;
  extended?: boolean;
  jito?: number;
  bloxRoute?: number;
  photon?: number;
  lookupTable?: boolean;
  nextBlock?: number;
  slot0?: number;
  axiom?: number;
  maxTime: number;
}

export interface ITokenInfoDocument extends IDBTokenInfo, Document {
  createdAt: Date;
  updatedAt: Date;
}

const TokenInfoSchema = new Schema<ITokenInfoDocument>(
  {
    mint: { type: String, required: true, unique: true, index: true },
    mintTime: { type: Number, required: true },
    // Slot and migration details
    migrateSlot: { type: Number, default: 0 },
    mintSlot: { type: Number, default: 0 },
    firstSlotNumber: { type: Number, default: 0 },
    mintSlotSol: { type: Number, default: 0 },
    firstSlotSol: { type: Number, default: 0 },
    tracesLen: { type: Number, default: 0 },
    tradesLen: { type: Number, default: 0 },
    mintBuyAmt: { type: Number, default: 0 },
    maxSol: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 0 },
    migrated: { type: Boolean, default: false },
    migrateTime: { type: Number, default: 0 },
    mintPattern: { type: String, default: "" },
    // Bundles stored as a compact summary document
    postMintBundle: {
      blockTime: { type: Number, default: 0 },
      slotNumber: { type: Number, default: 0 },
      bundleSize: { type: Number, default: 0 },
      totalBuySol: { type: Number, default: 0 },
      users: { type: [String], default: [] },
      buySolAmt: { type: [Number], default: [] },
    },
    preMigBundle: {
      blockTime: { type: Number, default: 0 },
      slotNumber: { type: Number, default: 0 },
      bundleSize: { type: Number, default: 0 },
      totalBuySol: { type: Number, default: 0 },
      users: { type: [String], default: [] },
      buySolAmt: { type: [Number], default: [] },
    },
    unitPrice: { type: Number, default: 0 },
    unitLimit: { type: Number, default: 0 },
    txnVersion: { type: Number, default: 0 },
    extended: { type: Boolean, default: false },
    jito: { type: Number, default: 0 },
    bloxRoute: { type: Number, default: 0 },
    photon: { type: Number, default: 0 },
    lookupTable: { type: Boolean, default: false },
    nextBlock: { type: Number, default: 0 },
    slot0: { type: Number, default: 0 },
    axiom: { type: Number, default: 0 },
    maxTime: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
TokenInfoSchema.index({ mintTime: -1 });
TokenInfoSchema.index({ createdAt: -1 });
TokenInfoSchema.index({ maxSol: -1 });
TokenInfoSchema.index({ mintPattern: 1 });
TokenInfoSchema.index({ extended: 1 });

export const TokenInfoModel = model<ITokenInfoDocument>(
  "TokenInfo",
  TokenInfoSchema
);
