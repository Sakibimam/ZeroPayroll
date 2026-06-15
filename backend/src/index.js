import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import StellarSdk from '@stellar/stellar-sdk';
import fs from 'fs';

import { 
    deriveEmployeeViewKey, 
    encryptSalary, 
    generateNonce 
} from './crypto.js';
import { generateSalaryProof } from './proof.js';
import { submitPaymentToContract } from './stellar.js';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: { success: false, error: "Too many requests" }
});
app.use(limiter);

app.post('/submit-payroll', upload.single('file'), async (req, res) => {
    try {
        const { master_view_key } = req.body;
        const file = req.file;

        if (!file || !master_view_key) throw new Error("File and Master Key required.");

        const csvContent = fs.readFileSync(file.path, 'utf-8');
        const records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

        const employerSecret = process.env.EMPLOYER_SECRET_KEY;
        const employerKeypair = StellarSdk.Keypair.fromSecret(employerSecret);

        const results = [];

        for (const record of records) {
            const { wallet_address, salary_usdc_cents, employee_id, xlm_amount } = record;

            // Robust Validation
            if (!wallet_address || wallet_address.length !== 56) {
                throw new Error(`Invalid address for ${employee_id}: ${wallet_address}. Must be a 56-character Stellar address.`);
            }

            const salary = parseInt(salary_usdc_cents);
            if (isNaN(salary) || salary < 1 || salary > 10000000) {
                throw new Error(`Invalid salary for ${employee_id}: "${salary_usdc_cents}". Salary must be a whole number between 1 and 10,000,000 cents ($0.01 to $100,000.00).`);
            }

            const xlm = xlm_amount ? xlm_amount.toString() : "0";

            // 1. Crypto setup
            const { buffer: nonceBuffer, bigintStr: nonceBigInt } = generateNonce();
            const empViewKey = deriveEmployeeViewKey(master_view_key, wallet_address);
            const encryptedHex = encryptSalary(salary, empViewKey, nonceBuffer);

            // 2. ZK Proof
            console.log(`Generating proof for ${employee_id}...`);
            const { proof, commitment } = await generateSalaryProof(salary, nonceBigInt, wallet_address);

            // 3. Submit bundled transaction (Contract + XLM)
            const { tx_hash } = await submitPaymentToContract(
                employerKeypair,
                wallet_address,
                commitment,
                encryptedHex,
                nonceBuffer.toString('hex'),
                JSON.stringify(proof),
                xlm
            );

            results.push({ employee_id, wallet_address, tx_hash, commitment, xlm_sent: xlm });
        }

        fs.unlinkSync(file.path);
        res.json({ success: true, payments: results });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/health', (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
