# DeepBook Margin Dashboard - Design Principles

## 1. Clarity Over Density (User-Centric)
- **Problem**: Crypto interfaces often dump raw data (contracts, huge numbers, complex curves) on users.
- **Solution**: Use **Progressive Disclosure**. Show the most important info (APY, TVL, Your Balance) first. Hide complex details (Interest Rate Parameters, Contract IDs) behind "Details" or "Advanced" toggles.
- **Goal**: A user should know *what* to do within 5 seconds of landing on the page.

## 2. Safety & Trust (Informed Decisions)
- **Problem**: "Utilization Rate: 90%" is ambiguous. Is it good (high yield) or bad (cant withdraw)?
- **Solution**: Interpret the data.
  - Use **Health Bars** (Green/Yellow/Red) for Utilization.
  - Add **Tooltips** explaining risks (e.g., "High utilization means you might have to wait to withdraw, but APY is higher").
  - Explicitly state **Where Yield Comes From** (e.g., "Paid by borrowers trading on DeepBook").

## 3. Action-Oriented (Product Thinking)
- **Problem**: Interfaces that look like read-only dashboards.
- **Solution**: Primary actions (Deposit, Withdraw) should be prominent.
- **Feedback**: Show **Projected Outcomes** (e.g., "If you deposit 1,000 USDC, you earn ~0.2 USDC/day").
- **State**: Always show the user's current position relative to the pool.

## 4. System Thinking
- **Context**: The dashboard is part of an ecosystem (DeepBook).
- **Linkage**: Connect the "Pool" to the "Trade". Show that these assets are used for trading.

## Implementation Guidelines
- **Typography**: Hierarchy matters. APY should be huge. Labels should be subtle.
- **Color**: Use color semantically. Green = Safe/Good Yield. Red = Danger/High Risk.
- **Interaction**: Hover states should provide context. Inputs should calculate results immediately.

