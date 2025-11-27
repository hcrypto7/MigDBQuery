/**
 * CUSTOM ANALYSIS TEMPLATE
 * 
 * Copy this file and customize it for your specific analysis needs.
 * This template shows you how to mix and match different query options.
 */

import { DatabaseConnection } from '../database/connection';
import { QueryService } from '../services/query.service';
import { CommonQueries } from '../utils/common-queries';

async function myCustomAnalysis() {
  const db = DatabaseConnection.getInstance();
  await db.connect();

  const queryService = new QueryService();
  const commonQueries = new CommonQueries(queryService);

  console.log('🔍 Starting Custom Analysis...\n');

  try {
    // ========================================
    // CUSTOMIZE THIS SECTION FOR YOUR NEEDS
    // ========================================

    // Option 1: Analyze by mint pattern only
    console.log('📊 Analysis 1: Mint Pattern Groups');
    console.log('─'.repeat(50));
    const patternGroups = await queryService.fetchTokenGroupsByKey('mintPattern', {
      minMaxSol: 1,  // Change this threshold
      // startTime: Date.now() / 1000 - 86400 * 30,  // Uncomment for last 30 days
    });
    
    console.log(`Found ${patternGroups.length} groups\n`);
    patternGroups.slice(0, 5).forEach((g, i) => {
      console.log(`${i + 1}. ${g.groupKey}`);
      console.log(`   Tokens: ${g.totalTokens} | Migrated: ${g.migratedTokens} (${g.migrationRate}%)`);
      console.log(`   Avg SOL: ${g.avgMaxSol} | Total SOL: ${g.totalMaxSol}\n`);
    });

    // Option 2: Combine multiple grouping keys
    console.log('\n📊 Analysis 2: Multi-Key Grouping (Pattern + Price + Limit)');
    console.log('─'.repeat(50));
    const multiGroups = await queryService.fetchProfitableTokenGroupsWithMigration(
      {
        mintPattern: true,   // Keep or remove as needed
        unitPrice: true,     // Keep or remove as needed
        unitLimit: true,     // Keep or remove as needed
        // postMintBundle: true,  // Uncomment to include bundle data
      },
      {
        minMaxSol: 2,  // Adjust threshold
        // mintPattern: 'your-specific-pattern',  // Uncomment to filter specific pattern
      }
    );
    
    console.log(`Found ${multiGroups.length} groups\n`);
    multiGroups.slice(0, 3).forEach((g, i) => {
      console.log(`${i + 1}. ${g.groupKey}`);
      console.log(`   Migration: ${g.migrationRate}% | Tokens: ${g.totalTokens}`);
      console.log(`   Group Details:`, g.groupIdentifier);
      console.log('');
    });

    // Option 3: Find your best configurations
    console.log('\n📊 Analysis 3: Top Performers');
    console.log('─'.repeat(50));
    const topGroups = await queryService.getTopMigratingGroups(
      {
        mintPattern: true,
        unitPrice: true,
      },
      {
        minMaxSol: 1,
      },
      10  // Top 10 groups
    );

    topGroups.forEach((g, i) => {
      console.log(`${i + 1}. Migration: ${g.migrationRate}% | ${g.groupKey}`);
    });

    // Option 4: Get detailed token list from a specific group
    console.log('\n\n📊 Analysis 4: Detailed Token List');
    console.log('─'.repeat(50));
    if (topGroups.length > 0) {
      const bestGroup = topGroups[0];
      console.log(`\nAnalyzing group: ${bestGroup.groupKey}`);
      console.log(`Migration Rate: ${bestGroup.migrationRate}%\n`);
      
      console.log('Individual tokens:');
      bestGroup.tokens.slice(0, 15).forEach((token, idx) => {
        const status = token.migrated ? '✅' : '❌';
        console.log(`  ${status} ${token.mint.substring(0, 20)}... | SOL: ${token.maxSol.toFixed(4)}`);
      });
      
      if (bestGroup.tokens.length > 15) {
        console.log(`  ... and ${bestGroup.tokens.length - 15} more tokens`);
      }
    }

    // Option 5: Summary statistics
    console.log('\n\n📊 Analysis 5: Summary Statistics');
    console.log('─'.repeat(50));
    const summary = await queryService.getGroupingSummary(
      { mintPattern: true },
      { minMaxSol: 1 }
    );
    
    console.log(`Total Groups:           ${summary.totalGroups}`);
    console.log(`Total Tokens:           ${summary.totalTokens}`);
    console.log(`Total Migrated:         ${summary.totalMigrated}`);
    console.log(`Overall Migration Rate: ${summary.overallMigrationRate}%`);
    console.log(`Avg Tokens/Group:       ${summary.avgTokensPerGroup}`);

    // Option 6: Time-based comparison
    console.log('\n\n📊 Analysis 6: Recent vs Previous Performance');
    console.log('─'.repeat(50));
    const timeComparison = await commonQueries.compareTimePeriods(7, 14);
    
    console.log(`\nLast 7 days:       ${timeComparison.recent.overallMigrationRate}%`);
    console.log(`7-14 days ago:     ${timeComparison.older.overallMigrationRate}%`);
    console.log(`Change:            ${timeComparison.improvement.migrationRate >= 0 ? '+' : ''}${timeComparison.improvement.migrationRate.toFixed(2)}%`);

    // Option 7: Filter by specific criteria
    console.log('\n\n📊 Analysis 7: Custom Filtered Query');
    console.log('─'.repeat(50));
    const customFiltered = await queryService.fetchProfitableTokenGroupsWithMigration(
      { mintPattern: true },
      {
        minMaxSol: 3,  // High performers only
        startTime: Date.now() / 1000 - 86400 * 7,  // Last 7 days
        // endTime: Date.now() / 1000,
        // unitPrice: 1000000,  // Specific unit price
        // unitLimit: 250000,   // Specific unit limit
      }
    );
    
    console.log(`Found ${customFiltered.length} high-performing groups in last 7 days\n`);
    customFiltered.slice(0, 5).forEach((g, i) => {
      console.log(`${i + 1}. ${g.groupKey}`);
      console.log(`   ${g.migrationRate}% migration | ${g.avgMaxSol.toFixed(2)} avg SOL`);
    });

    // Option 8: Consistent performers (reliable groups)
    console.log('\n\n📊 Analysis 8: Reliable Token Groups');
    console.log('─'.repeat(50));
    const consistent = await commonQueries.getConsistentPerformers(
      70,   // Minimum 70% migration rate
      5     // Minimum 5 tokens
    );
    
    console.log(`Found ${consistent.length} reliable groups:\n`);
    consistent.slice(0, 5).forEach((g, i) => {
      console.log(`${i + 1}. ${g.groupKey}`);
      console.log(`   Rate: ${g.migrationRate}% | Tokens: ${g.totalTokens} | Avg SOL: ${g.avgMaxSol.toFixed(2)}`);
    });

    // ========================================
    // ADD YOUR CUSTOM ANALYSIS BELOW
    // ========================================

    // Example: Find groups matching YOUR specific criteria
    console.log('\n\n📊 YOUR CUSTOM ANALYSIS');
    console.log('─'.repeat(50));
    
    // Your code here...
    // const myGroups = await queryService.fetchProfitableTokenGroupsWithMigration(
    //   { ... your grouping ... },
    //   { ... your filters ... }
    // );

    console.log('\n✅ Analysis Complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.disconnect();
  }
}

// Export for use in other files
export { myCustomAnalysis };

// Run if executed directly
if (require.main === module) {
  myCustomAnalysis().catch(console.error);
}

/* 
 * QUICK REFERENCE:
 * 
 * Grouping Keys:
 *   - mintPattern: true      // Group by mint pattern
 *   - unitPrice: true        // Group by price
 *   - unitLimit: true        // Group by limit
 *   - postMintBundle: true   // Group by bundle characteristics
 * 
 * Filters:
 *   - minMaxSol: number      // Minimum profit (e.g., 1)
 *   - startTime: timestamp   // Start time in Unix seconds
 *   - endTime: timestamp     // End time in Unix seconds
 *   - mintPattern: string    // Specific pattern to filter
 *   - unitPrice: number      // Specific price to filter
 *   - unitLimit: number      // Specific limit to filter
 * 
 * Common Queries (from CommonQueries class):
 *   - getMostSuccessfulMintPatterns(minSol)
 *   - analyzePricingStrategies(minSol)
 *   - getRecentHighPerformers(days, minSol)
 *   - getConsistentPerformers(minRate, minTokens)
 *   - compareTimePeriods(period1, period2)
 *   - getHighValueGroups(minAvgSol, minTokens)
 *   - getRoiLeaders(minSol, limit)
 * 
 * To run:
 *   ts-node src/templates/custom-analysis-template.ts
 */
