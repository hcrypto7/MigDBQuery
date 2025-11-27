# Token Migration Analysis Guide

This guide explains how to analyze token groups and their migration rates using the QueryService.

## Overview

The migration analysis system allows you to:
- Group tokens by various characteristics (mint pattern, unit price, unit limit, post-mint bundle)
- Calculate migration rates for each group
- Identify the most profitable token publisher groups
- Track which token groups have the highest migration success rates

## Key Concepts

### Token Grouping
Tokens can be grouped by one or more of the following keys:
- **mintPattern**: The pattern used for minting tokens
- **unitPrice**: The price per unit of the token
- **unitLimit**: The limit on units that can be minted
- **postMintBundle**: Bundle characteristics after minting (size, total buy SOL)

### Migration Rate
The migration rate is calculated as:
```
Migration Rate = (Number of Migrated Tokens / Total Tokens in Group) × 100%
```

A token is considered migrated when `migrated: true` in the database.

### Profitability
Tokens are considered profitable when they meet the `minMaxSol` threshold you specify (e.g., `maxSol >= 1`).

## Usage Examples

### 1. Basic Query: Group by Single Key

```typescript
import { QueryService } from './services/query.service';

const queryService = new QueryService();

// Group by mint pattern only
const groups = await queryService.fetchTokenGroupsByKey('mintPattern', {
  minMaxSol: 1 // Only tokens with maxSol >= 1
});

groups.forEach(group => {
  console.log(`Pattern: ${group.groupKey}`);
  console.log(`Migration Rate: ${group.migrationRate}%`);
  console.log(`Total Tokens: ${group.totalTokens}`);
});
```

### 2. Advanced Query: Group by Multiple Keys

```typescript
// Group by mint pattern + unit price + unit limit
const multiKeyGroups = await queryService.fetchProfitableTokenGroupsWithMigration(
  {
    mintPattern: true,
    unitPrice: true,
    unitLimit: true
  },
  {
    minMaxSol: 2,
    startTime: Date.now() / 1000 - 86400 * 7 // Last 7 days
  }
);
```

### 3. Filter by Time Range

```typescript
const recentGroups = await queryService.fetchTokenGroupsByKey('mintPattern', {
  minMaxSol: 1,
  startTime: Date.now() / 1000 - 86400 * 7, // Last 7 days
  endTime: Date.now() / 1000
});
```

### 4. Get Top Migrating Groups

```typescript
// Get top 10 groups with highest migration rates
// Only includes groups with at least 2 tokens
const topGroups = await queryService.getTopMigratingGroups(
  {
    mintPattern: true,
    unitPrice: true
  },
  {
    minMaxSol: 1
  },
  10 // limit to top 10
);
```

### 5. Get Summary Statistics

```typescript
const summary = await queryService.getGroupingSummary(
  { mintPattern: true, unitPrice: true },
  { minMaxSol: 1 }
);

console.log(`Overall Migration Rate: ${summary.overallMigrationRate}%`);
console.log(`Average Tokens per Group: ${summary.avgTokensPerGroup}`);
```

## QueryService API Reference

### Main Methods

#### `fetchProfitableTokenGroupsWithMigration(groupingCriteria, filters)`
Main method to fetch and group tokens with migration statistics.

**Parameters:**
- `groupingCriteria`: Object specifying which keys to group by
  - `mintPattern?: boolean`
  - `unitPrice?: boolean`
  - `unitLimit?: boolean`
  - `postMintBundle?: boolean`
- `filters`: Query filters
  - `minMaxSol?: number` - Minimum maxSol threshold
  - `startTime?: number` - Filter by mintTime >= startTime (Unix timestamp)
  - `endTime?: number` - Filter by mintTime <= endTime (Unix timestamp)
  - `mintPattern?: string` - Filter by specific mint pattern
  - `unitPrice?: number` - Filter by specific unit price
  - `unitLimit?: number` - Filter by specific unit limit

**Returns:** `Promise<TokenGroupStats[]>`

#### `fetchTokenGroupsByKey(groupKey, filters)`
Convenience method for grouping by a single key.

**Parameters:**
- `groupKey`: One of `'mintPattern' | 'unitPrice' | 'unitLimit' | 'postMintBundle'`
- `filters`: Same as above

**Returns:** `Promise<TokenGroupStats[]>`

#### `getTopMigratingGroups(groupingCriteria, filters, limit)`
Get the top groups sorted by migration rate.

**Parameters:**
- `groupingCriteria`: Same as above
- `filters`: Same as above
- `limit`: Maximum number of groups to return (default: 10)

**Returns:** `Promise<TokenGroupStats[]>` (sorted by migration rate descending)

#### `getGroupingSummary(groupingCriteria, filters)`
Get aggregate statistics across all groups.

**Returns:** 
```typescript
{
  totalGroups: number;
  totalTokens: number;
  totalMigrated: number;
  overallMigrationRate: number;
  avgTokensPerGroup: number;
  avgMigrationRatePerGroup: number;
}
```

## TokenGroupStats Interface

Each result includes:
```typescript
{
  groupKey: string;                    // Human-readable group identifier
  groupIdentifier: Record<string, any>; // Actual grouping values
  totalTokens: number;                 // Total tokens in this group
  migratedTokens: number;              // Number of migrated tokens
  migrationRate: number;               // Percentage (0-100)
  profitableTokens: number;            // Same as totalTokens (filtered)
  avgMaxSol: number;                   // Average maxSol in group
  totalMaxSol: number;                 // Sum of maxSol in group
  tokens: Array<{                      // Individual token details
    mint: string;
    mintTime: number;
    migrated: boolean;
    maxSol: number;
    maxPrice: number;
  }>;
}
```

## Running the Examples

### Quick Start
```bash
# Run the basic app with simple analysis
npm run dev
```

### Comprehensive Examples
```bash
# Run detailed migration analysis examples
npm run example:migration
```

This will show:
1. Grouping by mint pattern
2. Grouping by multiple keys
3. Grouping by post-mint bundle characteristics
4. Top migrating groups
5. Overall summary statistics
6. Detailed token list for a specific group

## Use Cases

### 1. Identify Successful Token Patterns
Find which mint patterns have the highest migration rates to understand what makes tokens successful.

### 2. Optimize Publishing Strategy
Compare migration rates across different unit prices and limits to optimize your token publishing parameters.

### 3. Track Bundle Performance
Analyze how post-mint bundle characteristics correlate with migration success.

### 4. Time-based Analysis
Track how migration patterns change over time by filtering different time ranges.

### 5. Publisher Group Analysis
Identify which "publisher groups" (tokens with similar characteristics) are most profitable and successful.

## Tips

1. **Start with Single Key Grouping**: Begin with simple groupings to understand your data
2. **Use Appropriate Thresholds**: Set `minMaxSol` to filter out unprofitable tokens
3. **Combine Keys Strategically**: Too many grouping keys may create groups with too few tokens
4. **Monitor Group Size**: Groups with only 1-2 tokens may not provide reliable patterns
5. **Track Over Time**: Regular analysis helps identify trends and changing patterns

## Example Output

```
📊 Example 1: Grouping by Mint Pattern
--------------------------------------------------------------------------------

Found 15 groups by mint pattern:

1. pattern:standard-v2
   Total Tokens: 127
   Migrated: 89 (70.08%)
   Avg Max SOL: 3.4521
   Total Max SOL: 438.4167

2. pattern:custom-mint
   Total Tokens: 45
   Migrated: 38 (84.44%)
   Avg Max SOL: 5.2134
   Total Max SOL: 234.603
```

## Advanced: Custom Queries

For more complex queries, you can directly use the MongoDB aggregation pipeline with the TokenInfoModel:

```typescript
import { TokenInfoModel } from './models/Token.model';

const customResults = await TokenInfoModel.aggregate([
  { $match: { maxSol: { $gte: 1 } } },
  // Your custom aggregation pipeline
]);
```
