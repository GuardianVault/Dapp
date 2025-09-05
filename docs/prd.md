# Guardian Vault — Product Requirements Document (PRD)

## 📌 Project Name

**Guardian Vault**
*Decentralized, Social-Recovery Bitcoin Wallet Built on the Internet Computer (ICP)*

---

## 🎯 Vision

To make Bitcoin secure, seedless, and recoverable for everyday users by delivering a social-recovery wallet powered by ckBTC, running entirely on-chain via the Internet Computer. Guardian Vault combines web-native access, guardian-based key recovery, and animated visual UX into a seamless, trustless experience across platforms.

---

## 🧩 Problem Statement

Despite Bitcoin’s decentralization and security, user-level custody remains a pain point:

* Lost seed phrases = lost funds
* Custodial wallets = compromised control
* Poor recovery options discourage mass adoption
* Lack of usable interfaces for Bitcoin smart custody

Users deserve a wallet that:

* Has **no seed phrases**
* Is **non-custodial** by design
* Allows **social recovery** if access is lost
* Works across **web, mobile, and browser** surfaces
* Is visually engaging and trustworthy

---

## ✅ Solution Summary

Guardian Vault is a multi-surface, decentralized wallet that enables:

* **Secure ckBTC custody** in a canister (secured by threshold ECDSA)
* **Guardian-based recovery** via encrypted key shares and quorum-based approval
* **Multi-surface access**: Web dApp, PWA, and Browser Extension
* **Full identity abstraction**: Powered by Internet Identity v2 (passkeys, WebAuthn)
* **SVG-style animated UI** that responds to actions, uses synchronized brand colors, and enhances user trust

Users can access Guardian Vault through a unified landing website, which links directly to the dApp interface and extension, and installs as a PWA for mobile use.

---

## 🧱 Key Features

### 🔐 Core Vault Functionality

* ckBTC deposit address (based on threshold ECDSA pubkey)
* Receive BTC → get ckBTC via ckBTC minter
* View balances and history
* Send ckBTC or initiate Bitcoin transfer (with signature via threshold ECDSA)
* Low-fee, high-speed payments

### 👥 Social Recovery (Guardian-Based)

* Add guardians via Internet Identity
* Encrypted secret shares created using VetKD
* Recovery requires quorum of guardian approvals
* Vault is either restored or recreated securely on new II
* Audit log for recovery actions

### 📱 Multi-Surface Support

1. **Web dApp** (via ICP canister)

   * Full feature access via browser
   * Built-in wallet + ckBTC integration
2. **PWA** (mobile-optimized installable app)

   * Home screen presence, offline access
   * Biometric and passkey support via IIv2
3. **Browser Extension**

   * Quick-access wallet view
   * Initiate/send ckBTC transactions from any site
   * Notification tray, status check

### 🎨 UI/UX

* SVG-based animated interface components:

  * Floating ckBTC coin visuals
  * Animated UI parts with moving pieces and components
  * Futuristic UI
  * Pulsing vault lock, guardian icons
  * Theme dynamically synced with logo colors
* Micro-interactions on:

  * Login, Send, Add Guardian, Recovery events
* Onboarding wizard for new users with animation
* Dark and light mode

### 🔑 Authentication

* Internet Identity v2 (WebAuthn, passkeys, biometrics)
* Multiple device login support
* Google account integration for guardians (non-crypto users)

---

## 🧠 Technology Stack

### Frontend

* **Website:** Vite + React + TailwindCSS + GSAP or Framer Motion
* **Web dApp:** Vite + React + TailwindCSS
* **PWA:** Extension of web dApp using manifest.json, service worker
* **Browser Extension:** MV3-compliant React-based popup + background script

### Backend (Canisters)

* **Rust (IC CDK):** Vault logic, threshold signing, guardian logic, ckBTC integration
* **ICP Services:**

  * Threshold ECDSA (Management Canister)
  * ckBTC Ledger & Minter
  * VetKD (Encrypted Key Sharing)
  * Internet Identity v2

---

## 📦 Deliverables

* [ ] **guardianvault.xyz** landing site (hosted on ICP)
* [ ] **Web dApp:** ckBTC vault interface
* [ ] **PWA:** Installable mobile experience
* [ ] **Browser Extension:** Toolbar wallet
* [ ] **Animated visual identity:** Logo-integrated SVG/GSAP-powered UI
* [ ] **Mainnet Canister Deployment**
* [ ] **Demo Video:** End-to-end walkthrough
* [ ] **Open Source Repo:** MIT License

---

## 🧪 Functional Flows

### Deposit Flow

1. User logs in via Internet Identity
2. Vault address (Bitcoin) displayed
3. User sends BTC to address
4. ckBTC minted and added to vault

### Send Flow

1. User inputs amount and recipient (II or BTC address)
2. Canister creates transaction
3. Threshold ECDSA signs it
4. Transaction sent or submitted to ckBTC ledger

### Guardian Add Flow

1. User selects 3–5 Internet Identities
2. Canister uses VetKD to create encrypted key shares
3. Guardians stored with roles and timestamps

### Recovery Flow

1. User logs in on new device (or new II)
2. Initiates recovery request
3. Guardians are notified and approve via their II
4. Once quorum met, vault is restored or funds are transferred

### UI/UX Sync

* Logo and core color palette reflected in SVG animations
* All platforms share unified branding and transition effects

---

## 🎨 Brand & Visual Identity

* **Logo Style:** Shield + keyhole + Bitcoin icon
* **Colors:** Gold, deep gray, accent green/blue (dynamic sync)
* **Typography:** Rounded, modern sans-serif (e.g., Inter, Manrope)
* **Animations:** Subtle, SVG-based microinteractions
* **Visual Themes:** Trust, security, minimalism

---

## 📊 Success Metrics

* Successful end-to-end vault creation + ckBTC transfer
* Social recovery completed with 3-of-5 guardian test
* App install success as PWA on Android/iOS
* Browser extension detects and sends ckBTC
* Animated UI loads <1s and reacts to user inputs
* Zero external infra — 100% on-chain + ICP native

---

## 🔐 Security Principles

* No seed phrases, ever
* No custodial backend or private server logic
* No guardian can act alone (threshold model)
* Recovery secrets encrypted with vetKD
* Web-only interactions protected via IIv2

---

## 🏁 Go-to-Market Strategy

* Submit to DoraHacks and ICP Hackathons
* Deploy live on ICP mainnet
* Create developer onboarding material (docs, video)
* Launch demo site at `guardianvault.xyz`
* Pitch as B2C crypto security utility with roadmap for zk login & DAO governance

---

## 🧭 Future Directions (post-MVP)

* zk-based guardian approval
* Wallet-as-a-Service SDK
* Group Vaults for DAOs
* ckETH support
* Guardian NFTs or token-based reputation

