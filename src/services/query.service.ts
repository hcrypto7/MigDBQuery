import { ITokenInfoDocument, TokenInfoModel } from '../models/Token.model';

export class QueryService {
  
  // ============= TOKEN QUERIES =============
  
  /**
   * Get recent tokens (last N days)
   */
  async findRecentTokens(days: number = 1): Promise<ITokenInfoDocument[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return await TokenInfoModel.find({
      createdAt: {$gte: startDate}
    })
    .sort({createdAt: -1})
    .exec();
  }

  /**
   * Find token by mint address
   */
  async findTokenByMint(mint: string): Promise<ITokenInfoDocument | null> {
    return await TokenInfoModel.findOne({ mint }).exec();
  }

  /**
   * Find tokens with high max SOL (liquidity)
   */
  async findHighLiquidityTokens(minMaxSol: number = 5): Promise<ITokenInfoDocument[]> {
    return await TokenInfoModel.find({
      maxSol: { $gte: minMaxSol }
    })
    .sort({ maxSol: -1 })
    .limit(50)
    .exec();
  }

  /**
   * Find extended tokens
   */
  async findExtendedTokens(): Promise<ITokenInfoDocument[]> {
    return await TokenInfoModel.find({
      extended: true
    })
    .sort({ createdAt: -1 })
    .exec();
  }

  /**
   * Get token statistics by MEV service usage
   */
  async getTokenStatsByMEVService(): Promise<any> {
    return await TokenInfoModel.aggregate([
      {
        $group: {
          _id: null,
          totalTokens: { $sum: 1 },
          jitoCount: { $sum: { $cond: [{ $gt: ['$jito', 0] }, 1, 0] } },
          bloxRouteCount: { $sum: { $cond: [{ $gt: ['$bloxRoute', 0] }, 1, 0] } },
          photonCount: { $sum: { $cond: [{ $gt: ['$photon', 0] }, 1, 0] } },
          axiomCount: { $sum: { $cond: [{ $gt: ['$axiom', 0] }, 1, 0] } },
          extendedCount: { $sum: { $cond: ['$extended', 1, 0] } },
          lookupTableCount: { $sum: { $cond: ['$lookupTable', 1, 0] } }
        }
      }
    ]);
  }

  /**
   * Get tokens with highest max price
   */
  async getTopPriceTokens(limit: number = 10): Promise<ITokenInfoDocument[]> {
    return await TokenInfoModel.find({
      maxPrice: { $gt: 0 }
    })
    .sort({ maxPrice: -1 })
    .limit(limit)
    .exec();
  }

  /**
   * Get pattern frequency analysis
   */
  async getPatternFrequency(limit: number = 20): Promise<any> {
    return await TokenInfoModel.aggregate([
      {
        $match: {
          mintPattern: { $ne: '' }
        }
      },
      {
        $group: {
          _id: '$mintPattern',
          count: { $sum: 1 },
          avgMaxSol: { $avg: '$maxSol' },
          tokens: { $push: '$mint' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: limit
      }
    ]);
  }

  /**
   * Get comprehensive token overview
   */
  async getTokenOverview(): Promise<any> {
    const [stats] = await TokenInfoModel.aggregate([
      {
        $group: {
          _id: null,
          totalTokens: { $sum: 1 },
          avgMaxSol: { $avg: '$maxSol' },
          avgMaxPrice: { $avg: '$maxPrice' },
          avgMintBuyAmt: { $avg: '$mintBuyAmt' },
          extendedCount: { $sum: { $cond: ['$extended', 1, 0] } },
          migratedCount: { $sum: { $cond: [{ $gt: ['$migrateTime', 0] }, 1, 0] } },
          avgTracesLen: { $avg: '$tracesLen' },
          avgTradesLen: { $avg: '$tradesLen' }
        }
      }
    ]);

    return stats;
  }

  /**
   * Count total tokens in database
   */
  async countTotalTokens(): Promise<number> {
    return await TokenInfoModel.countDocuments().exec();
  }

  /**
   * Get latest token
   */
  async getLatestToken(): Promise<ITokenInfoDocument | null> {
    return await TokenInfoModel.findOne()
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find profitable token groups based on mint pattern and compute units
   * Groups tokens by mintPattern (primary) and optionally by unitPrice/unitLimit (secondary)
   * Calculates profit as: maxSol - min(mintSlotSol, firstSlotSol)
   * Higher rise in SOL = more profitable
   * 
   * @param options - Configuration options
   * @param options.groupByComputeUnits - If true, adds unitPrice and unitLimit as subgroup keys
   * @param options.minRiseSol - Minimum SOL rise to include in results (default: 0)
   * @param options.minTokensInGroup - Minimum number of tokens required in a group (default: 2)
   * @param options.limit - Maximum number of groups to return (default: 50)
   * @param options.sortBy - Sort by 'avgRiseSol', 'maxRiseSol', or 'totalTokens' (default: 'avgRiseSol')
   * @param options.daysBack - Number of days back to analyze (default: 3)
   */
  async findProfitableTokenGroups(options: {
    groupByComputeUnits?: boolean;
    minRiseSol?: number;
    minTokensInGroup?: number;
    limit?: number;
    sortBy?: 'avgRiseSol' | 'maxRiseSol' | 'totalTokens';
    daysBack?: number;
  } = {}): Promise<any> {
    const {
      groupByComputeUnits = false,
      minRiseSol = 0,
      minTokensInGroup = 2,
      limit = 50,
      sortBy = 'avgRiseSol',
      daysBack = 3
    } = options;

    // Calculate the date filter
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Build the group _id dynamically
    const groupId: any = {
      mintPattern: '$mintPattern'
    };

    if (groupByComputeUnits) {
      groupId.unitPrice = '$unitPrice';
      groupId.unitLimit = '$unitLimit';
    }

    // Define sort field
    const sortField = sortBy === 'totalTokens' ? 'totalTokens' : 
                      sortBy === 'maxRiseSol' ? 'maxRiseSol' : 
                      'avgRiseSol';

    const pipeline: any[] = [
      // Filter by date range and non-empty patterns
      {
        $match: {
          mintPattern: { $ne: '' },
          createdAt: { $gte: startDate }
        }
      },
      // Add calculated field for buy price (use the lower of mintSlotSol or firstSlotSol)
      {
        $addFields: {
          buyPriceSol: {
            $cond: {
              if: { $lte: ['$mintSlotSol', '$firstSlotSol'] },
              then: '$mintSlotSol',
              else: '$firstSlotSol'
            }
          }
        }
      },
      // Add calculated field for profit (riseSol)
      {
        $addFields: {
          riseSol: {
            $subtract: ['$maxSol', '$buyPriceSol']
          }
        }
      },
      // Filter by minimum rise
      {
        $match: {
          riseSol: { $gte: minRiseSol }
        }
      },
      // Group by pattern (and optionally compute units)
      {
        $group: {
          _id: groupId,
          totalTokens: { $sum: 1 },
          avgRiseSol: { $avg: '$riseSol' },
          maxRiseSol: { $max: '$riseSol' },
          minRiseSol: { $min: '$riseSol' },
          avgMaxSol: { $avg: '$maxSol' },
          avgBuyPriceSol: { $avg: '$buyPriceSol' },
          totalRiseSol: { $sum: '$riseSol' },
          // Collect detailed token data for threshold simulation
          tokens: { $push: {
            mint: '$mint',
            riseSol: '$riseSol',
            maxSol: '$maxSol',
            buyPriceSol: '$buyPriceSol'
          }}
        }
      },
      // Filter by minimum tokens in group
      {
        $match: {
          totalTokens: { $gte: minTokensInGroup }
        }
      },
      // Calculate optimal threshold by simulating different sell points
      {
        $addFields: {
          // Test multiple threshold candidates (from 10% to 90% of avg rise)
          thresholdCandidates: {
            $map: {
              input: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
              as: 'multiplier',
              in: { $multiply: ['$avgRiseSol', '$$multiplier'] }
            }
          }
        }
      },
      // Simulate results for each threshold
      {
        $addFields: {
          thresholdSimulations: {
            $map: {
              input: '$thresholdCandidates',
              as: 'threshold',
              in: {
                threshold: '$$threshold',
                results: {
                  $map: {
                    input: '$tokens',
                    as: 'token',
                    in: {
                      // If token's maxSol >= threshold, it's a win
                      isWin: { $gte: ['$$token.riseSol', '$$threshold'] },
                      // Actual profit/loss at this threshold
                      profitLoss: {
                        $cond: {
                          if: { $gte: ['$$token.riseSol', '$$threshold'] },
                          then: '$$threshold',  // Win: get the threshold amount
                          else: {
                            // Loss: token peaked below threshold, we get actual rise (could be negative scenario)
                            $cond: {
                              if: { $gt: ['$$token.riseSol', 0] },
                              then: '$$token.riseSol',  // Got some profit but less than threshold
                              else: 0  // No profit at all
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      // Calculate statistics for each threshold simulation
      {
        $addFields: {
          thresholdAnalysis: {
            $map: {
              input: '$thresholdSimulations',
              as: 'sim',
              in: {
                threshold: '$$sim.threshold',
                winCount: {
                  $size: {
                    $filter: {
                      input: '$$sim.results',
                      as: 'r',
                      cond: '$$r.isWin'
                    }
                  }
                },
                lossCount: {
                  $size: {
                    $filter: {
                      input: '$$sim.results',
                      as: 'r',
                      cond: { $not: '$$r.isWin' }
                    }
                  }
                },
                totalProfit: {
                  $sum: {
                    $map: {
                      input: '$$sim.results',
                      as: 'r',
                      in: '$$r.profitLoss'
                    }
                  }
                },
                avgProfit: {
                  $avg: {
                    $map: {
                      input: '$$sim.results',
                      as: 'r',
                      in: '$$r.profitLoss'
                    }
                  }
                }
              }
            }
          }
        }
      },
      // Calculate win rate and profitability score for each threshold
      {
        $addFields: {
          thresholdScores: {
            $map: {
              input: '$thresholdAnalysis',
              as: 'analysis',
              in: {
                threshold: '$$analysis.threshold',
                winCount: '$$analysis.winCount',
                lossCount: '$$analysis.lossCount',
                winRate: {
                  $divide: ['$$analysis.winCount', '$totalTokens']
                },
                totalProfit: '$$analysis.totalProfit',
                avgProfit: '$$analysis.avgProfit',
                // Profitability score = winRate * avgProfit
                profitabilityScore: {
                  $multiply: [
                    { $divide: ['$$analysis.winCount', '$totalTokens'] },
                    '$$analysis.avgProfit'
                  ]
                }
              }
            }
          }
        }
      },
      // Find the optimal threshold (highest profitability score)
      {
        $addFields: {
          optimalThresholdData: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: '$thresholdScores',
                  sortBy: { profitabilityScore: -1 }
                }
              },
              0
            ]
          },
          // Also get conservative (highest win rate) and aggressive (highest avg profit)
          conservativeThresholdData: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: '$thresholdScores',
                  sortBy: { winRate: -1 }
                }
              },
              0
            ]
          },
          aggressiveThresholdData: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: '$thresholdScores',
                  sortBy: { avgProfit: -1 }
                }
              },
              0
            ]
          }
        }
      },
      // Sort by chosen metric
      {
        $sort: { [sortField]: -1 }
      },
      // Limit results
      {
        $limit: limit
      },
      // Project final shape with cleaner structure
      {
        $project: {
          _id: 1,
          mintPattern: '$_id.mintPattern',
          unitPrice: '$_id.unitPrice',
          unitLimit: '$_id.unitLimit',
          totalTokens: 1,
          avgRiseSol: 1,
          maxRiseSol: 1,
          minRiseSol: 1,
          avgMaxSol: 1,
          avgBuyPriceSol: 1,
          totalRiseSol: 1,
          profitabilityScore: {
            $multiply: ['$avgRiseSol', '$totalTokens']
          },
          
          // Optimal threshold (best profitability score)
          recommendedSellThreshold: '$optimalThresholdData.threshold',
          recommendedWinRate: { 
            $multiply: ['$optimalThresholdData.winRate', 100] 
          },
          recommendedWinCount: '$optimalThresholdData.winCount',
          recommendedLossCount: '$optimalThresholdData.lossCount',
          recommendedAvgProfit: '$optimalThresholdData.avgProfit',
          recommendedTotalProfit: '$optimalThresholdData.totalProfit',
          
          // Conservative threshold (highest win rate)
          conservativeThreshold: '$conservativeThresholdData.threshold',
          conservativeWinRate: {
            $multiply: ['$conservativeThresholdData.winRate', 100]
          },
          conservativeWinCount: '$conservativeThresholdData.winCount',
          conservativeLossCount: '$conservativeThresholdData.lossCount',
          conservativeAvgProfit: '$conservativeThresholdData.avgProfit',
          
          // Aggressive threshold (highest average profit)
          aggressiveThreshold: '$aggressiveThresholdData.threshold',
          aggressiveWinRate: {
            $multiply: ['$aggressiveThresholdData.winRate', 100]
          },
          aggressiveWinCount: '$aggressiveThresholdData.winCount',
          aggressiveLossCount: '$aggressiveThresholdData.lossCount',
          aggressiveAvgProfit: '$aggressiveThresholdData.avgProfit',
          
          // Calculate absolute SOL values for thresholds (buyPrice + threshold)
          recommendedSellSol: {
            $add: ['$avgBuyPriceSol', '$optimalThresholdData.threshold']
          },
          conservativeSellSol: {
            $add: ['$avgBuyPriceSol', '$conservativeThresholdData.threshold']
          },
          aggressiveSellSol: {
            $add: ['$avgBuyPriceSol', '$aggressiveThresholdData.threshold']
          },
          
          // Risk assessment
          riskLevel: {
            $cond: {
              if: { $lt: ['$optimalThresholdData.winRate', 0.6] },
              then: 'HIGH',
              else: {
                $cond: {
                  if: { $lt: ['$optimalThresholdData.winRate', 0.75] },
                  then: 'MEDIUM',
                  else: 'LOW'
                }
              }
            }
          },
          
          // All threshold options for reference
          allThresholdOptions: '$thresholdScores',
          
          tokens: { $slice: ['$tokens', 5] } // Return top 5 tokens as examples
        }
      }
    ];

    return await TokenInfoModel.aggregate(pipeline);
  }

  /**
   * Find most profitable individual tokens by rise in SOL
   * @param limit - Maximum number of tokens to return
   * @param minRiseSol - Minimum SOL rise to include
   */
  async findMostProfitableTokens(limit: number = 20, minRiseSol: number = 0): Promise<any[]> {
    return await TokenInfoModel.aggregate([
      {
        $addFields: {
          buyPriceSol: {
            $cond: {
              if: { $lte: ['$mintSlotSol', '$firstSlotSol'] },
              then: '$mintSlotSol',
              else: '$firstSlotSol'
            }
          }
        }
      },
      {
        $addFields: {
          riseSol: {
            $subtract: ['$maxSol', '$buyPriceSol']
          }
        }
      },
      {
        $match: {
          riseSol: { $gte: minRiseSol }
        }
      },
      {
        $sort: { riseSol: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          mint: 1,
          mintPattern: 1,
          maxSol: 1,
          buyPriceSol: 1,
          riseSol: 1,
          unitPrice: 1,
          unitLimit: 1,
          extended: 1,
          createdAt: 1
        }
      }
    ]);
  }
}
