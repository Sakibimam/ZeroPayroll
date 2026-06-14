import * as snarkjs from "snarkjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths to circuit artifacts
const WASM_PATH = path.join(__dirname, "../../circuit/salary_commitment_js/salary_commitment.wasm");
const ZKEY_PATH = path.join(__dirname, "../../circuit/salary_commitment_final.zkey");

/**
 * Generates a Groth16 proof for the salary commitment
 */
export async function generateSalaryProof(salary_usdc_cents, nonce_bigint_str, recipient_address) {
    try {
        // Convert recipient_address to BigInt
        const addrBuffer = Buffer.from(recipient_address);
        const recipientBigInt = BigInt('0x' + addrBuffer.toString('hex').slice(0, 32));

        const input = {
            salary_amount: salary_usdc_cents,
            nonce: nonce_bigint_str,
            recipient_address: recipientBigInt.toString()
        };

        // Fix: Load files as Buffers manually to prevent SnarkJS worker errors
        // This solves "TypeError: Cannot read properties of undefined (reading 'byteLength')"
        const wasmBuffer = fs.readFileSync(WASM_PATH);
        const zkeyBuffer = fs.readFileSync(ZKEY_PATH);

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasmBuffer,
            zkeyBuffer
        );

        return {
            proof,
            publicSignals,
            commitment: publicSignals[0]
        };
    } catch (error) {
        throw new Error(`Proof generation failed: ${error.message}`);
    }
}

/**
 * Verifies the ZK proof locally
 */
export async function verifyProofLocally(proof, publicSignals) {
    const VKEY_PATH = path.join(__dirname, "../../circuit/verification_key.json");
    try {
        if (!fs.existsSync(VKEY_PATH)) {
            throw new Error("Verification key file not found.");
        }
        const vKey = JSON.parse(fs.readFileSync(VKEY_PATH));
        return await snarkjs.groth16.verify(vKey, publicSignals, proof);
    } catch (error) {
        throw new Error(`Proof verification failed: ${error.message}`);
    }
}
