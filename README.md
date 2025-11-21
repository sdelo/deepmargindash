# Leviathan Margin Dashboard

A comprehensive dashboard for monitoring and interacting with DeepBook Margin lending pools on the Sui blockchain.

## Features

- **Landing Page**: Introduction to DeepBook Margin and dashboard capabilities
- **Real-time Analytics**: Monitor pool utilization, interest rates, and yield curves
- **Position Management**: Deposit, withdraw, and manage positions across multiple pools
- **Yield Optimization**: Compare yields and track historical performance
- **Depositor Insights**: View depositor distribution and protocol fees
- **Transaction History**: Comprehensive transaction tracking and analytics
- **Pool Administration**: Monitor pool parameters and risk metrics

## Getting Started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Configure server endpoints (optional):

   **Option A - Automatic (Recommended for local dev):**
   
   When running on `localhost`, the app automatically uses `http://localhost:9008` for the Testnet indexer.
   
   **Option B - Manual override:**
   
   Edit `src/config/networks.ts` directly to change the server URLs:
   ```typescript
   const TESTNET_SERVER_URL = "http://localhost:9008";  // Your custom URL
   const MAINNET_SERVER_URL = "https://your-indexer.com";
   ```

3. Start the development server:

   ```bash
   bun dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

- `/` - Landing page with DeepBook Margina introduction
- `/pools` - Main dashboard with pool management and analytics
- `/dashboard` - Alternative route to the main dashboard

## Technology Stack

- React 18 with TypeScript
- Bun for build tooling and runtime
- Tailwind CSS for styling
- React Router for navigation
- Sui dApp Kit for blockchain integration
- Heroicons for UI icons
- Recharts for data visualization

## DeepBook Margin

DeepBook Margin is a sophisticated lending protocol built on Sui blockchain that enables users to earn yield by providing liquidity to margin trading pools. The protocol features:

- Over-collateralized lending model
- Real-time interest rate adjustments
- Competitive yields on idle assets
- Decentralized and permissionless access
