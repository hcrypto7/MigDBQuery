import { DatabaseConnection } from './database/connection';
import { QueryService } from './services/query.service';

async function main() {
  try {
    // Connect to MongoDB
    const db = DatabaseConnection.getInstance();
    await db.connect();

    // Initialize query service
    const queryService = new QueryService();

    console.log('\n🚀 Starting Token Migration Analysis...\n');

    // Complex grouping by mintPattern + unitPrice + unitLimit
    console.log('📊 Analyzing Last 24 Hours Token Groups (Pattern + Price + Limit)...\n');
    
    const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;
    const twoDaysAgo = Math.floor(Date.now() / 1000) - 86400 * 2;
    
    const complexGroups = await queryService.fetchProfitableTokenGroupsWithMigration(
      {
        mintPattern: true,
        unitPrice: true,
        unitLimit: true
      },
      {
        minMaxSol: 1,
        startTime: oneDayAgo,
        winPercent: 55
      }
    );

    // Filter groups with 30+ tokens and sort by common rise SOL
    const filteredGroups = complexGroups
      .filter(group => group.totalTokens >= 30)
      .sort((a, b) => b.commonRiseSol - a.commonRiseSol);

    console.log(`Found ${filteredGroups.length} publisher groups with 30+ tokens (last 24h)\n`);
    console.log('Sorted by Common Rise SOL (70% win rate - the rise that 70% of tokens reached)\n');
    console.log('='.repeat(120));
    
    // Show all filtered groups
    filteredGroups.forEach((group, idx) => {
      console.log(`\n${idx + 1}. ${group.groupKey}`);
      console.log(`   Configuration: Pattern="${group.groupIdentifier.mintPattern || 'N/A'}" | Price=${group.groupIdentifier.unitPrice || 0} | Limit=${group.groupIdentifier.unitLimit || 0}`);
      console.log(`   Tokens: ${group.totalTokens} | Migration: ${group.migratedTokens}/${group.totalTokens} (${group.migrationRate}%)`);
      console.log(`   Common Rise SOL (70% reached): ${group.commonRiseSol.toFixed(4)} | Avg Max SOL: ${group.avgMaxSol.toFixed(4)} | Total: ${group.totalMaxSol.toFixed(4)}`);
    });

    console.log('\n' + '='.repeat(120));
    
    // Get summary statistics
    console.log('\n📈 Statistics (30+ token groups, last 24h):');
    console.log(`   Total Qualified Groups: ${filteredGroups.length}`);
    console.log(`   Total Tokens: ${filteredGroups.reduce((sum, g) => sum + g.totalTokens, 0)}`);
    console.log(`   Total Migrated: ${filteredGroups.reduce((sum, g) => sum + g.migratedTokens, 0)}`);
    
    if (filteredGroups.length > 0) {
      const avgTokens = filteredGroups.reduce((sum, g) => sum + g.totalTokens, 0) / filteredGroups.length;
      const avgCommonRise = filteredGroups.reduce((sum, g) => sum + g.commonRiseSol, 0) / filteredGroups.length;
      const avgMaxSol = filteredGroups.reduce((sum, g) => sum + g.avgMaxSol, 0) / filteredGroups.length;
      
      console.log(`   Avg Tokens per Group: ${avgTokens.toFixed(2)}`);
      console.log(`   Avg Common Rise SOL (70%): ${avgCommonRise.toFixed(4)}`);
      console.log(`   Avg Max SOL: ${avgMaxSol.toFixed(4)}`);
      
      if (filteredGroups.length > 0) {
        console.log(`\n🎯 Best Group (Highest 70% Win Rate Rise):`);
        const best = filteredGroups[0];
        console.log(`   ${best.groupKey}`);
        console.log(`   70% Win Rate Rise: ${best.commonRiseSol.toFixed(4)} SOL`);
        console.log(`   Tokens: ${best.totalTokens} | Migration Rate: ${best.migrationRate}%`);
      }
    }

    console.log('\n✅ Analysis completed!\n');

    // Disconnect
    await db.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
