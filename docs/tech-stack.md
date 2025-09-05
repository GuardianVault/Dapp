## ⚙️ **Guardian Vault Tech Stack**

### 🧠 **Core Platform**

* **Blockchain Platform:** [Internet Computer Protocol (ICP)](https://internetcomputer.org)
* **Smart Contract Language:** Rust (using `ic-cdk`)
* **Identity & Auth:** Internet Identity v2 (WebAuthn, Passkeys, Google Login)
* **Assets:** ckBTC (Chain-Key Bitcoin via ICP), ICRC1/2 standards
* **Threshold Signing:** Threshold ECDSA (via Management Canister)
* **Privacy Layer:** VetKD (Verifiably Encrypted Threshold Key Derivation)

---

### 🌐 **Frontend Architecture**

| Platform              | Framework       | Tools & Libs                                       |
| --------------------- | --------------- | -------------------------------------------------- |
| **Website**           | Vite + React    | Tailwind CSS, Framer Motion / GSAP, SVG animations |
| **Web dApp**          | Vite + React    | AgentJS, ICP Ledger SDK, ckBTC support             |
| **PWA**               | Vite PWA plugin | Service Worker, Manifest.json, React               |
| **Browser Extension** | MV3 + React     | WebExtension polyfill, AgentJS, React Popup UI     |

* **SVG UI/UX Engine:** GSAP (GreenSock) or Framer Motion
* **Style System:** Tailwind CSS (theme-bound via logo color sync)
* **Animation Sync:** State-bound motion triggers for UI components

---

### 🧱 **Canister Services (Rust)**

| Module                | Functionality                           |
| --------------------- | --------------------------------------- |
| **Vault Canister**    | ckBTC storage, transfer, guardian logic |
| **Recovery Engine**   | VetKD-based guardian recovery           |
| **Threshold Signer**  | Bitcoin tx signing via threshold ECDSA  |
| **Interface Handler** | API routes for web, PWA, and extension  |

---

### 🗂️ **ICP Services & APIs**

* **ckBTC Ledger** – Transfers, balance queries, subaccounts
* **ckBTC Minter** – Deposit & redeem between BTC <--> ckBTC
* **Threshold ECDSA** – Sign raw BTC transactions from canister
* **VetKD API** – Generate encrypted recovery shares
* **Internet Identity** – Auth login + Guardian identification

---

### 🧪 **Testing & Deployment**

* **Local Dev:** dfx + Rust (cargo), Vite Dev Server
* **Deployment:** ICP Canister on Mainnet
* **Browser Extension Testing:** Chrome, Firefox, Brave (MV3 compliant)
* **PWA Testing:** Android, iOS via WebAppManifest

---

### 📊 Monitoring & UX

* **Vault UI Logging:** On-chain log events
* **Animated Feedback:** Status pulses, transfer animations, guardian confirmations
* **Device Adaptation:** Mobile responsiveness + biometric login (PWA)

---
