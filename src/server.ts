import express, { Request, Response } from 'express';
import cors from 'cors';
import { DatabaseConnection } from './database/connection';
import { QueryService } from './services/query.service';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

interface PatternDataItem {
  mintPattern: string;
  unitPrice: number;
  unitLimit: number;
  mintBuyAmt: number;
  commonRise: number;
  dropRate: number;
  tokensWithDrop: number;
  totalTokens: number;
}

interface PatternDataResponse {
  patternData: PatternDataItem[];
}

// Endpoint to get token group analysis
app.get('/api/pattern-analysis', async (req: Request, res: Response) => {
  try {
    const queryService = new QueryService();
    
    // Get query parameters with defaults
    const minTokens = parseInt(req.query.minTokens as string) || 30;
    const hours = parseInt(req.query.hours as string) || 24;
    const minMaxSol = parseFloat(req.query.minMaxSol as string) || 1;
    const winPercent = parseFloat(req.query.winPercent as string) || 70;
    
    const timeAgo = Math.floor(Date.now() / 1000) - (hours * 3600);
    
    // Fetch and analyze token groups
    const complexGroups = await queryService.fetchProfitableTokenGroupsWithMigration(
      {
        mintPattern: true,
        unitPrice: true,
        unitLimit: true,
        mintBuyAmt: true
      },
      {
        minMaxSol: minMaxSol,
        startTime: timeAgo,
        winPercent: winPercent
      }
    );

    // Filter and sort
    const filteredGroups = complexGroups
      .filter(group => group.totalTokens >= minTokens)
      .sort((a, b) => b.commonRiseSol - a.commonRiseSol);

    // Format response
    const patternData: PatternDataItem[] = filteredGroups.map(group => ({
      mintPattern: group.groupIdentifier.mintPattern || '',
      unitPrice: group.groupIdentifier.unitPrice || 0,
      unitLimit: group.groupIdentifier.unitLimit || 0,
      mintBuyAmt: group.groupIdentifier.mintBuyAmt || 0,
      commonRise: parseFloat(group.commonRiseSol.toFixed(4)),
      dropRate: parseFloat(group.dropRate.toFixed(2)),
      tokensWithDrop: group.tokensWithDrop,
      totalTokens: group.totalTokens
    }));

    const response: PatternDataResponse = {
      patternData
    };

    res.json(response);
    
  } catch (error) {
    console.error('Error in pattern analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    const db = DatabaseConnection.getInstance();
    await db.connect();
    
    app.listen(port, () => {
      console.log(`\n🚀 Server running on http://localhost:${port}`);
      console.log(`📊 Pattern Analysis API: http://localhost:${port}/api/pattern-analysis`);
      console.log(`\nQuery parameters:`);
      console.log(`  - minTokens: minimum tokens per group (default: 30)`);
      console.log(`  - hours: time window in hours (default: 24)`);
      console.log(`  - minMaxSol: minimum maxSol filter (default: 1)`);
      console.log(`  - winPercent: win percentage for common rise calculation (default: 70)`);
      console.log(`\nExample: http://localhost:${port}/api/pattern-analysis?minTokens=30&hours=24&minMaxSol=1&winPercent=70\n`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
