# `guardian-vault`

Guardian Vault is a production-grade, decentralized Bitcoin wallet on ICP using ckBTC, Internet Identity v2 (passkeys), guardian quorum recovery (VetKD), and threshold ECDSA for signing.

## System Architecture

```mermaid
%%{init: {'theme':'dark','themeVariables':{ 'primaryColor':'#29ABE2','primaryTextColor':'#0a0b0f','lineColor':'#6ee7ff','tertiaryColor':'#11131a'}}}%%
graph LR
  U[User Device]:::user --> W["Web dApp (React + Vite + PWA)"]:::front
  U --> X["Browser Extension (MV3)"]:::front
  W -- Passkey Login --> II[Internet Identity v2]:::auth
  W -- Agent Calls --> GV[Guardian Vault Canister]:::backend
  X -- Agent Calls --> GV
  GV -- ICRC‑1 --> LEDGER[ckBTC Ledger]:::ledger
  GV -- Deposit/Redeem --> MINTER[ckBTC Minter]:::ledger
  GV -- tECDSA --> MGMT[Management Canister]:::infra
  GV -- VetKD --> MGMT
  GV -- Stable State --> ST[Stable Memory]:::backend

  classDef user fill:#FFD166,stroke:#FFD166,color:#0a0b0f;
  classDef front fill:#06D6A0,stroke:#06D6A0,color:#0a0b0f;
  classDef backend fill:#26547C,stroke:#6ee7ff,color:#e7e9ee;
  classDef ledger fill:#118AB2,stroke:#6ee7ff,color:#e7e9ee;
  classDef auth fill:#8338EC,stroke:#a78bfa,color:#e7e9ee;
  classDef infra fill:#EF476F,stroke:#ff9aa2,color:#0a0b0f;
```

## User Workflow

```mermaid
%%{init: {'theme':'dark','themeVariables':{ 'primaryColor':'#29ABE2'}}}%%
sequenceDiagram
  autonumber
  participant U as User
  participant W as Web dApp/PWA
  participant II as Internet Identity
  participant GV as Guardian Vault Canister
  participant LED as ckBTC Ledger
  participant MIN as ckBTC Minter

  U->>W: Open app (PWA/Extension)
  W->>II: Login with Passkey (WebAuthn)
  II-->>W: Delegation (Identity)
  W->>GV: icrc1_balance_of (caller account)
  GV->>LED: icrc1_balance_of
  LED-->>GV: Balance
  GV-->>W: Balance
  U->>W: Send ckBTC (to/principal, amount)
  W->>GV: icrc1_transfer
  GV->>LED: icrc1_transfer
  LED-->>GV: Block height
  GV-->>W: Success
```

## Recovery Flow (Guardians + VetKD)

```mermaid
%%{init: {'theme':'dark'}}%%
sequenceDiagram
  participant O as Owner (Lost Access)
  participant W as Web dApp
  participant G1 as Guardian A
  participant G2 as Guardian B
  participant G3 as Guardian C
  participant GV as Guardian Vault

  O->>W: Initiate recovery (new device)
  W->>GV: request_recovery(new_owner)
  Note over GV: Create request, track approvals,<br/>VetKD public key for shares
  G1->>W: Open approval
  W->>GV: approve_recovery(id)
  G2->>W: Open approval
  W->>GV: approve_recovery(id)
  alt Quorum met
    GV-->>W: Recovery finalized (owner updated)
  else Waiting
    GV-->>W: Pending approvals
  end
```

## Deployment & Configuration
- ECDSA key: set correct subnet key name (e.g., `dfx_test_key` locally, `secp256k1` on mainnet).
- ckBTC canisters: configure ckBTC Ledger and Minter principals during canister `init` or via `set_config`.
- Internet Identity: use `https://identity.ic0.app` on `ic` and local canister on `local`.

## Local Development

```bash
# Start local replica
dfx start --background

# Deploy backend (set real canister IDs for ckBTC components)
dfx deploy

# Frontend (workspace)
npm start -w src/guardian-vault-frontend
```

For conceptual background, see:
- Internet Computer docs (DFX, canisters, management APIs)
- ICRC‑1 standard and ckBTC Ledger/Minter
- VetKD, Threshold ECDSA, and Internet Identity
