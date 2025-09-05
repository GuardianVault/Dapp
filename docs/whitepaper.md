# Guardian Vault Whitepaper

## Abstract

Guardian Vault is a decentralized, social-recovery Bitcoin wallet built entirely on the Internet Computer Protocol (ICP) ecosystem. It combines ckBTC (Chain-Key Bitcoin), threshold ECDSA, VetKD (Verifiably Encrypted Threshold Key Derivation), and Internet Identity v2 to offer a trustless, user-friendly, and secure Bitcoin custody solution. Guardian Vault addresses critical challenges in crypto security: seed phrase loss, centralization of custody, and poor UX around recovery. It introduces a model where users can appoint trusted guardians to help recover access in case of loss, without compromising privacy or requiring custodianship. The system is deployed across a web dApp, Progressive Web App (PWA), and browser extension—each offering tailored access experiences. This whitepaper outlines the protocol's design, components, architecture, and intended impact.

---

## Introduction

Bitcoin has achieved global recognition as a store of value and a decentralized currency, yet user security remains fragile. Billions of dollars in BTC have been lost due to forgotten keys or compromised wallets. Guardian Vault aims to make Bitcoin custody more resilient, user-friendly, and autonomous by leveraging the unique capabilities of ICP.

Guardian Vault is:

* **Non-custodial:** No entity controls user funds, not even the developers.
* **Seedless:** Eliminates the need for memorizing or storing seed phrases.
* **Socially recoverable:** Users assign guardians (via Internet Identity) who can help recover their access.
* **Multi-surface:** Accessible as a web dApp, installable PWA, and browser extension.
* **Built on-chain:** All logic, storage, and interaction happen on ICP, with no off-chain dependencies.

---

## Key Components

### 1. Chain-Key Bitcoin (ckBTC)

ckBTC is a 1:1 representation of native Bitcoin, minted and burned by the Internet Computer Protocol. Users send BTC to a Bitcoin address controlled by the ckBTC minter canister. In return, an equivalent amount of ckBTC is minted on ICP. ckBTC enables:

* Instant finality (1-2 seconds)
* Micro-fee transactions
* Native Bitcoin transactions using smart contracts

### 2. Threshold ECDSA

Threshold ECDSA allows canisters to hold and sign Bitcoin transactions without revealing private keys. The key is distributed across multiple nodes, and only when a consensus is reached, a signature is generated. This enables:

* Trustless Bitcoin custody
* On-chain transaction signing
* Canister-controlled Bitcoin wallets

### 3. Verifiably Encrypted Threshold Key Derivation (VetKD)

VetKD enables secure, privacy-preserving key derivation and storage. It is used to encrypt recovery secrets and guardian shares without revealing them to anyone, including the canister. This guarantees:

* Privacy in social recovery
* Non-leakage of encrypted materials
* Threshold-based decryption only

### 4. Internet Identity v2

Internet Identity (II) is ICP's decentralized authentication system using WebAuthn and passkeys. Version 2 allows:

* Federated logins (e.g. Google)
* Multiple device identities
* Passwordless access

In Guardian Vault, II v2 is used for both vault owners and guardians, ensuring secure and seamless recovery interactions.

### 5. Multi-Surface Delivery

Guardian Vault is built with user reach in mind:

* **Web dApp**: Runs on any browser directly from an ICP canister.
* **Progressive Web App (PWA)**: Installable, mobile-friendly version offering offline support and native-like experience.
* **Browser Extension**: Lightweight companion that enables persistent access, popup transactions, and easy interaction with ICP-based dApps.

---

## Functional Overview

### Vault Creation

* User logs in via Internet Identity
* System creates a dedicated ckBTC subaccount
* ECDSA public key is generated
* Deposit address is derived and shown to the user

### Bitcoin Deposit Flow

* User sends BTC to the generated deposit address
* ckBTC minter observes confirmation on Bitcoin network
* ckBTC is minted to the user's subaccount

### Guardian Assignment

* User selects 3–5 Internet Identities as guardians
* Canister generates a recovery secret
* Each guardian receives an encrypted shard of this secret using VetKD
* Quorum (e.g. 3 of 5) required for recovery

### Transaction Flow

* User selects a recipient (ckBTC or native BTC address)
* Canister constructs transaction using UTXOs
* Threshold ECDSA signing is triggered
* Signed transaction is broadcast (if native BTC) or sent via ckBTC ledger

### Recovery Flow

* User loses access and initiates recovery from new device
* Guardians are notified
* Upon reaching quorum, recovery shares are submitted
* Vault access is transferred or re-initialized securely

### Platform UX Flow

* **Web dApp**: Access through any browser; ideal for desktop users.
* **PWA**: Install on mobile for offline access, push notifications, and biometric integration.
* **Browser Extension**: Quick access in browser toolbar, ideal for ICP/ckBTC DEXs, tipping systems, and daily interactions.

---

## Security Model

Guardian Vault is built on the following principles:

* **Decentralization:** No single point of control or failure
* **Zero-knowledge storage:** Canister stores only encrypted data
* **Threshold authorization:** Guardians cannot act alone
* **Hardware-backed identities:** WebAuthn and passkeys enforce strong authentication

### Threat Model Considerations

* Compromised Guardian: Requires multiple approvals for any action
* Malicious Vault Owner: Cannot access recovery secrets alone
* Developer Interference: No backdoor access to Bitcoin keys or vaults

---

## System Architecture

```mermaid
graph TD
  A[User with Internet Identity] -->|Creates Vault| B[Vault Canister (Rust)]
  B --> C[Threshold ECDSA Module]
  B --> D[ckBTC Ledger Canister]
  B --> E[Guardian Registry]
  B --> F[VetKD Subnet API]
  D -->|Transfer| G[Another Vault/User]
  E -->|Encrypted Shares| H[Guardians (II)]
  H -->|Approve Recovery| B
  B -->|Restore Access| A2[Recovered Device / II]
```

### Component Responsibilities

* **Vault Canister:** Owns logic for deposits, transfers, and recovery
* **ECDSA Module:** Requests public key, signs transactions
* **ckBTC Ledger:** Handles minting, burning, and transfer of ckBTC
* **Guardian Registry:** Manages guardian identities and thresholds
* **VetKD API:** Derives encrypted keys, handles recovery shares
* **Interface Clients:** Web dApp, PWA, and extension interact with the same canister logic seamlessly

---

## User Experience Flow

1. User visits Guardian Vault web app, PWA, or opens the browser extension
2. Logs in via Internet Identity (biometric or passkey)
3. Vault address is shown for Bitcoin deposit
4. Once BTC is sent, balance appears in ckBTC
5. User sets up guardians from trusted contacts
6. User can send funds using intuitive form
7. If device is lost, guardians collaborate to restore access

All interactions are:

* Passwordless
* Fast (sub-second UI response)
* On-chain (no backend or database)
* Available across web, mobile, and browser surfaces

---

## Use Cases

* **Retail BTC holders** seeking easier recovery without centralized wallets
* **Non-technical users** who fear losing keys
* **DAOs or collectives** managing shared BTC funds
* **DeFi on Bitcoin** that needs human-friendly custody models
* **Mobile-first users** accessing Bitcoin vaults via PWA
* **Power users** interacting with ckBTC-enabled dApps via browser extension

---

## Conclusion

Guardian Vault is a transformative leap in self-custody and recovery of Bitcoin assets. It combines the speed and scalability of ICP with the decentralized integrity of Bitcoin. By eliminating seed phrases, empowering users with social recovery, and offering multi-surface access to vaults, it redefines what it means to own and protect digital value.

With seamless availability across web, mobile, and browser environments, Guardian Vault not only makes Bitcoin safer — it makes it accessible, resilient, and truly user-controlled.

