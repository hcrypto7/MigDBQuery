# System Architecture & Data Flow

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         MongoDB Database                         │
│                    (TokenInfo Collection)                        │
│                                                                   │
│  Each Token Document:                                            │
│  {                                                               │
│    mint: "abc123...",                                           │
│    mintPattern: "standard-v2",                                  │
│    unitPrice: 1000000,                                          │
│    unitLimit: 250000,                                           │
│    migrated: true,              ← Key field for analysis        │
│    maxSol: 5.21,                                                │
│    postMintBundle: {...},                                       │
│    ...                                                          │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                   DatabaseConnection (Singleton)                 │
│                    src/database/connection.ts                    │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      QueryService (Core)                         │
│                   src/services/query.service.ts                  │
│                                                                   │
│  Main Methods:                                                   │
│  • fetchProfitableTokenGroupsWithMigration()                    │
│  • fetchTokenGroupsByKey()                                      │
│  • getTopMigratingGroups()                                      │
│  • getGroupingSummary()                                         │
│                                                                   │
│  Groups tokens by:                                              │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │ mintPattern  │  unitPrice   │  unitLimit   │postMintBundle│ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
│                                                                   │
│  Calculates: Migration Rate = (Migrated / Total) × 100%        │
└─────────────────────────────────────────────────────────────────┘
                    ↓           ↓           ↓
        ┌───────────┴───────────┴───────────┴──────────┐
        ↓                       ↓                       ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  CommonQueries   │  │ Example Scripts  │  │  Custom Template │
│                  │  │                  │  │                  │
│ 12 Pre-built    │  │ • Detailed       │  │ • Copy & Modify  │
│ Query Patterns:  │  │   Examples       │  │ • Your Own       │
│                  │  │ • Interactive    │  │   Analysis       │
│ • Best Patterns  │  │   CLI            │  │ • Flexible       │
│ • Pricing        │  │ • Step by Step   │  │   Queries        │
│ • Recent High    │  │                  │  │                  │
│ • Consistent     │  │ Entry Points:    │  │                  │
│ • Time Compare   │  │ npm run analyze  │  │ ts-node          │
│ • High Value     │  │ npm run example  │  │ your-file.ts     │
│ • ROI Leaders    │  │ npm run dev      │  │                  │
│ • Distribution   │  │                  │  │                  │
│ • Deep Dive      │  │                  │  │                  │
│ • ...more        │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Data Flow: Token Grouping & Migration Rate Calculation

```
Step 1: Query Tokens
┌─────────────────────────────────────┐
│  Filter tokens by criteria:        │
│  • minMaxSol >= 1                   │
│  • mintTime >= startTime            │
│  • mintTime <= endTime              │
│  • Optional: specific pattern/price │
└─────────────────────────────────────┘
                ↓
Step 2: Group Tokens
┌─────────────────────────────────────────────────────────┐
│  Group by selected keys (MongoDB $group):              │
│                                                         │
│  Example: Group by mintPattern + unitPrice             │
│                                                         │
│  Group 1: pattern:standard-v2|price:0.001              │
│    - Token A (migrated: true)                          │
│    - Token B (migrated: true)                          │
│    - Token C (migrated: false)                         │
│    - Token D (migrated: true)                          │
│                                                         │
│  Group 2: pattern:custom-mint|price:0.002              │
│    - Token E (migrated: true)                          │
│    - Token F (migrated: false)                         │
│    ...                                                  │
└─────────────────────────────────────────────────────────┘
                ↓
Step 3: Calculate Statistics
┌─────────────────────────────────────────────────────────┐
│  For each group:                                        │
│                                                         │
│  totalTokens = 4                                        │
│  migratedTokens = 3                                     │
│  migrationRate = (3 / 4) × 100 = 75%                   │
│  avgMaxSol = (5.2 + 3.4 + 2.1 + 6.8) / 4 = 4.375      │
│  totalMaxSol = 17.5                                     │
└─────────────────────────────────────────────────────────┘
                ↓
Step 4: Sort & Return
┌─────────────────────────────────────┐
│  Sort by migration rate (desc)      │
│  Return array of TokenGroupStats    │
└─────────────────────────────────────┘
```

## Example: Group Formation

```
Database has 127 tokens with mintPattern: "standard-v2"

Grouping by: mintPattern + unitPrice

Result:
┌───────────────────────────────────────────────────────────────┐
│ Group A: pattern:standard-v2|price:0.001                      │
├───────────────────────────────────────────────────────────────┤
│ Total: 45 tokens                                              │
│ Migrated: 38 tokens (84.44%)                                  │
│ Avg SOL: 5.21                                                 │
│ Tokens: [token1, token2, ..., token45]                       │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ Group B: pattern:standard-v2|price:0.002                      │
├───────────────────────────────────────────────────────────────┤
│ Total: 32 tokens                                              │
│ Migrated: 28 tokens (87.5%)                                   │
│ Avg SOL: 4.83                                                 │
│ Tokens: [token46, token47, ..., token77]                     │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ Group C: pattern:standard-v2|price:0.0015                     │
├───────────────────────────────────────────────────────────────┤
│ Total: 50 tokens                                              │
│ Migrated: 35 tokens (70%)                                     │
│ Avg SOL: 3.42                                                 │
│ Tokens: [token78, token79, ..., token127]                    │
└───────────────────────────────────────────────────────────────┘
```

## Use Case Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    USE CASE 1:                               │
│         "Which mint pattern should I use?"                   │
└──────────────────────────────────────────────────────────────┘
                          ↓
    Run: queryService.fetchTokenGroupsByKey('mintPattern')
                          ↓
    Returns groups sorted by migration rate:
    1. pattern:advanced-v3    → 92% migration
    2. pattern:standard-v2    → 84% migration
    3. pattern:basic-v1       → 65% migration
                          ↓
    Decision: Use "pattern:advanced-v3"


┌──────────────────────────────────────────────────────────────┐
│                    USE CASE 2:                               │
│   "What's the best price + limit combination?"               │
└──────────────────────────────────────────────────────────────┘
                          ↓
    Run: queryService.fetchProfitableTokenGroupsWithMigration({
      unitPrice: true,
      unitLimit: true
    })
                          ↓
    Returns combinations sorted by success:
    1. price:0.001|limit:250000    → 89% migration
    2. price:0.002|limit:500000    → 82% migration
    3. price:0.0015|limit:300000   → 78% migration
                          ↓
    Decision: Use price=0.001 with limit=250000


┌──────────────────────────────────────────────────────────────┐
│                    USE CASE 3:                               │
│         "Is my strategy improving over time?"                │
└──────────────────────────────────────────────────────────────┘
                          ↓
    Run: commonQueries.compareTimePeriods(7, 14)
                          ↓
    Returns:
    Recent (7d):   75% migration rate
    Previous (14d): 68% migration rate
    Change:        +7% improvement ✅
                          ↓
    Decision: Strategy is improving, continue
```

## Component Relationships

```
┌────────────────────────────────────────────────────────────────┐
│                       Your Application                         │
└────────────────────────────────────────────────────────────────┘
                              ↓ uses
┌────────────────────────────────────────────────────────────────┐
│                       QueryService                             │
│  (Core engine - all grouping & calculation logic)              │
└────────────────────────────────────────────────────────────────┘
            ↓ extended by              ↓ used by
┌──────────────────────────┐  ┌──────────────────────────────────┐
│    CommonQueries         │  │     Scripts & Examples           │
│  (Pre-built patterns)    │  │  • analyze-migrations.ts         │
│                          │  │  • migration-analysis.ts         │
│  - Wraps QueryService    │  │  • custom-analysis-template.ts   │
│  - Adds convenience      │  │                                  │
│  - Domain-specific logic │  │  → Direct QueryService usage     │
└──────────────────────────┘  └──────────────────────────────────┘
```

## MongoDB Aggregation Pipeline (Under the Hood)

```
When you call: fetchProfitableTokenGroupsWithMigration()

MongoDB executes:
┌─────────────────────────────────────────────────────────────┐
│ Stage 1: $match                                             │
│ Filter tokens by your criteria                             │
│ { maxSol: { $gte: 1 }, mintTime: { $gte: 1234567890 } }   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 2: $group                                             │
│ Group by selected keys and calculate:                       │
│ - Count total tokens                                        │
│ - Count migrated tokens                                     │
│ - Sum maxSol values                                         │
│ - Calculate averages                                        │
│ - Collect token details                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 3: $project                                           │
│ Calculate migration rate:                                   │
│ migrationRate = (migratedTokens / totalTokens) × 100        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Stage 4: $sort                                              │
│ Sort by migrationRate descending                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    Results returned
```

## Quick Decision Tree

```
Need to analyze tokens?
        │
        ├─→ Simple single key?
        │   └─→ Use: fetchTokenGroupsByKey('mintPattern')
        │
        ├─→ Multiple keys?
        │   └─→ Use: fetchProfitableTokenGroupsWithMigration({
        │              mintPattern: true,
        │              unitPrice: true
        │          })
        │
        ├─→ Pre-built pattern exists?
        │   └─→ Use: commonQueries.getMostSuccessfulMintPatterns()
        │
        ├─→ Need top performers only?
        │   └─→ Use: getTopMigratingGroups()
        │
        ├─→ Need overall stats?
        │   └─→ Use: getGroupingSummary()
        │
        └─→ Complex custom analysis?
            └─→ Copy: custom-analysis-template.ts
```

## Visual: What is Migration Rate?

```
Token Group: pattern:standard-v2|price:0.001

Tokens in this group:
┌────────────────────────────────────────┐
│ Token A  [migrated: ✅] maxSol: 5.2   │
│ Token B  [migrated: ✅] maxSol: 3.8   │
│ Token C  [migrated: ❌] maxSol: 2.1   │
│ Token D  [migrated: ✅] maxSol: 6.5   │
│ Token E  [migrated: ❌] maxSol: 1.9   │
│ Token F  [migrated: ✅] maxSol: 4.3   │
└────────────────────────────────────────┘

Calculation:
  Total Tokens:    6
  Migrated:        4  (✅)
  Not Migrated:    2  (❌)
  
  Migration Rate = (4 / 6) × 100 = 66.67%
  
  Avg Max SOL = (5.2 + 3.8 + 2.1 + 6.5 + 1.9 + 4.3) / 6 = 3.97

Result:
┌─────────────────────────────────────────┐
│ Group: pattern:standard-v2|price:0.001  │
│ Migration Rate:  66.67%                 │
│ Total Tokens:    6                      │
│ Migrated Tokens: 4                      │
│ Avg Max SOL:     3.97                   │
│ Total Max SOL:   23.80                  │
└─────────────────────────────────────────┘
```

This visualization should help understand how all the pieces fit together!
