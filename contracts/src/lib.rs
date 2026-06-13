#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Bytes, BytesN, Env, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentRecord {
    pub commitment: BytesN<32>,       // Poseidon commitment hash
    pub encrypted_amount: Bytes,      // AES-256 encrypted salary, stored as bytes (hex-encoded on client)
    pub nonce_public: BytesN<32>,     // The nonce (public, needed for view key decryption)
    pub recipient: Address,           // Employee wallet address
    pub timestamp: u64,               // Ledger timestamp
    pub proof_verified: bool,         // Did we verify the ZK proof?
}

#[contract]
pub struct PayrollContract;

const PAYMENTS_KEY: Symbol = symbol_short!("PAY");
const COUNT_KEY: Symbol = symbol_short!("CNT");

#[contractimpl]
impl PayrollContract {
    /// Submits a privacy-preserving salary payment
    pub fn submit_payment(
        env: Env,
        employer: Address,
        recipient: Address,
        commitment: BytesN<32>,
        encrypted_amount: Bytes,
        nonce: BytesN<32>,
        proof: Bytes,
        _public_signals: Bytes,
    ) -> u64 {
        // 1. Authenticate the employer
        employer.require_auth();

        // 2. Simple Proof Verification (MVP Fallback)
        // TODO: Replace with full on-chain Groth16 verification (BLS12-381 pairing) before mainnet
        let proof_verified = proof.len() > 0;
        if !proof_verified {
            panic!("Invalid or empty ZK proof provided");
        }

        // 3. Get and increment the payment counter for this employer
        let counter_key = (COUNT_KEY.clone(), employer.clone());
        let payment_id: u64 = env.storage().instance().get(&counter_key).unwrap_or(0);
        env.storage().instance().set(&counter_key, &(payment_id + 1));

        // 4. Create the payment record
        let record = PaymentRecord {
            commitment: commitment.clone(),
            encrypted_amount,
            nonce_public: nonce,
            recipient: recipient.clone(),
            timestamp: env.ledger().timestamp(),
            proof_verified: true,
        };

        // 5. Store the record using (employer, payment_id) as key
        let record_key = (PAYMENTS_KEY.clone(), employer.clone(), payment_id);
        env.storage().persistent().set(&record_key, &record);

        // 6. Emit event
        env.events().publish(
            (Symbol::new(&env, "payment_submitted"), employer, recipient),
            (commitment, payment_id),
        );

        payment_id
    }

    /// Returns all payments for a specific employer
    pub fn get_payments(env: Env, employer: Address) -> Vec<PaymentRecord> {
        let mut payments = Vec::new(&env);
        let counter_key = (COUNT_KEY.clone(), employer.clone());
        let count: u64 = env.storage().instance().get(&counter_key).unwrap_or(0);

        for i in 0..count {
            let record_key = (PAYMENTS_KEY.clone(), employer.clone(), i);
            if let Some(record) = env.storage().persistent().get::<_, PaymentRecord>(&record_key) {
                payments.push_back(record);
            }
        }
        payments
    }

    /// Returns a single payment record
    pub fn get_payment(env: Env, employer: Address, payment_id: u64) -> PaymentRecord {
        let record_key = (PAYMENTS_KEY.clone(), employer, payment_id);
        env.storage()
            .persistent()
            .get(&record_key)
            .expect("Payment record not found")
    }
}

mod test;
