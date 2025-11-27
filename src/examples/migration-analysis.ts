import { DatabaseConnection } from '../database/connection';
import { QueryService } from '../services/query.service';

async function runMigrationAnalysis() {
  const db = DatabaseConnection.getInstance();
  await db.connect();

  const queryService = new QueryService();

  console.log('='.repeat(80));
  console.log('TOKEN MIGRATION ANALYSIS');
  console.log('='.repeat(80));

  try {
    // Example 1: Group by mint pattern only
    console.log('\n📊 Example 1: Grouping by Mint Pattern');
    console.log('-'.repeat(80));
    const patternGroups = await queryService.fetchTokenGroupsByKey('mintPattern', {
      minMaxSol: 1 // Only profitable tokens with maxSol >= 1
    });
    
    console.log(`\nFound ${patternGroups.length} groups by mint pattern:`);
    patternGroups.slice(0, 5).forEach((group, idx) => {
      console.log(`\n${idx + 1}. ${group.groupKey}`);
      console.log(`   Total Tokens: ${group.totalTokens}`);
      console.log(`   Migrated: ${group.migratedTokens} (${group.migrationRate}%)`);
      console.log(`   Avg Max SOL: ${group.avgMaxSol}`);
      console.log(`   Total Max SOL: ${group.totalMaxSol}`);
    });

    // Example 2: Group by multiple keys (mintPattern + unitPrice + unitLimit)
    console.log('\n\n📊 Example 2: Grouping by MintPattern + UnitPrice + UnitLimit');
    console.log('-'.repeat(80));
    const multiKeyGroups = await queryService.fetchProfitableTokenGroupsWithMigration(
      {
        mintPattern: true,
        unitPrice: true,
        unitLimit: true
      },
      {
        minMaxSol: 2, // More profitable tokens
        startTime: Date.now() / 1000 - 86400 * 7 // Last 7 days
      }
    );
    
    console.log(`\nFound ${multiKeyGroups.length} groups by multiple keys:`);
    multiKeyGroups.slice(0, 5).forEach((group, idx) => {
      console.log(`\n${idx + 1}. ${group.groupKey}`);
      console.log(`   Identifiers:`, JSON.stringify(group.groupIdentifier, null, 2));
      console.log(`   Total Tokens: ${group.totalTokens}`);
      console.log(`   Migrated: ${group.migratedTokens} (${group.migrationRate}%)`);
      console.log(`   Avg Max SOL: ${group.avgMaxSol}`);
    });

    // Example 3: Group by postMintBundle characteristics
    console.log('\n\n📊 Example 3: Grouping by Post-Mint Bundle Characteristics');
    console.log('-'.repeat(80));
    const bundleGroups = await queryService.fetchProfitableTokenGroupsWithMigration(
      {
        postMintBundle: true,
        mintPattern: true
      },
      {
        minMaxSol: 1.5
      }
    );
    
    console.log(`\nFound ${bundleGroups.length} groups by bundle characteristics:`);
    bundleGroups.slice(0, 5).forEach((group, idx) => {
      console.log(`\n${idx + 1}. ${group.groupKey}`);
      console.log(`   Total Tokens: ${group.totalTokens}`);
      console.log(`   Migrated: ${group.migratedTokens} (${group.migrationRate}%)`);
      console.log(`   Avg Max SOL: ${group.avgMaxSol}`);
    });

    // Example 4: Top migrating groups with minimum group size
    console.log('\n\n📊 Example 4: Top 10 Migrating Groups (by migration rate)');
    console.log('-'.repeat(80));
    const topGroups = await queryService.getTopMigratingGroups(
      {
        mintPattern: true,
        unitPrice: true
      },
      {
        minMaxSol: 1
      },
      10
    );
    
    topGroups.forEach((group, idx) => {
      console.log(`\n${idx + 1}. ${group.groupKey}`);
      console.log(`   Migration Rate: ${group.migrationRate}%`);
      console.log(`   Total Tokens: ${group.totalTokens} | Migrated: ${group.migratedTokens}`);
      console.log(`   Avg Max SOL: ${group.avgMaxSol}`);
    });

    // Example 5: Overall summary statistics
    console.log('\n\n📊 Example 5: Overall Summary Statistics');
    console.log('-'.repeat(80));
    const summary = await queryService.getGroupingSummary(
      {
        mintPattern: true,
        unitPrice: true
      },
      {
        minMaxSol: 1
      }
    );
    
    console.log('\nSummary:');
    console.log(`   Total Groups: ${summary.totalGroups}`);
    console.log(`   Total Tokens: ${summary.totalTokens}`);
    console.log(`   Total Migrated: ${summary.totalMigrated}`);
    console.log(`   Overall Migration Rate: ${summary.overallMigrationRate}%`);
    console.log(`   Avg Tokens per Group: ${summary.avgTokensPerGroup}`);
    console.log(`   Avg Migration Rate per Group: ${summary.avgMigrationRatePerGroup}%`);

    // Example 6: Detailed view of a specific group with token list
    console.log('\n\n📊 Example 6: Detailed Token List for Top Group');
    console.log('-'.repeat(80));
    if (topGroups.length > 0) {
      const topGroup = topGroups[0];
      console.log(`\nGroup: ${topGroup.groupKey}`);
      console.log(`Migration Rate: ${topGroup.migrationRate}%\n`);
      console.log('Tokens in this group:');
      topGroup.tokens.slice(0, 10).forEach((token, idx) => {
        console.log(`  ${idx + 1}. ${token.mint}`);
        console.log(`     Migrated: ${token.migrated ? '✅' : '❌'} | Max SOL: ${token.maxSol} | Max Price: ${token.maxPrice}`);
      });
      if (topGroup.tokens.length > 10) {
        console.log(`  ... and ${topGroup.tokens.length - 10} more tokens`);
      }
    }

  } catch (error) {
    console.error('Error running migration analysis:', error);
  } finally {
    await db.disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  runMigrationAnalysis().catch(console.error);
}

export { runMigrationAnalysis };
