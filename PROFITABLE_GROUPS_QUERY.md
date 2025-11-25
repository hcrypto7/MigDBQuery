# Profitable Token Groups Query with Sell Thresholds

## Overview

The `findProfitableTokenGroups()` method finds groups of tokens that show profitability based on SOL price rise in the liquidity pool, and **calculates safe sell thresholds** to help you take profits before sudden drops.

## Why Sell Thresholds Matter

Before a token reaches its `maxSol`, you need to sell to secure profits. Without proper timing:
- **Sudden drops can occur** - Price can crash quickly
- **Larger positions = higher risk** - If your `firstSlotSol` is high, you risk losing up to 80% of your position
- **Timing is critical** - Need to exit at the right SOL level

## How It Works

### Profit Calculation
- **Buy Price**: `min(mintSlotSol, firstSlotSol)` - Uses the lower value as your entry price
- **Sell Price**: `maxSol` - The highest SOL reached in the pool
- **Profit (Rise SOL)**: `maxSol - buyPriceSol` - The SOL increase

### Sell Threshold Calculation

The query analyzes historical data for each pattern group and calculates **4 threshold strategies**:

1. **Conservative Threshold (50th percentile)**
   - Captures ~50% of the average max rise
   - Lowest risk - sells early
   - Best for high-volatility patterns

2. **Moderate Threshold (70th percentile)**
   - Captures ~70% of the average max rise
   - Balanced risk/reward
   - Best for medium-volatility patterns

3. **Aggressive Threshold (85th percentile)**
   - Captures ~85% of the average max rise
   - Higher risk but more profit
   - Best for low-volatility patterns

4. **Recommended Threshold (Auto-selected)**
   - Automatically chosen based on risk level
   - Uses Coefficient of Variation (CV) to measure volatility
   - High CV (>0.5) → Conservative
   - Medium CV (0.3-0.5) → Moderate
   - Low CV (<0.3) → Aggressive

### Risk Assessment

**Risk Level** is determined by the Coefficient of Variation (CV):
- **LOW**: CV < 0.3 - Consistent performance, safe to be aggressive
- **MEDIUM**: CV 0.3-0.5 - Moderate volatility, balanced approach
- **HIGH**: CV > 0.5 - High volatility, be conservative

### Grouping Strategy

1. **Primary Key**: `mintPattern` - Main grouping by mint pattern
2. **Secondary Keys** (optional): `unitPrice` and `unitLimit` - Subgroup within patterns

## Usage Examples

### Basic - Group by Pattern Only

```typescript
const profitableGroups = await queryService.findProfitableTokenGroups({
  groupByComputeUnits: false,  // Only group by mintPattern
  minRiseSol: 0.5,             // Minimum 0.5 SOL rise
  minTokensInGroup: 2,         // At least 2 tokens in group
  limit: 10,                   // Top 10 groups
  sortBy: 'avgRiseSol'         // Sort by average rise
});
```

### Advanced - Include Compute Units Subgrouping

```typescript
const detailedGroups = await queryService.findProfitableTokenGroups({
  groupByComputeUnits: true,   // Group by pattern + unitPrice + unitLimit
  minRiseSol: 1,               // Minimum 1 SOL rise
  minTokensInGroup: 3,         // At least 3 tokens
  limit: 20,
  sortBy: 'maxRiseSol'         // Sort by maximum rise in group
});
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `groupByComputeUnits` | boolean | false | Add unitPrice/unitLimit as subgroup keys |
| `minRiseSol` | number | 0 | Minimum SOL rise to include tokens |
| `minTokensInGroup` | number | 2 | Minimum tokens required in a group |
| `limit` | number | 50 | Maximum groups to return |
| `sortBy` | string | 'avgRiseSol' | Sort by: 'avgRiseSol', 'maxRiseSol', or 'totalTokens' |

## Return Data Structure

```typescript
{
  _id: {
    mintPattern: string,
    unitPrice?: number,    // Only if groupByComputeUnits = true
    unitLimit?: number     // Only if groupByComputeUnits = true
  },
  mintPattern: string,
  unitPrice?: number,
  unitLimit?: number,
  totalTokens: number,           // Number of tokens in this group
  
  // Profit metrics
  avgRiseSol: number,            // Average SOL rise
  maxRiseSol: number,            // Highest SOL rise in group
  minRiseSol: number,            // Lowest SOL rise in group
  avgMaxSol: number,             // Average max liquidity
  avgBuyPriceSol: number,        // Average entry price
  totalRiseSol: number,          // Sum of all rises
  profitabilityScore: number,    // avgRiseSol * totalTokens
  
  // Risk analysis
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  coefficientOfVariation: number,  // Volatility measure (stdDev / mean)
  riseStdDev: number,              // Standard deviation of rises
  
  // Sell thresholds (SOL rise from buy price)
  recommendedSellThreshold: number,  // Auto-selected based on risk
  conservativeThreshold: number,     // 50th percentile
  moderateThreshold: number,         // 70th percentile  
  aggressiveThreshold: number,       // 85th percentile
  
  // Absolute SOL values (buyPrice + threshold)
  recommendedSellSol: number,     // When to sell (recommended)
  conservativeSellSol: number,    // Conservative sell point
  moderateSellSol: number,        // Moderate sell point
  aggressiveSellSol: number,      // Aggressive sell point
  
  // Profit expectation
  profitCaptureRate: number,      // Expected % of max profit (0.5, 0.7, or 0.85)
  expectedProfit: number,         // recommendedThreshold * captureRate
  
  tokens: [                      // Top 5 example tokens
    {
      mint: string,
      riseSol: number,
      maxSol: number,
      buyPriceSol: number
    }
  ]
}
```

## How to Use Sell Thresholds

### 1. Check the Risk Level
```typescript
if (group.riskLevel === 'HIGH') {
  // Use conservative threshold - volatile pattern
  sellAt = group.conservativeSellSol;
} else if (group.riskLevel === 'MEDIUM') {
  // Use moderate threshold
  sellAt = group.moderateSellSol;
} else {
  // Use aggressive threshold - stable pattern
  sellAt = group.aggressiveSellSol;
}
```

### 2. Use the Recommended Threshold (Easiest)
```typescript
// The query already picks the best threshold for you
sellAt = group.recommendedSellSol;

// Set your sell order when SOL pool reaches this level
if (currentPoolSol >= sellAt) {
  executeSell();
}
```

### 3. Calculate Your Position-Specific Threshold
```typescript
// If you bought at a specific price
const myBuyPrice = 0.000001; // Your actual buy price
const riseNeeded = group.recommendedSellThreshold; // SOL rise to target
const mySellTarget = myBuyPrice + riseNeeded;

// Sell when pool SOL reaches mySellTarget
```

## Additional Query: Most Profitable Individual Tokens

Find individual tokens with highest SOL rise:

```typescript
const topTokens = await queryService.findMostProfitableTokens(
  20,    // limit: top 20 tokens
  1      // minRiseSol: at least 1 SOL rise
);
```

## Use Cases

1. **Pattern Discovery**: Find which mint patterns consistently show profitability
2. **Configuration Analysis**: See if specific unitPrice/unitLimit combinations are more profitable
3. **Strategy Validation**: Verify if certain token configurations perform better
4. **Risk Assessment**: Check consistency (minRiseSol vs maxRiseSol variance)

## Example Output

```
1. Pattern: stclcppcsct2sct2stscsis3mp...
   Total Tokens: 15
   Avg Rise SOL: 2.5430 (Max: 5.2100)
   Avg Max SOL: 3.8900
   Profitability Score: 38.15
   
   🎯 SELL THRESHOLDS:
      Risk Level: MEDIUM (CV: 0.385)
      📍 Recommended: 3.4500 SOL (70% capture)
         ├─ Conservative: 3.1200 SOL (~50% of max rise)
         ├─ Moderate: 3.4500 SOL (~70% of max rise)
         └─ Aggressive: 3.7800 SOL (~85% of max rise)
      💰 Expected Profit: 1.7800 SOL per token
      
   Example: Gxb9FDeugEH... (rise: 2.9234)
```

## Interpretation Guide

### Understanding the Numbers

**Risk Level: MEDIUM (CV: 0.385)**
- CV = 0.385 means moderate volatility
- Returns vary but with some consistency
- Use moderate threshold (70% capture)

**Recommended: 3.4500 SOL (70% capture)**
- Sell when pool SOL reaches 3.4500
- You'll capture 70% of the average maximum rise
- Balances profit vs. risk of sudden drop

**Expected Profit: 1.7800 SOL**
- If you follow the recommendation
- Based on: `recommendedThreshold * 0.70`
- Per-token expected gain

### Risk Level Meanings

**HIGH Risk (CV > 0.5)**
- Very volatile returns
- Some tokens moon, others barely move
- **Action**: Use conservative threshold, exit early
- **Example**: Meme patterns with huge variance

**MEDIUM Risk (CV 0.3-0.5)**
- Moderate volatility
- Decent consistency with some variance
- **Action**: Use moderate threshold, balanced approach
- **Example**: Popular patterns with good track record

**LOW Risk (CV < 0.3)**
- Highly consistent returns
- Predictable performance
- **Action**: Use aggressive threshold, maximize profit
- **Example**: Proven patterns with stable performance

## Performance Tips

- Use `minRiseSol` to filter out noise from small fluctuations
- Set `minTokensInGroup` to ensure statistical significance (recommended: 10+)
- Lower `limit` for faster queries on large datasets
- Use `groupByComputeUnits: false` for broader pattern analysis
- Use `groupByComputeUnits: true` for detailed configuration analysis
- **Always check `riskLevel` before trading** - high risk = be more conservative
- Consider using **conservative thresholds** for tokens with high `firstSlotSol` (bigger positions = more at risk)

## Trading Strategy Recommendations

### For High-Risk Patterns (CV > 0.5)
1. Use conservative threshold or even lower
2. Consider selling in tranches (e.g., 50% at conservative, 30% at moderate, 20% at aggressive)
3. Set tight stop-losses
4. Don't hold past the conservative threshold

### For Medium-Risk Patterns (CV 0.3-0.5)
1. Use recommended threshold
2. Consider trailing stop-loss
3. Can hold through moderate volatility
4. Exit at moderate threshold

### For Low-Risk Patterns (CV < 0.3)
1. Can use aggressive threshold
2. More predictable, less need for early exit
3. Still set stop-loss at moderate threshold as backup
4. These are your "safer" plays

## Risk Management Notes

⚠️ **Important Considerations:**
- Thresholds are based on **historical data** - past performance doesn't guarantee future results
- Sudden market events can override patterns
- Always use stop-losses
- Higher `firstSlotSol` = higher position size = use more conservative thresholds
- Consider market conditions (bull/bear) when interpreting thresholds
- The query shows **pool SOL levels**, not token prices
