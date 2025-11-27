# 🚀 Token Migration Analysis - Quick Command Reference

## Run Analysis (Choose One)

```bash
# 🎨 Interactive CLI with colors and comprehensive stats
npm run analyze

# 📚 Step-by-step detailed examples  
npm run example:migration

# ⚡ Quick basic analysis
npm run dev
```

## Code Snippets (Copy & Paste)

### 1️⃣ Find Best Mint Patterns
```typescript
const queryService = new QueryService();

const topPatterns = await queryService.getTopMigratingGroups(
  { mintPattern: true },
  { minMaxSol: 1 },
  10
);

topPatterns.forEach(g => 
  console.log(`${g.groupKey}: ${g.migrationRate}%`)
);
```

### 2️⃣ Analyze Your Configuration
```typescript
const groups = await queryService.fetchProfitableTokenGroupsWithMigration(
  {
    mintPattern: true,
    unitPrice: true,
    unitLimit: true
  },
  { minMaxSol: 1 }
);

const best = groups[0];
console.log(`Best config: ${best.groupKey} - ${best.migrationRate}%`);
```

### 3️⃣ Recent Performance (Last 7 Days)
```typescript
const commonQueries = new CommonQueries(queryService);

const recent = await commonQueries.getRecentHighPerformers(7, 1);
```

### 4️⃣ Compare Time Periods
```typescript
const comparison = await commonQueries.compareTimePeriods(7, 14);

console.log(`Recent: ${comparison.recent.overallMigrationRate}%`);
console.log(`Previous: ${comparison.older.overallMigrationRate}%`);
```

### 5️⃣ Get Summary Stats
```typescript
const summary = await queryService.getGroupingSummary(
  { mintPattern: true },
  { minMaxSol: 1 }
);

console.log(`Overall Migration Rate: ${summary.overallMigrationRate}%`);
```

## Grouping Options

```typescript
{
  mintPattern: true,      // ✅ Minting strategy
  unitPrice: true,        // ✅ Price configuration
  unitLimit: true,        // ✅ Limit settings
  postMintBundle: true    // ✅ Bundle characteristics
}
```

## Filter Options

```typescript
{
  minMaxSol: 1,                           // Minimum profit
  startTime: Date.now()/1000 - 86400*7,   // Last 7 days
  endTime: Date.now()/1000,               // Now
  mintPattern: 'specific-pattern',        // Filter pattern
  unitPrice: 1000000,                     // Filter price
  unitLimit: 250000                       // Filter limit
}
```

## Common Queries (Pre-built)

```typescript
const cq = new CommonQueries(queryService);

cq.getMostSuccessfulMintPatterns(minSol)
cq.analyzePricingStrategies(minSol)
cq.getRecentHighPerformers(days, minSol)
cq.getConsistentPerformers(minRate, minTokens)
cq.compareTimePeriods(period1Days, period2Days)
cq.getHighValueGroups(minAvgSol, minTokens)
cq.getRoiLeaders(minSol, limit)
cq.getMigrationRateDistribution(minSol)
```

## Files You Need

| File | Purpose | When to Use |
|------|---------|-------------|
| `query.service.ts` | Core engine | Direct API access |
| `common-queries.ts` | 12 pre-built patterns | Common analyses |
| `custom-analysis-template.ts` | Copy & modify | Your custom needs |
| `analyze-migrations.ts` | Interactive CLI | Quick exploration |
| `migration-analysis.ts` | Step-by-step | Learning examples |

## Return Type (TokenGroupStats)

```typescript
{
  groupKey: string,              // "pattern:abc|price:123"
  groupIdentifier: object,       // { mintPattern: "abc", unitPrice: 123 }
  totalTokens: number,           // Total in group
  migratedTokens: number,        // Successfully migrated
  migrationRate: number,         // Percentage (0-100)
  avgMaxSol: number,             // Average profitability
  totalMaxSol: number,           // Total profitability
  tokens: Array<{...}>           // Individual token details
}
```

## One-Liners

```typescript
// Top 5 best patterns
(await queryService.getTopMigratingGroups({mintPattern:true},{minMaxSol:1},5))[0]

// Summary stats
await queryService.getGroupingSummary({mintPattern:true},{minMaxSol:1})

// Recent vs old
await new CommonQueries(queryService).compareTimePeriods(7,14)

// All groups
await queryService.fetchTokenGroupsByKey('mintPattern',{minMaxSol:1})
```

## Tips

✅ Start with `mintPattern` only  
✅ Use `minMaxSol: 1` or higher  
✅ Groups with 5+ tokens are reliable  
✅ Compare time periods for trends  
✅ Check both rate AND volume  

## Quick Test

```bash
# 1. Make sure MongoDB is running
# 2. Check .env has MONGODB_URI
# 3. Run this:
npm run analyze
```

## Documentation

- **This File** - Quick commands
- **QUICK_START.md** - 5-minute guide
- **MIGRATION_ANALYSIS.md** - Full docs
- **ARCHITECTURE.md** - System design
- **IMPLEMENTATION_SUMMARY.md** - Overview

## Need Help?

1. Check examples: `src/examples/migration-analysis.ts`
2. See patterns: `src/utils/common-queries.ts`
3. Copy template: `src/templates/custom-analysis-template.ts`

---

💡 **Pro Tip**: Run `npm run analyze` first to see what your data looks like!
