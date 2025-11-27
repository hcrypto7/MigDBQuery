import { ITokenInfoDocument, TokenInfoModel } from '../models/Token.model';

export type GroupingKey = 'mintPattern' | 'unitPrice' | 'unitLimit' | 'postMintBundle';

export type GroupingCriteria = {
  mintPattern?: boolean;
  unitPrice?: boolean;
  unitLimit?: boolean;
  postMintBundle?: boolean;
};

export type TokenGroupStats = {
  groupKey: string;
  groupIdentifier: Record<string, any>;
  totalTokens: number;
  migratedTokens: number;
  migrationRate: number; // percentage
  profitableTokens: number; // tokens with maxSol > threshold
  avgMaxSol: number;
  totalMaxSol: number;
  commonRiseSol: number; // Rise SOL that 70% of tokens reached (sell point)
  tokens: Array<{
    mint: string;
    mintTime: number;
    migrated: boolean;
    maxSol: number;
    maxPrice: number;
    mintSlotSol?: number;
  }>;
};

export interface QueryFilters {
  minMaxSol?: number; // minimum maxSol to consider as profitable
  startTime?: number; // filter by mintTime >= startTime
  endTime?: number; // filter by mintTime <= endTime
  mintPattern?: string; // filter by specific mint pattern
  unitPrice?: number; // filter by specific unit price
  unitLimit?: number; // filter by specific unit limit
  winPercent?: number;
}

export class QueryService {
  /**
   * Fetch profitable token groups with migration rates
   * @param groupingCriteria - Keys to group tokens by
   * @param filters - Query filters
   * @returns Array of token group statistics with migration rates
   */
  async fetchProfitableTokenGroupsWithMigration(
    groupingCriteria: GroupingCriteria,
    filters: QueryFilters = {}
  ): Promise<TokenGroupStats[]> {
    const { minMaxSol = 0, startTime, endTime, mintPattern, unitPrice, unitLimit, winPercent=70 } = filters;

    // Build the match query
    const matchQuery: any = {};
    
    if (minMaxSol > 0) {
      matchQuery.maxSol = { $gte: minMaxSol };
    }
    
    if (startTime !== undefined) {
      matchQuery.mintTime = { ...matchQuery.mintTime, $gte: startTime };
    }
    
    if (endTime !== undefined) {
      matchQuery.mintTime = { ...matchQuery.mintTime, $lte: endTime };
    }
    
    if (mintPattern) {
      matchQuery.mintPattern = mintPattern;
    }
    
    if (unitPrice !== undefined) {
      matchQuery.unitPrice = unitPrice;
    }
    
    if (unitLimit !== undefined) {
      matchQuery.unitLimit = unitLimit;
    }

    // Build grouping keys
    const groupId: any = {};
    const selectedKeys: string[] = [];
    
    if (groupingCriteria.mintPattern) {
      groupId.mintPattern = '$mintPattern';
      selectedKeys.push('mintPattern');
    }
    
    if (groupingCriteria.unitPrice) {
      groupId.unitPrice = '$unitPrice';
      selectedKeys.push('unitPrice');
    }
    
    if (groupingCriteria.unitLimit) {
      groupId.unitLimit = '$unitLimit';
      selectedKeys.push('unitLimit');
    }
    
    if (groupingCriteria.postMintBundle) {
      groupId.bundleSize = '$postMintBundle.bundleSize';
      groupId.totalBuySol = { $round: ['$postMintBundle.totalBuySol', 2] };
      selectedKeys.push('postMintBundle');
    }

    // Aggregate query
    const results = await TokenInfoModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupId,
          totalTokens: { $sum: 1 },
          migratedTokens: {
            $sum: { $cond: ['$migrated', 1, 0] }
          },
          totalMaxSol: { $sum: '$maxSol' },
          avgMaxSol: { $avg: '$maxSol' },
          tokens: {
            $push: {
              mint: '$mint',
              mintTime: '$mintTime',
              migrated: '$migrated',
              maxSol: '$maxSol',
              maxPrice: '$maxPrice',
              mintSlotSol: '$mintSlotSol',
              mintBuyAmt: '$mintBuyAmt',
              mintPattern: '$mintPattern',
              unitPrice: '$unitPrice',
              unitLimit: '$unitLimit',
              postMintBundle: '$postMintBundle'
            }
          }
        }
      },
      {
        $project: {
          groupIdentifier: '$_id',
          totalTokens: 1,
          migratedTokens: 1,
          migrationRate: {
            $multiply: [
              { $divide: ['$migratedTokens', '$totalTokens'] },
              100
            ]
          },
          profitableTokens: '$totalTokens',
          avgMaxSol: { $round: ['$avgMaxSol', 4] },
          totalMaxSol: { $round: ['$totalMaxSol', 4] },
          tokens: 1
        }
      },
      { $sort: { migrationRate: -1, totalTokens: -1 } }
    ]);

    return results.map((result, index) => {
      const groupKeyParts: string[] = [];
      
      if (result.groupIdentifier.mintPattern) {
        groupKeyParts.push(`pattern:${result.groupIdentifier.mintPattern}`);
      }
      if (result.groupIdentifier.unitPrice !== undefined) {
        groupKeyParts.push(`price:${result.groupIdentifier.unitPrice}`);
      }
      if (result.groupIdentifier.unitLimit !== undefined) {
        groupKeyParts.push(`limit:${result.groupIdentifier.unitLimit}`);
      }
      if (result.groupIdentifier.bundleSize !== undefined) {
        groupKeyParts.push(`bundle:${result.groupIdentifier.bundleSize}-${result.groupIdentifier.totalBuySol}`);
      }

      // Calculate rise SOL (maxSol - mintSlotSol) for each token
      // If mintSlotSol < 0.05, use mintBuyAmt instead
      const riseSols = result.tokens
        .map((t: any) => {
          const maxSol = t.maxSol || 0;
          const mintSlotSol = t.mintSlotSol || 0;
          const mintBuyAmt = t.mintBuyAmt || 0;
          
          // Use mintBuyAmt if mintSlotSol is too small
          const baseValue = mintSlotSol < 0.05 ? mintBuyAmt : mintSlotSol;
          return maxSol - baseValue;
        })
        .filter((rise: number) => !isNaN(rise))
        .sort((a: number, b: number) => a - b);
      
      // Get common rise SOL that winPercent% of tokens reached (30th percentile from bottom)
      // This means 70% of tokens are AT OR ABOVE this value
      const percentileIndex = Math.floor(riseSols.length * (1 - winPercent / 100));
      const commonRiseSol = riseSols.length > 0 ? riseSols[percentileIndex] : 0;

      return {
        groupKey: groupKeyParts.join('|') || `group-${index}`,
        groupIdentifier: result.groupIdentifier,
        totalTokens: result.totalTokens,
        migratedTokens: result.migratedTokens,
        migrationRate: Math.round(result.migrationRate * 100) / 100,
        profitableTokens: result.profitableTokens,
        avgMaxSol: result.avgMaxSol,
        totalMaxSol: result.totalMaxSol,
        commonRiseSol: Math.round(commonRiseSol * 10000) / 10000,
        tokens: result.tokens.map((t: any) => ({
          mint: t.mint,
          mintTime: t.mintTime,
          migrated: t.migrated,
          maxSol: t.maxSol,
          maxPrice: t.maxPrice,
          mintSlotSol: t.mintSlotSol,
          mintBuyAmt: t.mintBuyAmt
        }))
      };
    });
  }

  /**
   * Quick query for single-key grouping
   */
  async fetchTokenGroupsByKey(
    groupKey: GroupingKey,
    filters: QueryFilters = {}
  ): Promise<TokenGroupStats[]> {
    const criteria: GroupingCriteria = {
      [groupKey]: true
    };
    return this.fetchProfitableTokenGroupsWithMigration(criteria, filters);
  }

  /**
   * Get top migrating groups
   */
  async getTopMigratingGroups(
    groupingCriteria: GroupingCriteria,
    filters: QueryFilters = {},
    limit: number = 10
  ): Promise<TokenGroupStats[]> {
    const results = await this.fetchProfitableTokenGroupsWithMigration(groupingCriteria, filters);
    return results
      .filter(g => g.totalTokens >= 2) // Only groups with at least 2 tokens
      .slice(0, limit);
  }

  /**
   * Get summary statistics across all groups
   */
  async getGroupingSummary(
    groupingCriteria: GroupingCriteria,
    filters: QueryFilters = {}
  ): Promise<{
    totalGroups: number;
    totalTokens: number;
    totalMigrated: number;
    overallMigrationRate: number;
    avgTokensPerGroup: number;
    avgMigrationRatePerGroup: number;
  }> {
    const groups = await this.fetchProfitableTokenGroupsWithMigration(groupingCriteria, filters);
    
    const totalGroups = groups.length;
    const totalTokens = groups.reduce((sum, g) => sum + g.totalTokens, 0);
    const totalMigrated = groups.reduce((sum, g) => sum + g.migratedTokens, 0);
    const overallMigrationRate = totalTokens > 0 ? (totalMigrated / totalTokens) * 100 : 0;
    const avgTokensPerGroup = totalGroups > 0 ? totalTokens / totalGroups : 0;
    const avgMigrationRatePerGroup = totalGroups > 0 
      ? groups.reduce((sum, g) => sum + g.migrationRate, 0) / totalGroups 
      : 0;

    return {
      totalGroups,
      totalTokens,
      totalMigrated,
      overallMigrationRate: Math.round(overallMigrationRate * 100) / 100,
      avgTokensPerGroup: Math.round(avgTokensPerGroup * 100) / 100,
      avgMigrationRatePerGroup: Math.round(avgMigrationRatePerGroup * 100) / 100
    };
  }
}
