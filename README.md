# MongoDB Token Query Project

A TypeScript-based project for querying and analyzing Solana token data from MongoDB using Mongoose.

## ✨ New: Token Migration Analysis

**Analyze token publisher groups and their migration success rates!**

```bash
# Run comprehensive interactive analysis
npm run analyze

# See detailed examples
npm run example:migration
```

This project now includes powerful tools to:
- 📊 Group tokens by mint pattern, pricing, limits, and bundle characteristics
- 🎯 Calculate migration rates for each token group
- 💰 Identify the most profitable token publisher configurations
- 📈 Track performance trends over time
- 🔍 Deep-dive into specific token patterns

**[→ Quick Start Guide](QUICK_START.md)** | **[→ Full Documentation](MIGRATION_ANALYSIS.md)**

## Features

- 🔌 MongoDB connection management with Mongoose
- 🪙 Solana token data model with comprehensive fields
- 🔍 Advanced query service for token analysis
- 📊 **Token migration rate analysis by publisher groups**
- 🎯 **Publisher pattern and strategy analytics**
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
│   │   └── query.service.ts       # Query methods & migration analysis
│   ├── utils/
│   │   └── common-queries.ts      # Pre-built query patterns
│   ├── examples/
│   │   └── migration-analysis.ts  # Detailed examples
│   ├── scripts/
│   │   └── analyze-migrations.ts  # Interactive CLI
│   └── app.ts                     # Main application
├── .env                           # Environment variables
├── QUICK_START.md                 # Quick reference guide
├── MIGRATION_ANALYSIS.md          # Detailed documentation
├── package.json
└── tsconfig.json
```

## Token Model Fields

The token model includes the following fields:
- `mint` - Token mint address (unique identifier)
- `mintTime`, `mintSlot` - Minting timestamp and slot
- `migrated` - **Migration status (true/false)**
- `migrateTime`, `migrateSlot` - **Migration timestamp and slot**
- `firstSlotNumber`, `firstSlotSol` - First slot data
- `maxSol`, `maxPrice` - Maximum liquidity and price
- `mintBuyAmt` - Initial buy amount
- `mintPattern` - Mint pattern string
- `unitPrice`, `unitLimit` - **Compute unit configuration (grouping keys)**
- `postMintBundle`, `preMigBundle` - **Bundle data structures**
- `extended` - Extended token flag
- `lookupTable` - Lookup table usage flag
- `txnVersion` - Transaction version (0 or 1)
- MEV service flags: `jito`, `bloxRoute`, `photon`, `axiom`
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
# Basic analysis
npm run dev

# Interactive comprehensive analysis
npm run analyze

# Detailed examples
npm run example:migration
```

## Quick Migration Analysis Example

```typescript
import { QueryService } from './services/query.service';

const queryService = new QueryService();

// Find top migrating token groups
const topGroups = await queryService.getTopMigratingGroups(
  {
    mintPattern: true,
    unitPrice: true
  },
  {
    minMaxSol: 1  // Only profitable tokens
  },
  10
);

topGroups.forEach(group => {
  console.log(`${group.groupKey}`);
  console.log(`Migration Rate: ${group.migrationRate}%`);
  console.log(`Tokens: ${group.totalTokens}`);
  console.log(`Avg SOL: ${group.avgMaxSol}`);
});
```

## Available Queries

### Migration Analysis (NEW!)
- `fetchProfitableTokenGroupsWithMigration()` - Group tokens and calculate migration rates
- `fetchTokenGroupsByKey()` - Quick single-key grouping
- `getTopMigratingGroups()` - Get highest performing groups
- `getGroupingSummary()` - Overall statistics

### Common Query Patterns (NEW!)
Pre-built queries in `CommonQueries` class:
- `getMostSuccessfulMintPatterns()` - Best performing patterns
- `analyzePricingStrategies()` - Optimal pricing analysis
- `getRecentHighPerformers()` - Recent success tracking
- `getConsistentPerformers()` - Reliable token groups
- `compareTimePeriods()` - Trend analysis
- [See full list in documentation](MIGRATION_ANALYSIS.md)

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

## Understanding Migration Rates

**Migration Rate** = (Migrated Tokens / Total Tokens) × 100%

- Tokens are grouped by configurable keys (mint pattern, price, limits, bundles)
- Each group's migration success rate is calculated
- Higher rates indicate more successful token publisher configurations
- Use this to identify optimal publishing strategies

## Example Analysis Output

```
🏆 TOP MINT PATTERNS (by Migration Rate)

#1 pattern:standard-v2|price:0.001
   Migration Rate:  84.44% (38/45)
   Avg Max SOL:     5.2134
   Total Max SOL:   234.603

#2 pattern:custom-mint|price:0.002
   Migration Rate:  70.08% (89/127)
   Avg Max SOL:     3.4521
   Total Max SOL:   438.417
```

## Build

```bash
npm run build
```

## Start Production

```bash
npm start
```

## Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get started in 5 minutes
- **[Migration Analysis Guide](MIGRATION_ANALYSIS.md)** - Complete documentation
- **Examples** - See `src/examples/` and `src/scripts/`

## Use Cases

1. **Token Publisher Optimization** - Find what configurations lead to successful migrations
2. **Pattern Recognition** - Identify successful mint patterns and strategies
3. **Performance Tracking** - Monitor token group performance over time
4. **Strategy Planning** - Use historical data to plan future token launches
5. **Risk Assessment** - Understand success rates for different configurations
