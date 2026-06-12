# ZeroPayroll: ZK-Powered Confidential Payroll on Stellar

ZeroPayroll is a privacy-preserving payroll system built on the Stellar blockchain. It leverages **Zero-Knowledge Proofs (ZKPs)** and the **Soroban smart contract platform** to ensure that salary amounts remain confidential while remaining fully verifiable and auditable.

## 🚀 Key Features

-   **Confidential Salaries:** Salary amounts are never revealed on-chain. Only a cryptographic commitment (Poseidon hash) is stored.
-   **ZK Verifiability:** Employers provide a Groth16 ZK proof that the commitment is correctly computed and the salary is within a valid range.
-   **Optional XLM Payments:** Bundled transactions allow employers to send gas money (XLM) to employees in the same transaction as the private payroll commitment.
-   **Granular Access Control:**
    -   **Employees** can view only their own salary using a private view key.
    -   **Auditors** can view the entire payroll for a specific employer using a master view key.
-   **Dark-Themed Dashboard:** A professional React-based interface for Employers, Employees, and Auditors.

## 🛠 Tech Stack

-   **Circuit:** Circom 2.0 (Poseidon Hashing, Groth16)
-   **Smart Contract:** Soroban (Rust SDK v21)
-   **Backend:** Node.js, Express, SnarkJS, Stellar SDK
-   **Frontend:** React, Vite

## 📂 Project Structure

```text
├── circuit/      # ZK Circuit files and setup scripts
├── contracts/    # Soroban smart contract (Rust)
├── backend/      # Express API for proof generation and encryption
└── frontend/     # React dashboard for all user roles
```

## ⚙️ Setup Instructions

### 1. Circuit Setup
Ensure you have `circom` and `snarkjs` installed.
```bash
cd circuit
npm install
./setup.sh
```

### 2. Smart Contract Deployment
Requires [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup).
```bash
cd contracts
./deploy.sh
```

### 3. Backend Configuration
```bash
cd backend
npm install
cp .env.example .env
# Fill in your CONTRACT_ID and EMPLOYER_SECRET_KEY
npm start
```

### 4. Frontend Launch
```bash
cd frontend
npm install
npm run dev
```

## 🔒 Privacy & Security

-   **Poseidon Hash:** Used for gas-efficient hashing within the ZK circuit.
-   **AES-256-GCM:** Used for encrypting salary data off-chain before storage.
-   **HKDF:** Hierarchical Key Derivation ensures employee view keys are derived securely from the master key.

## 📜 License

MIT
