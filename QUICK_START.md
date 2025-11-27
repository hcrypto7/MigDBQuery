# Quick Start Guide - Token Migration Analysis

## Run Analysis Immediately

```bash
# Interactive analysis with colored output and comprehensive stats
npm run analyze

# Detailed examples with step-by-step explanations
npm run example:migration

# Basic analysis
npm run dev
```

## Quick Code Examples

### 1. Find Best Performing Mint Patterns
```typescript
import { QueryService } from './services/query.service';

const queryService = new QueryService();

const topGroups = await queryService.getTopMigratingGroups(
  { mintPattern: true },
  { minMaxSol: 1 },
  10
);

topGroups.forEach(group => {
  console.log(`${group.groupKey}: ${group.migrationRate}%`);
});
```

### 2. Analyze Your Token Group
```typescript
// Group by mint pattern + unit price
const groups = await queryService.fetchProfitableTokenGroupsWithMigration(
  {
    mintPattern: true,
    unitPrice: true
  },
  {
    minMaxSol: 1 // Only profitable tokens
  }
);

// Find your group with highest migration rate
const bestGroup = groups.sort((a, b) => b.migrationRate - a.migrationRate)[0];
console.log(`Best configuration: ${bestGroup.groupKey}`);
console.log(`Migration rate: ${bestGroup.migrationRate}%`);
```

### 3. Check Recent Performance
```typescript
import { CommonQueries } from './utils/common-queries';

const commonQueries = new CommonQueries(queryService);

// Last 7 days
const recent = await commonQueries.getRecentHighPerformers(7, 1);

recent.forEach(group => {
  console.log(`${group.groupKey}: ${group.migrationRate}% (${group.totalTokens} tokens)`);
});
```

### 4. Compare Time Periods
```typescript
const comparison = await commonQueries.compareTimePeriods(7, 14);

console.log(`Recent: ${comparison.recent.overallMigrationRate}%`);
console.log(`Previous: ${comparison.older.overallMigrationRate}%`);
console.log(`Improvement: ${comparison.improvement.migrationRate}%`);
```

## Understanding Results

### TokenGroupStats Object
```typescript
{
  groupKey: "pattern:standard-v2|price:0.001",  // Human-readable identifier
  totalTokens: 127,                              // Total tokens in group
  migratedTokens: 89,                            // Successfully migrated
  migrationRate: 70.08,                          // Success rate %
  avgMaxSol: 3.45,                               // Average profitability
  totalMaxSol: 438.42,                           // Total profit
  tokens: [...]                                  // Individual token details
}
```

### Key Metrics

- **Migration Rate**: Percentage of tokens that successfully migrated
- **Avg Max SOL**: Average maximum SOL reached per token
- **Total Max SOL**: Combined profitability of all tokens in group
- **Total Tokens**: Sample size (larger = more reliable)

## Grouping Options

You can group tokens by:

1. **mintPattern** - Minting strategy used
2. **unitPrice** - Token price configuration
3. **unitLimit** - Minting limit settings
4. **postMintBundle** - Bundle characteristics after minting
5. **Combinations** - Mix multiple keys for detailed analysis

## Common Filters

```typescript
{
  minMaxSol: 1,              // Minimum profit threshold
  startTime: timestamp,       // Unix timestamp - start of range
  endTime: timestamp,         // Unix timestamp - end of range
  mintPattern: 'specific',    // Filter specific pattern
  unitPrice: 0.001,          // Filter specific price
  unitLimit: 1000            // Filter specific limit
}
```

## Pre-built Query Patterns

The `CommonQueries` class provides ready-to-use patterns:

1. `getMostSuccessfulMintPatterns()` - Best performing patterns
2. `analyzePricingStrategies()` - Optimal pricing
3. `getSuccessfulPublisherConfigs()` - Best configurations
4. `getRecentHighPerformers()` - Recent success stories
5. `analyzeBundleStrategies()` - Bundle impact
6. `getHighValueGroups()` - Highest profits
7. `getConsistentPerformers()` - Reliable groups
8. `compareTimePeriods()` - Trend analysis
9. `getRoiLeaders()` - Best total returns
10. `getMigrationRateDistribution()` - Success rate spread

## File Structure

```
src/
├── services/
│   └── query.service.ts          # Main query service
├── utils/
│   └── common-queries.ts         # Pre-built query patterns
├── examples/
│   └── migration-analysis.ts     # Detailed examples
└── scripts/
    └── analyze-migrations.ts     # Interactive CLI
```

## Tips for Best Results

1. **Start Simple**: Begin with single-key grouping (mintPattern only)
2. **Set Thresholds**: Use `minMaxSol` to filter profitable tokens
3. **Check Sample Size**: Groups with 5+ tokens are more reliable
4. **Monitor Trends**: Compare different time periods
5. **Combine Strategically**: Too many grouping keys = smaller groups

## Next Steps

1. Run `npm run analyze` to see your data
2. Review the top performing groups
3. Identify patterns in successful configurations
4. Adjust your token publishing strategy accordingly
5. Monitor changes over time

## Need Help?

- See `MIGRATION_ANALYSIS.md` for detailed documentation
- Check examples in `src/examples/migration-analysis.ts`
- Review common patterns in `src/utils/common-queries.ts`

## Database Connection

Make sure your `.env` file has the MongoDB connection string:
```env
MONGODB_URI=mongodb://your-connection-string
```

The system will automatically connect when running any analysis script.
