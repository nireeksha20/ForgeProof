# VERIWORK / FORGEPROOF

### Evidence-Based Verification of Physical Maintenance Claims

> **"Don't just record maintenance. Verify it."**
> AI-assisted verification of physical maintenance claims with tamper-evident audit trails powered by MST Testnet.

---

## 1. Executive Summary & Core Innovation

In facilities, colleges, factories, commercial complexes, and public infrastructure, maintenance tickets are frequently closed based purely on technician assertions, unverified photos, and manually updated status badges. Existing computer-aided facility management (CAFM) and ticketing tools simply **record claims**—they do not verify whether maintenance was physically executed, whether submitted photos were reused from previous jobs, whether timestamps adhere to chronological causality, or whether evidence was altered post-billing.

**VERIWORK** transforms this workflow into an **evidence-driven verification architecture**:

```
Physical Maintenance Claim
       ↓
Task Requirements
       ↓
Off-Chain Evidence Collection (Photos, NFC Badge, NTP Proof, Declaration)
       ↓
Deterministic & AI-Assisted Verification Engine (Gemini 3.8)
       ↓
Cross-Evidence & Perceptual Replay Detection (pHash / Hash Archival)
       ↓
Interactive Evidence Lineage Graph
       ↓
Explainable Verdict: VERIFIED | PARTIAL | SUSPICIOUS
       ↓
Canonical SHA-256 Package Digest
       ↓
MST Blockchain Tamper-Evident Commitment & State Machine
```

> **Crucial Positioning:**
> _"AI and evidence analysis evaluate the submitted evidence. MST provides a tamper-evident and independently auditable record of the evidence commitment and workflow history."_

---

## 2. Project Structure

```
├── contracts/
│   └── VeriWorkRegistry.sol          # EVM Solidity smart contract managing state machine & commitments
├── scripts/
│   ├── deploy.js                      # Ethers deployment script for MST Testnet
│   └── testConnection.ts             # MST Testnet RPC status and wallet tester
├── server/
│   ├── blockchainService.ts          # MST blockchain service (Ethers.js v6 RPC provider & wallet)
│   ├── demoStore.ts                  # Seeded scenarios, task stores, and live tamper simulator
│   └── verificationEngine.ts         # Deterministic checks, replay detection, canonical hasher, Gemini AI
├── src/
│   ├── components/
│   │   ├── CreateTaskModal.tsx       # Facility Manager task registration modal
│   │   ├── DashboardOverview.tsx     # High-density Web3/AI operations dashboard
│   │   ├── DemoScenariosModal.tsx    # One-click hackathon judge scenario launcher (6 scenarios)
│   │   ├── EvidenceGraphView.tsx     # Interactive SVG evidence lineage & cross-task replay graph
│   │   ├── EvidenceVisualCard.tsx    # Visual artifact proof card with uploaded image renderer & metadata
│   │   ├── Header.tsx                # Top navigation with role switcher & demo launcher
│   │   ├── HeroLanding.tsx           # Product vision landing page & pipeline overview
│   │   ├── MstExplorer.tsx           # MST block explorer, transaction inspect, contract viewer
│   │   ├── SubmitEvidenceModal.tsx   # Technician real local file evidence bundling & SHA-256 byte hasher
│   │   ├── TamperLab.tsx             # Interactive live cryptographic tamper detection lab
│   │   └── TaskInvestigation.tsx     # Comprehensive task audit, checks table, and dispute panel
│   ├── types/
│   │   └── veriwork.ts               # Core data models, task statuses, and check interfaces
│   ├── App.tsx                       # Primary full-stack client application
│   ├── main.tsx                      # Client entry point
│   └── index.css                     # Tailwind CSS v4 styling & typography layers
├── index.html                        # Synced HTML entry point with metadata & fonts
├── metadata.json                     # Applet capabilities & permission declarations
├── package.json                      # Full-stack dependencies & run scripts
├── server.ts                         # Express server + Vite middlewares + REST endpoints
├── hardhat.config.js                 # Hardhat configuration for MST Testnet
└── .env.example                      # Canonical MST Testnet environment template
```

---

## 3. Installation & Setup

### Prerequisites

- Node.js v18+ (tested on Node v22)
- npm

### Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Configure environment template
cp .env.example .env

# 3. Start development server
npm run dev

# 4. Open in browser
# Application runs on http://localhost:3000
```

---

## 4. Environment Variables

Define the following in `.env`:

```env
# Gemini API Key (Required for AI explanation synthesis)
GEMINI_API_KEY="your-gemini-api-key"

# MST Testnet EVM Blockchain Configuration
MST_RPC_URL="https://testnetrpc.mstblockchain.com"
MST_CHAIN_ID="91562037"
MST_CONTRACT_ADDRESS="<filled after deployment>"
MST_PRIVATE_KEY="<local secret; never commit>"
```

> **SECURITY NOTICE:**
> `MST_PRIVATE_KEY` is a local secret used strictly server-side by Hardhat and the backend node service. It must **NEVER** be committed to Git, exposed through `VITE_` variables, or returned in API responses.

---

## 5. Smart Contract & MST Testnet Deployment Sequence

The smart contract coordinates the maintenance claim lifecycle on MST Testnet, enforcing strict transition paths:

```
CREATED → ASSIGNED → IN_PROGRESS → EVIDENCE_SUBMITTED → [VERIFIED | PARTIAL | SUSPICIOUS] → CLOSED
```

_Arbitrary status jumps (such as `CREATED → VERIFIED`) are strictly rejected at the smart contract level._

### Complete MST Testnet Deployment Sequence

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
3. Configure your wallet private key in `.env`:
   ```env
   MST_PRIVATE_KEY=your_funded_testnet_private_key
   ```
4. Configure `MST_RPC_URL` in `.env`:
   ```env
   MST_RPC_URL=https://testnetrpc.mstblockchain.com
   ```
5. Configure `MST_CHAIN_ID` in `.env`:
   ```env
   MST_CHAIN_ID=91562037
   ```
6. Compile the Solidity smart contract:
   ```bash
   npx hardhat compile
   ```
7. Deploy the contract to MST Testnet:
   ```bash
   npm run deploy:mst
   ```
8. Copy the resulting deployed contract address from the terminal output into `.env`:
   ```env
   MST_CONTRACT_ADDRESS=<deployed contract address>
   ```
9. Restart the application to load the deployed contract address:
   ```bash
   npm run dev
   ```
10. Verify RPC connectivity and contract state:

```bash
npm run test:mst
```

---

## 6. AI & Evidence Verification Engine Architecture

VeriWork strictly decouples **deterministic checks** from **generative reasoning**:

1. **Evidence Completeness Check**: Compares submitted evidence types against task requirements.
2. **Replay & Evidence Reuse Engine**: Checks binary SHA-256 digests and perceptual image hashes against the historical task registry. If the same photo was submitted in another task (e.g. `TASK-1042` and `TASK-1071`), it raises a **CRITICAL EVIDENCE REUSE ALERT**.
3. **Timeline Causality Analysis**: Validates chronological integrity (`createdAt` < `assignedAt` < `startedAt` < `submittedAt`). Rejects causality inversions (e.g. work claimed completed prior to task creation).
4. **Metadata Alignment**: Cross-references Task ID, Asset ID, and Technician NFC badge identity.
5. **Before/After Visual Delta Analysis**: Verifies that paired photographs exhibit genuine visual change rather than identical duplicated bytes.
6. **MST Hash Consistency**: Compares live package hash against the immutable on-chain digest.
7. **Gemini 3.8 Synthesis**: Generates an explainable summary and recommendation without claiming unverified physical certainty.

---

## 7. Interactive Demo Scenarios Walkthrough

Users can click **"Run Demo Scenarios"** in the top navigation to trigger one of 6 preset scenarios:

| Scenario | Title                          | Target Task | Verdict            | Key Learning Point                                                                                                               |
| -------- | ------------------------------ | ----------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **1**    | Genuine Repair                 | `TASK-1042` | `VERIFIED` (98%)   | Flange leak repaired. Complete photo pair, NFC badge, NTP time-lock, ASME declaration.                                           |
| **2**    | Missing Evidence               | `TASK-1055` | `PARTIAL` (78%)    | Rooftop air filter replacement. Photos attached, but contractor omitted NFC badge and completion declaration.                    |
| **3**    | Evidence Reuse (Replay Attack) | `TASK-1071` | `SUSPICIOUS` (54%) | Elevator hoist bearing task re-uploaded photograph from pump task `TASK-1042`. Replay engine flags binary duplicate.             |
| **4**    | Timeline Anomaly               | `TASK-1089` | `SUSPICIOUS` (61%) | Fire suppression inspection claimed finished 3 hours prior to task dispatch. Deterministic causality check flags anomaly.        |
| **5**    | Tampering Attack Simulator     | `TASK-1042` | `TAMPER FAILURE`   | Off-chain data modified post-anchoring (e.g. materials or hours). Real-time SHA-256 recalculation displays mismatch against MST. |
| **6**    | Dispute Challenge              | `TASK-1042` | `DISPUTE OPEN`     | Facility Manager audits claim, notes concrete discoloration, and logs a cryptographic challenge on MST.                          |

---

## 8. Hackathon Judging Criteria Alignment

1. **Real-World Problem**: Maintenance fraud, ghost repairs, and billing inflation cost facility managers billions annually.
2. **Technical Depth**: Complete EVM smart contract, canonical JSON key-sorting hasher, perceptual pHash replay detection, and deterministic timeline validation.
3. **Proper Blockchain Fit**: Blockchain is used for what it excels at—an immutable, shared, tamper-evident audit record and state transition machine—not for storing gigabytes of photos directly on-chain.
4. **AI Innovation**: Gemini 3.8 Flash synthesizes explainable rationale and recommendations without hallucinations or fabricated certainty.
5. **Working Prototype**: Zero placeholder mockups; all tabs, state transitions, tamper attacks, and graph links are interactive and functional.
