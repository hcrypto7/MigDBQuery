/**
 * Common Query Patterns for Token Migration Analysis
 * 
 * This file contains ready-to-use query patterns for different analysis scenarios.
 */

import { QueryService, GroupingCriteria, QueryFilters } from '../services/query.service';

export class CommonQueries {
  constructor(private queryService: QueryService) {}

  /**
   * Pattern 1: Find the most successful mint patterns
   * Use case: Identify which minting strategies work best
   */
  async getMostSuccessfulMintPatterns(minSol: number = 1) {
    return await this.queryService.getTopMigratingGroups(
      { mintPattern: true },
      { minMaxSol: minSol },
      20
    );
  }

  /**
   * Pattern 2: Analyze pricing strategies
   * Use case: Determine optimal unit price for tokens
   */
  async analyzePricingStrategies(minSol: number = 2) {
    return await this.queryService.fetchTokenGroupsByKey('unitPrice', {
      minMaxSol: minSol
    });
  }

  /**
   * Pattern 3: Find successful publisher configurations
   * Use case: Identify the best combination of settings
   */
  async getSuccessfulPublisherConfigs(minSol: number = 1) {
    return await this.queryService.fetchProfitableTokenGroupsWithMigration(
      {
        mintPattern: true,
        unitPrice: true,
        unitLimit: true
      },
      { minMaxSol: minSol }
    );
  }

  /**
   * Pattern 4: Recent high-performers
   * Use case: Track what's working recently
   */
  async getRecentHighPerformers(days: number = 7, minSol: number = 1) {
    const startTime = Date.now() / 1000 - (days * 86400);
    
    return await this.queryService.getTopMigratingGroups(
      {
        mintPattern: true,
        unitPrice: true
      },
      {
        minMaxSol: minSol,
        startTime
      },
      15
    );
  }

  /**
   * Pattern 5: Bundle strategy analysis
   * Use case: Understand impact of post-mint bundles
   */
  async analyzeBundleStrategies(minSol: number = 1.5) {
    return await this.queryService.fetchProfitableTokenGroupsWithMigration(
      {
        postMintBundle: true,
        mintPattern: true
      },
      { minMaxSol: minSol }
    );
  }

  /**
   * Pattern 6: High-value token groups
   * Use case: Find groups with highest average returns
   */
  async getHighValueGroups(minAvgSol: number = 5, minTokens: number = 3) {
    const allGroups = await this.queryService.fetchProfitableTokenGroupsWithMigration(
      {
        mintPattern: true,
        unitPrice: true
      },
      { minMaxSol: 2 }
    );

    return allGroups
      .filter(g => g.avgMaxSol >= minAvgSol && g.totalTokens >= minTokens)
      .sort((a, b) => b.avgMaxSol - a.avgMaxSol);
  }

  /**
   * Pattern 7: Consistent performers
   * Use case: Find groups with high migration rate AND volume
   */
  async getConsistentPerformers(
    minMigrationRate: number = 70,
    minTokens: number = 5
  ) {
    const allGroups = await this.queryService.fetchProfitableTokenGroupsWithMigration(
      {
        mintPattern: true,
        unitPrice: true
      },
      { minMaxSol: 1 }
    );

    return allGroups
      .filter(
        g => g.migrationRate >= minMigrationRate && g.totalTokens >= minTokens
      )
      .sort((a, b) => b.migrationRate - a.migrationRate);
  }

  /**
   * Pattern 8: Time-based comparison
   * Use case: Compare performance across different time periods
   */
  async compareTimePeriods(
    period1Days: number = 7,
    period2Days: number = 14
  ) {
    const now = Date.now() / 1000;
    const period1Start = now - (period1Days * 86400);
    const period2Start = now - (period2Days * 86400);

    const [recent, older] = await Promise.all([
      this.queryService.getGroupingSummary(
        { mintPattern: true },
        {
          minMaxSol: 1,
          startTime: period1Start
        }
      ),
      this.queryService.getGroupingSummary(
        { mintPattern: true },
        {
          minMaxSol: 1,
          startTime: period2Start,
          endTime: period1Start
        }
      )
    ]);

    return {
      recent: {
        period: `Last ${period1Days} days`,
        ...recent
      },
      older: {
        period: `${period2Days} to ${period1Days} days ago`,
        ...older
      },
      improvement: {
        migrationRate: recent.overallMigrationRate - older.overallMigrationRate,
        tokensPerGroup: recent.avgTokensPerGroup - older.avgTokensPerGroup
      }
    };
  }

  /**
   * Pattern 9: Specific pattern deep dive
   * Use case: Analyze all tokens in a specific mint pattern
   */
  async deepDivePattern(mintPattern: string) {
    const groups = await this.queryService.fetchProfitableTokenGroupsWithMigration(
      {
        mintPattern: true,
        unitPrice: true,
        unitLimit: true
      },
      {
        minMaxSol: 0,
        mintPattern
      }
    );

    const summary = await this.queryService.getGroupingSummary(
      { mintPattern: true },
      { mintPattern }
    );

    return {
      pattern: mintPattern,
      summary,
      subGroups: groups
    };
  }

  /**
   * Pattern 10: ROI leaders
   * Use case: Find groups with best total returns
   */
  async getRoiLeaders(minSol: number = 1, limit: number = 20) {
    const allGroups = await this.queryService.fetchProfitableTokenGroupsWithMigration(
      {
        mintPattern: true,
        unitPrice: true
      },
      { minMaxSol: minSol }
    );

    return allGroups
      .sort((a, b) => b.totalMaxSol - a.totalMaxSol)
      .slice(0, limit);
  }

  /**
   * Pattern 11: Migration rate distribution
   * Use case: Understand the distribution of success rates
   */
  async getMigrationRateDistribution(minSol: number = 1) {
    const allGroups = await this.queryService.fetchProfitableTokenGroupsWithMigration(
      { mintPattern: true },
      { minMaxSol: minSol }
    );

    const distribution = {
      'Very High (90-100%)': 0,
      'High (70-89%)': 0,
      'Medium (50-69%)': 0,
      'Low (30-49%)': 0,
      'Very Low (0-29%)': 0
    };

    allGroups.forEach(g => {
      if (g.migrationRate >= 90) distribution['Very High (90-100%)']++;
      else if (g.migrationRate >= 70) distribution['High (70-89%)']++;
      else if (g.migrationRate >= 50) distribution['Medium (50-69%)']++;
      else if (g.migrationRate >= 30) distribution['Low (30-49%)']++;
      else distribution['Very Low (0-29%)']++;
    });

    return {
      distribution,
      totalGroups: allGroups.length,
      avgMigrationRate: allGroups.reduce((sum, g) => sum + g.migrationRate, 0) / allGroups.length
    };
  }

  /**
   * Pattern 12: Custom combined analysis
   * Use case: Flexible analysis with multiple criteria
   */
  async customAnalysis(
    groupingCriteria: GroupingCriteria,
    filters: QueryFilters,
    sortBy: 'migrationRate' | 'totalMaxSol' | 'avgMaxSol' | 'totalTokens' = 'migrationRate',
    limit: number = 10
  ) {
    const groups = await this.queryService.fetchProfitableTokenGroupsWithMigration(
      groupingCriteria,
      filters
    );

    const sorted = [...groups].sort((a, b) => {
      return b[sortBy] - a[sortBy];
    });

    return sorted.slice(0, limit);
  }
}

// Example usage function
export async function runCommonQueriesExample() {
  const queryService = new QueryService();
  const commonQueries = new CommonQueries(queryService);

  // Example 1: Get most successful patterns
  console.log('Most Successful Mint Patterns:');
  const successfulPatterns = await commonQueries.getMostSuccessfulMintPatterns(1);
  successfulPatterns.slice(0, 5).forEach((group, idx) => {
    console.log(`${idx + 1}. ${group.groupKey} - ${group.migrationRate}%`);
  });

  // Example 2: Compare time periods
  console.log('\nTime Period Comparison:');
  const comparison = await commonQueries.compareTimePeriods(7, 14);
  console.log(`Recent: ${comparison.recent.overallMigrationRate}%`);
  console.log(`Older: ${comparison.older.overallMigrationRate}%`);
  console.log(`Improvement: ${comparison.improvement.migrationRate}%`);

  // Example 3: Get consistent performers
  console.log('\nConsistent Performers:');
  const consistent = await commonQueries.getConsistentPerformers(70, 5);
  consistent.slice(0, 5).forEach((group, idx) => {
    console.log(`${idx + 1}. ${group.groupKey} - ${group.migrationRate}% (${group.totalTokens} tokens)`);
  });
}
