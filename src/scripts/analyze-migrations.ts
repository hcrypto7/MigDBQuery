#!/usr/bin/env ts-node

/**
 * Interactive Token Migration Analysis CLI
 * 
 * Run this script to perform various migration analyses on your token database.
 * Usage: ts-node src/scripts/analyze-migrations.ts
 */

import { DatabaseConnection } from '../database/connection';
import { QueryService } from '../services/query.service';
import { CommonQueries } from '../utils/common-queries';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function formatPercent(num: number): string {
  const color = num >= 75 ? colors.green : num >= 50 ? colors.yellow : colors.red;
  return `${color}${num.toFixed(2)}%${colors.reset}`;
}

function formatSol(num: number): string {
  return `${colors.cyan}${num.toFixed(4)} SOL${colors.reset}`;
}

async function main() {
  const db = DatabaseConnection.getInstance();
  await db.connect();

  const queryService = new QueryService();
  const commonQueries = new CommonQueries(queryService);

  console.log(`${colors.bright}${colors.blue}`);
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         TOKEN MIGRATION ANALYSIS - INTERACTIVE CLI             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  try {
    // Analysis 1: Overall Statistics
    console.log(`\n${colors.bright}📊 OVERALL STATISTICS${colors.reset}`);
    console.log('─'.repeat(70));
    
    const overallSummary = await queryService.getGroupingSummary(
      { mintPattern: true },
      { minMaxSol: 1 }
    );

    console.log(`Total Groups Found:        ${colors.green}${overallSummary.totalGroups}${colors.reset}`);
    console.log(`Total Tokens Analyzed:     ${colors.green}${overallSummary.totalTokens}${colors.reset}`);
    console.log(`Total Migrated Tokens:     ${colors.green}${overallSummary.totalMigrated}${colors.reset}`);
    console.log(`Overall Migration Rate:    ${formatPercent(overallSummary.overallMigrationRate)}`);
    console.log(`Avg Tokens per Group:      ${colors.cyan}${overallSummary.avgTokensPerGroup.toFixed(2)}${colors.reset}`);
    console.log(`Avg Migration Rate/Group:  ${formatPercent(overallSummary.avgMigrationRatePerGroup)}`);

    // Analysis 2: Top Performing Mint Patterns
    console.log(`\n${colors.bright}🏆 TOP 10 MINT PATTERNS (by Migration Rate)${colors.reset}`);
    console.log('─'.repeat(70));
    
    const topPatterns = await commonQueries.getMostSuccessfulMintPatterns(1);
    
    topPatterns.slice(0, 10).forEach((group, idx) => {
      console.log(`\n${colors.yellow}#${idx + 1}${colors.reset} ${colors.bright}${group.groupKey}${colors.reset}`);
      console.log(`   Migration Rate:  ${formatPercent(group.migrationRate)} (${group.migratedTokens}/${group.totalTokens})`);
      console.log(`   Avg Max SOL:     ${formatSol(group.avgMaxSol)}`);
      console.log(`   Total Max SOL:   ${formatSol(group.totalMaxSol)}`);
    });

    // Analysis 3: Pricing Strategy Analysis
    console.log(`\n${colors.bright}💰 PRICING STRATEGIES ANALYSIS${colors.reset}`);
    console.log('─'.repeat(70));
    
    const pricingGroups = await commonQueries.analyzePricingStrategies(1.5);
    
    console.log(`\nFound ${pricingGroups.length} different pricing strategies:\n`);
    pricingGroups.slice(0, 8).forEach((group, idx) => {
      console.log(`${idx + 1}. Price: ${colors.cyan}${JSON.stringify(group.groupIdentifier.unitPrice)}${colors.reset} | ` +
        `Rate: ${formatPercent(group.migrationRate)} | ` +
        `Tokens: ${group.totalTokens} | ` +
        `Avg SOL: ${formatSol(group.avgMaxSol)}`);
    });

    // Analysis 4: Recent High Performers (Last 7 Days)
    console.log(`\n${colors.bright}🔥 RECENT HIGH PERFORMERS (Last 7 Days)${colors.reset}`);
    console.log('─'.repeat(70));
    
    const recentPerformers = await commonQueries.getRecentHighPerformers(7, 1);
    
    recentPerformers.slice(0, 5).forEach((group, idx) => {
      console.log(`\n${idx + 1}. ${group.groupKey}`);
      console.log(`   Migration Rate:  ${formatPercent(group.migrationRate)}`);
      console.log(`   Total Tokens:    ${group.totalTokens}`);
      console.log(`   Avg Max SOL:     ${formatSol(group.avgMaxSol)}`);
    });

    // Analysis 5: Consistent Performers
    console.log(`\n${colors.bright}⭐ CONSISTENT PERFORMERS (≥70% migration, ≥5 tokens)${colors.reset}`);
    console.log('─'.repeat(70));
    
    const consistent = await commonQueries.getConsistentPerformers(70, 5);
    
    if (consistent.length > 0) {
      consistent.slice(0, 8).forEach((group, idx) => {
        console.log(`${idx + 1}. ${group.groupKey.substring(0, 50)}`);
        console.log(`   ${formatPercent(group.migrationRate)} | ${group.totalTokens} tokens | ${formatSol(group.avgMaxSol)}`);
      });
    } else {
      console.log(`${colors.yellow}No groups meet the criteria${colors.reset}`);
    }

    // Analysis 6: High-Value Token Groups
    console.log(`\n${colors.bright}💎 HIGH-VALUE TOKEN GROUPS (Avg SOL ≥5)${colors.reset}`);
    console.log('─'.repeat(70));
    
    const highValue = await commonQueries.getHighValueGroups(5, 3);
    
    if (highValue.length > 0) {
      highValue.slice(0, 5).forEach((group, idx) => {
        console.log(`\n${idx + 1}. ${group.groupKey}`);
        console.log(`   Avg Max SOL:     ${formatSol(group.avgMaxSol)}`);
        console.log(`   Total Max SOL:   ${formatSol(group.totalMaxSol)}`);
        console.log(`   Migration Rate:  ${formatPercent(group.migrationRate)}`);
        console.log(`   Tokens:          ${group.totalTokens}`);
      });
    } else {
      console.log(`${colors.yellow}No groups meet the criteria${colors.reset}`);
    }

    // Analysis 7: ROI Leaders
    console.log(`\n${colors.bright}💵 TOP ROI LEADERS (by Total Max SOL)${colors.reset}`);
    console.log('─'.repeat(70));
    
    const roiLeaders = await commonQueries.getRoiLeaders(1, 10);
    
    roiLeaders.slice(0, 10).forEach((group, idx) => {
      console.log(`${idx + 1}. ${group.groupKey.substring(0, 45)}`);
      console.log(`   Total: ${formatSol(group.totalMaxSol)} | ` +
        `Avg: ${formatSol(group.avgMaxSol)} | ` +
        `Rate: ${formatPercent(group.migrationRate)}`);
    });

    // Analysis 8: Migration Rate Distribution
    console.log(`\n${colors.bright}📈 MIGRATION RATE DISTRIBUTION${colors.reset}`);
    console.log('─'.repeat(70));
    
    const distribution = await commonQueries.getMigrationRateDistribution(1);
    
    console.log(`\nTotal Groups: ${colors.green}${distribution.totalGroups}${colors.reset}`);
    console.log(`Average Migration Rate: ${formatPercent(distribution.avgMigrationRate)}\n`);
    
    Object.entries(distribution.distribution).forEach(([range, count]) => {
      const percentage = distribution.totalGroups > 0 
        ? ((count / distribution.totalGroups) * 100).toFixed(1)
        : '0.0';
      const bar = '█'.repeat(Math.floor((count / distribution.totalGroups) * 30));
      console.log(`${range.padEnd(20)} ${colors.green}${count.toString().padStart(4)}${colors.reset} (${percentage}%) ${bar}`);
    });

    // Analysis 9: Time Period Comparison
    console.log(`\n${colors.bright}⏰ TIME PERIOD COMPARISON${colors.reset}`);
    console.log('─'.repeat(70));
    
    const comparison = await commonQueries.compareTimePeriods(7, 14);
    
    console.log(`\n${colors.cyan}Recent Period (Last 7 days):${colors.reset}`);
    console.log(`  Migration Rate:  ${formatPercent(comparison.recent.overallMigrationRate)}`);
    console.log(`  Total Tokens:    ${comparison.recent.totalTokens}`);
    console.log(`  Total Groups:    ${comparison.recent.totalGroups}`);
    
    console.log(`\n${colors.cyan}Previous Period (14-7 days ago):${colors.reset}`);
    console.log(`  Migration Rate:  ${formatPercent(comparison.older.overallMigrationRate)}`);
    console.log(`  Total Tokens:    ${comparison.older.totalTokens}`);
    console.log(`  Total Groups:    ${comparison.older.totalGroups}`);
    
    console.log(`\n${colors.yellow}Change:${colors.reset}`);
    const rateChange = comparison.improvement.migrationRate;
    const rateColor = rateChange >= 0 ? colors.green : colors.red;
    console.log(`  Migration Rate:  ${rateColor}${rateChange >= 0 ? '+' : ''}${rateChange.toFixed(2)}%${colors.reset}`);

    // Summary
    console.log(`\n${colors.bright}${colors.green}`);
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                  ANALYSIS COMPLETED SUCCESSFULLY               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    console.log(`\n${colors.cyan}💡 Tips:${colors.reset}`);
    console.log(`   • Focus on groups with high migration rates AND volume`);
    console.log(`   • Look for patterns in successful token configurations`);
    console.log(`   • Monitor recent trends vs historical performance`);
    console.log(`   • Consider both migration rate and profitability (SOL)`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Error during analysis:${colors.reset}`, error);
  } finally {
    await db.disconnect();
  }
}

// Run the analysis
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as runInteractiveAnalysis };
