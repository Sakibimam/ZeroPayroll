import StellarSdk from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

const { Contract, Networks, TransactionBuilder, BASE_FEE, Keypair, rpc, Operation, Asset, Address, xdr } = StellarSdk;

const CONTRACT_ID = process.env.CONTRACT_ID;
const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.PASSPHRASE || Networks.TESTNET;

const server = new rpc.Server(SOROBAN_RPC_URL);

/**
 * Helper to convert a decimal string or hex string to a 32-byte Buffer
 */
function toBytes32(value) {
    let hex;
    if (value.startsWith('0x')) {
        hex = value.slice(2);
    } else if (/^\d+$/.test(value)) {
        // Decimal string (like commitment from snarkjs)
        hex = BigInt(value).toString(16);
    } else {
        hex = value;
    }
    return Buffer.from(hex.padStart(64, '0'), 'hex');
}

/**
 * Submits a payment transaction to the Soroban contract AND optionally sends XLM
 */
export async function submitPaymentToContract(employer_keypair, recipient_address, commitment, encrypted_amount_hex, nonce_hex, proof_bytes, xlm_amount = "0") {
    try {
        const contract = new Contract(CONTRACT_ID);
        const employer_pubkey = employer_keypair.publicKey();
        
        console.log(`Fetching account info for ${employer_pubkey}...`);
        const employerAccount = await server.getAccount(employer_pubkey);

        let builder = new TransactionBuilder(employerAccount, {
            fee: (parseInt(BASE_FEE) * 10).toString(), // Increased fee for Soroban
            networkPassphrase: NETWORK_PASSPHRASE,
        });

        // 1. Add the XLM Payment Operation
        if (parseFloat(xlm_amount) > 0) {
            builder.addOperation(Operation.payment({
                destination: recipient_address,
                asset: Asset.native(),
                amount: xlm_amount.toString()
            }));
        }

        // 2. Prepare Arguments for Soroban
        // commitment and nonce are BytesN<32>
        const commitmentBin = toBytes32(commitment);
        const nonceBin = toBytes32(nonce_hex);
        const encryptedAmountBin = Buffer.from(encrypted_amount_hex, 'hex');
        const proofBin = Buffer.from(proof_bytes, 'utf-8');
        const dummyPublicSignals = xdr.ScVal.scvBytes(Buffer.from("[]"));

        console.log("Submitting to contract...");
        builder.addOperation(contract.call(
            "submit_payment",
            ...[
                Address.fromString(employer_pubkey).toScVal(),
                Address.fromString(recipient_address).toScVal(),
                xdr.ScVal.scvBytes(commitmentBin),
                xdr.ScVal.scvBytes(encryptedAmountBin),
                xdr.ScVal.scvBytes(nonceBin),
                xdr.ScVal.scvBytes(proofBin),
                dummyPublicSignals
            ]
        ));

        const tx = builder.setTimeout(60).build();
        tx.sign(employer_keypair);

        const response = await server.sendTransaction(tx);
        
        if (response.status === 'ERROR') {
            // Log the detailed error from the simulation if possible
            console.error("Simulation/Submission Error Details:", JSON.stringify(response, null, 2));
            throw new Error(`Transaction rejected by network. Check if contract ID is correct and account has XLM.`);
        }

        console.log(`Transaction submitted! Hash: ${response.hash}`);

        // Wait for ledger
        let txResponse = await server.getTransaction(response.hash);
        let attempts = 0;
        while (txResponse.status === 'NOT_FOUND' && attempts < 20) {
            process.stdout.write(".");
            await new Promise(resolve => setTimeout(resolve, 2000));
            txResponse = await server.getTransaction(response.hash);
            attempts++;
        }
        console.log("\nTransaction confirmed.");

        return { tx_hash: response.hash, payment_id: response.hash };
    } catch (error) {
        throw new Error(`Stellar transaction failed: ${error.message}`);
    }
}

export async function getEmployerPayments(employer_address) {
    try {
        const contract = new Contract(CONTRACT_ID);
        // This is a read-only simulation
        const tx = new TransactionBuilder(new StellarSdk.Account(employer_address, "0"), {
            fee: "100",
            networkPassphrase: NETWORK_PASSPHRASE
        })
        .addOperation(contract.call("get_payments", Address.fromString(employer_address).toScVal()))
        .build();

        const result = await server.simulateTransaction(tx);
        if (result.error) throw new Error(result.error);
        return result.result?.retval?._stack || []; 
    } catch (error) {
        return [];
    }
}
