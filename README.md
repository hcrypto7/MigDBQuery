# MongoDB Token Query Project

A TypeScript-based project for querying Solana token data from MongoDB using Mongoose.

## Features

- 🔌 MongoDB connection management with Mongoose
- 🪙 Solana token data model with comprehensive fields
- 🔍 Comprehensive query service for token analysis
- 📈 Aggregation queries for statistics and analytics
- ⚡ MEV service tracking (Jito, BloxRoute, Photon, Axiom)
- 🎨 Mint pattern analysis
- 💰 Liquidity and price tracking

## Project Structure

```
DBQuery/
├── src/
│   ├── config/
│   │   └── database.config.ts     # Database configuration
│   ├── database/
│   │   └── connection.ts          # MongoDB connection handler
│   ├── models/
│   │   └── Token.model.ts         # Token schema and types
│   ├── services/
│   │   └── query.service.ts       # Query methods
│   └── app.ts                     # Main application
├── .env                           # Environment variables
├── package.json
└── tsconfig.json
```

## Token Model Fields

The token model includes the following fields:
- `mint` - Token mint address (unique identifier)
- `mintTime`, `mintSlot` - Minting timestamp and slot
- `firstSlotNumber`, `firstSlotSol` - First slot data
- `maxSol`, `maxPrice` - Maximum liquidity and price
- `mintBuyAmt` - Initial buy amount
- `mintPattern` - Mint pattern string
- `extended` - Extended token flag
- `lookupTable` - Lookup table usage flag
- `txnVersion` - Transaction version (0 or 1)
- `unitPrice`, `unitLimit` - Compute unit configuration
- MEV service flags: `jito`, `bloxRoute`, `photon`, `axiom`
- `postMintBundle`, `preMigBundle` - Bundle data structures
- `migrateTime`, `migrateSlot` - Migration data
- `tracesLen`, `tradesLen` - Data array lengths
- Timestamps: `createdAt`, `updatedAt`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure MongoDB connection in `.env`:
```
MONGO_URI=mongodb://localhost:27017/yourdb
```

3. Run the project:
```bash
npm run dev
```

## Available Queries

### Token Queries
- `findRecentTokens(days)` - Get tokens from last N days
- `findTokenByMint(mint)` - Find token by mint address
- `findHighLiquidityTokens(minMaxSol)` - Find tokens with high liquidity
- `findExtendedTokens()` - Find extended tokens
- `getTopPriceTokens(limit)` - Get tokens with highest prices
- `countTotalTokens()` - Count total tokens in database
- `getLatestToken()` - Get the most recently created token

### Statistics & Analytics
- `getTokenOverview()` - Get comprehensive token statistics
- `getTokenStatsByMEVService()` - Get MEV service usage stats
- `getPatternFrequency(limit)` - Analyze mint pattern frequency

## Example Token Data

```json
{
  "mint": "Gxb9FDeugEH9AWX91KWza23GKm2zXmLRCGNJgpQgpump",
  "mintTime": 1762286839,
  "mintSlot": 377934954,
  "maxSol": 3,
  "maxPrice": 0.000033830382106244154,
  "extended": true,
  "txnVersion": 1,
  "mintPattern": "stclcppcsct2sct2stscsis3mp...",
  "unitLimit": 250000,
  "unitPrice": 1000000
}
```

## Build

```bash
npm run build
```

## Start Production

```bash
npm start
```
