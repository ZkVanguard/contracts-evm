# ZkVanguard Contracts (EVM)

> Solidity smart contracts for the ZkVanguard platform on Cronos zkEVM

[![Cronos](https://img.shields.io/badge/Cronos-Testnet-blue)](https://cronos.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636)](https://soliditylang.org)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue)](LICENSE)

## Contracts

| Contract | Description | Testnet Address |
|----------|-------------|----------------|
| `RWAManager` | Core RWA portfolio management (UUPS upgradeable) | `0x1Fe3105E6F3878752F5383db87Ea9A7247Db9189` |
| `ZKSTARKVerifier` | ZK-STARK proof verification on-chain | `0x46A497cDa0e2eB61455B7cAD60940a563f3b7FD8` |
| `ZKProxyVault` | Escrow with ZK ownership verification & time-locks | `0xE8c3Eba5A5eC3311965DA4E8d4F33F5D0a5E4F9a` |
| `PaymentRouter` | EIP-3009 & x402 gasless payment routing | `0xe40AbC51A100Fa19B5CddEea637647008Eb0eA0b` |
| `GaslessZKCommitmentVerifier` | Gasless ZK verification via x402 | `0x44098d0dE36e157b4C1700B48d615285C76fdE47` |
| `ZKHedgeCommitment` | Privacy-preserving hedge commitments (stealth addresses) | — |
| `ZKPaymaster` | Gas sponsorship for ZK operations | — |

## Architecture

```
contracts/
├── core/
│   ├── RWAManager.sol              # Portfolio tokenization & rebalancing
│   ├── PaymentRouter.sol           # EIP-3009 & x402 integration
│   ├── ZKSTARKVerifier.sol         # On-chain ZK-STARK verification
│   ├── ZKProxyVault.sol            # Escrow with ZK ownership proofs
│   ├── ZKHedgeCommitment.sol       # Stealth address hedge commitments
│   ├── ZKPaymaster.sol             # Gas sponsorship
│   ├── GaslessZKCommitmentVerifier.sol
│   └── X402GaslessZKCommitmentVerifier.sol
├── mocks/                          # Test mocks
└── abi/                            # Generated ABIs
```

## Setup

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Deploy

```bash
# Testnet
npx hardhat run scripts/deploy/deploy-contracts.ts --network cronos-testnet

# Verify
npx hardhat run scripts/deploy/verify-contracts.ts --network cronos-testnet
```

## Dependencies

- OpenZeppelin Contracts Upgradeable v5.4
- Hardhat v2.27+
- Ethers v6

## Related Repos

- [ZkVanguard](https://github.com/ZkVanguard/ZkVanguard) — Main application
- [contracts-sui](https://github.com/ZkVanguard/contracts-sui) — SUI Move contracts
- [ai-agents](https://github.com/ZkVanguard/ai-agents) — Multi-agent AI system
- [zkp-engine](https://github.com/ZkVanguard/zkp-engine) — ZK-STARK proof engine

## License

Apache 2.0
