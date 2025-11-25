# Sell Threshold System - Quick Reference

## 🎯 The Problem You're Solving

When trading tokens:
1. You buy at `firstSlotSol` or `mintSlotSol` (your entry price)
2. Pool SOL rises to `maxSol` (the peak)
3. **BUT** - you need to sell BEFORE the peak, because:
   - Sudden drops happen frequently
   - If you wait for `maxSol`, price might crash first
   - Larger positions (high `firstSlotSol`) = up to 80% loss risk

## 🔍 How the System Works

### Step 1: Analyze Historical Data
For each pattern group, the query looks at all past tokens and calculates:
- How much SOL rise they achieved
- How consistent the rises were (volatility)
- Distribution of rises (50th, 70th, 85th percentiles)

### Step 2: Calculate Risk Level
**Coefficient of Variation (CV)** = Standard Deviation / Mean
- **HIGH** (CV > 0.5): Very volatile, inconsistent
- **MEDIUM** (CV 0.3-0.5): Moderate volatility
- **LOW** (CV < 0.3): Consistent, predictable

### Step 3: Determine Sell Thresholds

Three strategies are calculated:

| Strategy | Percentile | Meaning | When to Use |
|----------|-----------|---------|-------------|
| **Conservative** | 50th | Half of tokens reached this rise | High risk patterns |
| **Moderate** | 70th | 70% of tokens reached this rise | Medium risk patterns |
| **Aggressive** | 85th | 85% of tokens reached this rise | Low risk patterns |

### Step 4: Auto-Recommend
The system automatically picks the best threshold:
- HIGH risk → Conservative (safer)
- MEDIUM risk → Moderate (balanced)
- LOW risk → Aggressive (maximize profit)

## 📊 Reading the Output

```
Pattern: stclcppcsct2sct2stscsis3mp...
Total Tokens: 15
Avg Rise SOL: 2.5430 (Max: 5.2100)

🎯 SELL THRESHOLDS:
   Risk Level: MEDIUM (CV: 0.385)
   📍 Recommended: 3.4500 SOL (70% capture)
      ├─ Conservative: 3.1200 SOL (~50% of max rise)
      ├─ Moderate: 3.4500 SOL (~70% of max rise)
      └─ Aggressive: 3.7800 SOL (~85% of max rise)
   💰 Expected Profit: 1.7800 SOL per token
```

### What This Means:

1. **Risk Level: MEDIUM** → This pattern has moderate volatility
2. **Recommended: 3.4500 SOL** → Sell when pool reaches 3.4500 SOL
3. **70% capture** → You'll get 70% of the average maximum rise
4. **Expected Profit: 1.7800 SOL** → Your likely profit per token

## 🎮 How to Use in Trading

### Simple Approach
```typescript
// Get the group data
const group = await queryService.findProfitableTokenGroups({...});

// Use the recommended threshold
const sellAt = group.recommendedSellSol;

// When monitoring your token
if (currentPoolSol >= sellAt) {
  executeSell(); // SELL NOW
}
```

### Advanced Approach (Tranched Selling)
```typescript
// Sell in stages to balance risk/reward
if (currentPoolSol >= group.conservativeSellSol) {
  sellAmount(50%); // Take half off the table
}
if (currentPoolSol >= group.moderateSellSol) {
  sellAmount(30%); // Sell another 30%
}
if (currentPoolSol >= group.aggressiveSellSol) {
  sellAmount(20%); // Sell the rest
}
```

## ⚠️ Risk-Based Strategy

### For HIGH Risk Patterns (CV > 0.5)
```
Strategy: VERY CONSERVATIVE
- Use conservativeThreshold or lower
- Don't try to catch the peak
- Take profits early and run
- These are unpredictable - protect capital
```

### For MEDIUM Risk Patterns (CV 0.3-0.5)
```
Strategy: BALANCED
- Use recommendedThreshold (moderate)
- Can afford to wait a bit longer
- Set trailing stop-loss
- Good risk/reward balance
```

### For LOW Risk Patterns (CV < 0.3)
```
Strategy: AGGRESSIVE
- Can use aggressiveThreshold
- More predictable patterns
- Less likely to crash suddenly
- Maximize profits, but still use stop-loss
```

## 💡 Pro Tips

1. **Bigger Position = More Conservative**
   - If your `firstSlotSol` is high → use conservative threshold
   - More money at risk → prioritize safety

2. **Consider Profit Capture Rate**
   - 50% capture (conservative) = safer but less profit
   - 70% capture (moderate) = balanced
   - 85% capture (aggressive) = risky but more profit

3. **Use Stop-Losses**
   - Even with thresholds, always set stop-losses
   - Recommendation: Set stop-loss at conservative threshold
   - If price drops below conservative, exit immediately

4. **Market Context Matters**
   - Bull market → can be more aggressive
   - Bear market → be more conservative
   - High volatility days → use lower thresholds

5. **Monitor Coefficient of Variation**
   - CV < 0.2 → Very safe, consistent
   - CV 0.2-0.3 → Safe, predictable
   - CV 0.3-0.5 → Moderate risk
   - CV 0.5-0.7 → High risk
   - CV > 0.7 → Very risky, be very careful

## 📈 Example Trading Scenario

```
You found a token matching pattern: "stclcppcsct2..."

Group data shows:
- Risk Level: MEDIUM (CV: 0.35)
- Recommended Sell: 4.2000 SOL
- Avg Buy Price: 0.0005 SOL
- Expected Profit: 2.1000 SOL

Your position:
- Bought at: 0.0006 SOL (similar to pattern avg)
- Current Pool SOL: 1.5000
- Target: 4.2000 SOL

Action Plan:
1. Monitor pool SOL level
2. When pool hits 4.2000 SOL → SELL
3. Stop-loss at 3.0000 SOL (conservative threshold)
4. Expected profit if you hit target: ~2.1 SOL

Result:
- Pool reaches 4.1500 SOL → You sell at 4.1500
- Actual profit: ~2.05 SOL (close to expected!)
- Avoided the drop that came at 4.3000 SOL
```

## 🚨 Warning Signs

Watch out for these red flags:
- **CV > 0.6**: Very unpredictable, consider skipping
- **Low token count**: Groups with < 10 tokens may not be reliable
- **Huge variance**: If maxRiseSol is 10x minRiseSol, be very careful
- **Recent pattern changes**: Market conditions can shift patterns

## 🎓 Summary

The sell threshold system:
1. ✅ Analyzes historical performance
2. ✅ Calculates risk (volatility)
3. ✅ Provides 3 threshold options
4. ✅ Recommends the best one for you
5. ✅ Helps you avoid the "wait too long" trap
6. ✅ Maximizes profit while managing risk

**Remember**: The goal is to capture MOST of the profit, not ALL of it. Trying to sell at the exact peak is how you lose money to sudden drops!
