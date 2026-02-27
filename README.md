# ZkVanguard Contracts (EVM)

Solidity smart contracts for ZkVanguard on Cronos zkEVM.

## Overview

This repository contains the core smart contracts for ZkVanguard's decentralized risk management platform:

- **RWAManager.sol** - Real-World Asset portfolio management
- **HedgeExecutor.sol** - Automated hedging execution via Moonlander perpetuals
- **ZKProxyVault.sol** - Privacy-preserving vault with ZK proof verification
- **PaymentRouter.sol** - EIP-3009/x402 gasless transaction handling
- **CommunityPoolV2.sol** - Shared liquidity pool for collective hedging

## Deployments

### Cronos zkEVM Testnet (Chain ID: 240)
See [deployments](../ZkVanguard/deployments/) in main repo.

## Development

### Prerequisites
- Node.js 18+
- Hardhat

### Install
`ash
npm install
`

### Compile
`ash
npx hardhat compile
`

### Test
`ash
npx hardhat test
`

## Security

All contracts undergo security review before mainnet deployment.

## License

Apache License 2.0

## Related Repositories

- [ZkVanguard](https://github.com/ZkVanguard/ZkVanguard) - Main application
- [contracts-sui](https://github.com/ZkVanguard/contracts-sui) - Move contracts for SUI
- [ai-agents](https://github.com/ZkVanguard/ai-agents) - AI agent swarm
- [zkp-engine](https://github.com/ZkVanguard/zkp-engine) - ZK-STARK proof engine
