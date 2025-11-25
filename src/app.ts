import { DatabaseConnection } from './database/connection';
import { QueryService } from './services/query.service';

async function main() {
  try {
    // Connect to MongoDB
    const db = DatabaseConnection.getInstance();
    await db.connect();

    // Initialize query service
    const queryService = new QueryService();

    // ============= DEMO: Token Queries =============
    console.log('\n\n🪙 Querying Tokens...\n');

    // Count total tokens
    const totalTokens = await queryService.countTotalTokens();
    console.log(`📊 Total Tokens in Database: ${totalTokens}`);

    // Get recent tokens (last 24 hours)
    const recentTokens = await queryService.findRecentTokens(1);
    console.log(`\n� Recent Tokens (last 24h): ${recentTokens.length} found`);
    if (recentTokens.length > 0) {
      console.log('Sample:', {
        mint: recentTokens[0].mint,
        maxSol: recentTokens[0].maxSol,
        maxPrice: recentTokens[0].maxPrice,
        mintPattern: recentTokens[0].mintPattern,
        extended: recentTokens[0].extended
      });
    }

    // Get latest token
    const latestToken = await queryService.getLatestToken();
    if (latestToken) {
      console.log(`\n🆕 Latest Token:`, {
        mint: latestToken.mint,
        createdAt: latestToken.createdAt,
        maxSol: latestToken.maxSol,
        extended: latestToken.extended
      });
    }

    // Find high liquidity tokens
    const highLiquidityTokens = await queryService.findHighLiquidityTokens(3);
    console.log(`\n💰 High Liquidity Tokens (maxSol >= 3): ${highLiquidityTokens.length} found`);
    if (highLiquidityTokens.length > 0) {
      console.log('Top 3:', highLiquidityTokens.slice(0, 3).map(t => ({
        mint: t.mint.substring(0, 8) + '...',
        maxSol: t.maxSol
      })));
    }

    // Find extended tokens
    const extendedTokens = await queryService.findExtendedTokens();
    console.log(`\n� Extended Tokens: ${extendedTokens.length} found`);

    // Get token overview
    const overview = await queryService.getTokenOverview();
    console.log(`\n📈 Token Overview:`, {
      totalTokens: overview?.totalTokens || 0,
      avgMaxSol: overview?.avgMaxSol?.toFixed(4) || 0,
      avgMaxPrice: overview?.avgMaxPrice?.toFixed(8) || 0,
      extendedCount: overview?.extendedCount || 0,
      migratedCount: overview?.migratedCount || 0
    });

    // Get MEV service statistics
    const mevStats = await queryService.getTokenStatsByMEVService();
    if (mevStats && mevStats.length > 0) {
      console.log(`\n⚡ MEV Service Statistics:`, {
        totalTokens: mevStats[0].totalTokens,
        jito: mevStats[0].jitoCount,
        bloxRoute: mevStats[0].bloxRouteCount,
        photon: mevStats[0].photonCount,
        axiom: mevStats[0].axiomCount,
        lookupTable: mevStats[0].lookupTableCount
      });
    }

    // Get top price tokens
    const topPriceTokens = await queryService.getTopPriceTokens(5);
    console.log(`\n🏆 Top Price Tokens: ${topPriceTokens.length} found`);
    if (topPriceTokens.length > 0) {
      console.log('Top 3:', topPriceTokens.slice(0, 3).map(t => ({
        mint: t.mint.substring(0, 8) + '...',
        maxPrice: t.maxPrice
      })));
    }

    // Get pattern frequency
    const patterns = await queryService.getPatternFrequency(100);
    console.log(`\n🎨 Top Mint Patterns: ${patterns.length} found`);
    if (patterns.length > 0) {
      console.log('Top patterns:', patterns.map((p: any) => ({
        // pattern: p._id.substring(0, 20) + '...',
        pattern: p._id,
        count: p.count,
        avgMaxSol: p.avgMaxSol?.toFixed(4)
      })));
    }

    // ============= DEMO: Profitable Token Groups =============
    console.log('\n\n💎 Profitable Token Groups Analysis (Last 3 Days)...\n');

    // Find profitable groups by mint pattern only
    const profitableGroups = await queryService.findProfitableTokenGroups({
      groupByComputeUnits: false,
      minRiseSol: 0.5,
      minTokensInGroup: 30,
      limit: 200,
      sortBy: 'avgRiseSol',
      daysBack: 3  // Analyze last 3 days
    });
    
    console.log(`\n📊 Most Profitable Patterns (by avg SOL rise):`);
    if (profitableGroups.length > 0) {
      profitableGroups.slice(0, 200).forEach((group: any, index: number) => {
        console.log(`\n${index + 1}. Pattern: ${group.mintPattern}`);
        console.log(`   Total Tokens: ${group.totalTokens}`);
        console.log(`   Avg Rise SOL: ${group.avgRiseSol?.toFixed(4)} (Max: ${group.maxRiseSol?.toFixed(4)})`);
        console.log(`   Avg Max SOL: ${group.avgMaxSol?.toFixed(4)}`);
        console.log(`   Profitability Score: ${group.profitabilityScore?.toFixed(2)}`);
        
        // Risk and Sell Threshold Information with WIN/LOSS calculation
        console.log(`   🎯 SELL THRESHOLDS (Simulated Results):`);
        console.log(`      Risk Level: ${group.riskLevel}`);
        console.log(`      📍 RECOMMENDED (Optimal): ${group.recommendedSellSol?.toFixed(4)} SOL`);
        console.log(`         Rise Threshold: ${group.recommendedSellThreshold?.toFixed(4)} SOL`);
        console.log(`         Win: ${group.recommendedWinCount}/${group.totalTokens} (${group.recommendedWinRate?.toFixed(1)}%)`);
        console.log(`         Loss: ${group.recommendedLossCount}`);
        console.log(`         Avg Profit per Token: ${group.recommendedAvgProfit?.toFixed(4)} SOL`);
        console.log(`         Total Profit (all tokens): ${group.recommendedTotalProfit?.toFixed(2)} SOL`);
        
        console.log(`      🛡️  CONSERVATIVE (Highest Win Rate): ${group.conservativeSellSol?.toFixed(4)} SOL`);
        console.log(`         Win: ${group.conservativeWinCount}/${group.totalTokens} (${group.conservativeWinRate?.toFixed(1)}%)`);
        console.log(`         Avg Profit: ${group.conservativeAvgProfit?.toFixed(4)} SOL`);
        
        console.log(`      🚀 AGGRESSIVE (Highest Profit): ${group.aggressiveSellSol?.toFixed(4)} SOL`);
        console.log(`         Win: ${group.aggressiveWinCount}/${group.totalTokens} (${group.aggressiveWinRate?.toFixed(1)}%)`);
        console.log(`         Avg Profit: ${group.aggressiveAvgProfit?.toFixed(4)} SOL`);
        
        if (group.tokens && group.tokens.length > 0) {
          console.log(`   Example: ${group.tokens[0].mint.substring(0, 12)}... (rise: ${group.tokens[0].riseSol?.toFixed(4)})`);
        }
      });
    }

    // Find profitable groups with compute unit subgrouping
    const detailedGroups = await queryService.findProfitableTokenGroups({
      groupByComputeUnits: true,
      minRiseSol: 1,
      minTokensInGroup: 30,
      limit: 200,
      sortBy: 'avgRiseSol',
      daysBack: 3  // Analyze last 3 days
    });

    console.log(`\n\n🔧 Profitable Groups (Pattern + Compute Units):`);
    if (detailedGroups.length > 0) {
      detailedGroups.forEach((group: any, index: number) => {
        console.log(`\n${index + 1}. Pattern: ${group.mintPattern}`);
        console.log(`   Unit Price: ${group.unitPrice}, Unit Limit: ${group.unitLimit}`);
        console.log(`   Tokens: ${group.totalTokens}, Avg Rise: ${group.avgRiseSol?.toFixed(4)} SOL`);
        console.log(`   🎯 Recommended Sell: ${group.recommendedSellSol?.toFixed(4)} SOL`);
        console.log(`      Win Rate: ${group.recommendedWinRate?.toFixed(1)}% (${group.recommendedWinCount}/${group.totalTokens})`);
        console.log(`      Avg Profit: ${group.recommendedAvgProfit?.toFixed(4)} SOL`);
      });
    }

    console.log('\n✅ All queries completed successfully!');

    // Disconnect
    await db.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
