import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const databaseConfig = {
  url: process.env.MONGO_URI || 'mongodb://localhost:27017/tradingbot',
  options: {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  }
};
