# #  Real-Time Cross-Chain Gas Price Tracker with Wallet Simulation

This project is a **real-time dashboard** that tracks **gas prices** across Ethereum, Polygon, and Arbitrum networks, while also allowing users to **simulate wallet transactions** and visualize the **USD cost of gas + transaction fees**.

Built with **Next.js**, **Ethers.js**, **Zustand**, and **Lightweight-Charts**, this platform offers developers and users insights into gas price volatility and cost comparison across chains.

---

## Features

-  **Real-Time Gas Prices** from Ethereum, Polygon, and Arbitrum using **native WebSocket RPCs**
-  **Live Candlestick Charts** (15-minute intervals) powered by `lightweight-charts`
-  **ETH/USD Price** pulled live from **Uniswap V3 Swap events** (`0x88e6...5640`)
-  **Live vs. Simulation Mode** toggle to compare real gas vs estimated user input
-  **Transaction Cost Simulation** (including base + priority fee * gas used)
-  **Dark/Light Theme Toggle**
-  **Fully Responsive UI** with TailwindCSS
-  **Zustand State Machine** for seamless mode switching and shared state

---

##  Tech Stack

- **Frontend**: React, Next.js (App Router), Tailwind CSS
- **State Management**: Zustand
- **Blockchain**: Ethers.js + WebSocketProvider
- **Charting**: Lightweight-Charts (TradingView)
- **ETH/USD Price Source**: Uniswap V3 Swap Events
- **Chains Supported**: Ethereum, Polygon, Arbitrum

---

##  Architecture

```mermaid
graph LR
  A[User] --> B[Next.js Frontend]
  B --> C[Zustand State Store]
  C --> D{Mode}
  D -->|Live| E[WebSocket Providers]
  D -->|Simulate| F[Transaction Calculator]
  E --> G[Ethereum RPC]
  E --> H[Polygon RPC]
  E --> I[Arbitrum RPC]
  F --> J[Uniswap V3 ETH/USDC Pool]
  J --> K[Parse Swap Events]
  K --> L[Calculate ETH/USD]
  L --> M[Gas Cost USD]
  G --> N[Base/Priority Fees]
  H --> N
  I --> N
  N --> O[Candlestick Chart]
  O --> P[Lightweight Charts]
  M --> P

