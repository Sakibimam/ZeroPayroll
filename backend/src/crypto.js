import crypto from 'crypto';

/**
 * Generates a random 32-byte hex string (64 chars)
 */
export function generateMasterViewKey() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Derives a per-employee AES-256 encryption key from the master view key using HKDF
 */
export function deriveEmployeeViewKey(masterViewKey, walletAddress) {
    if (masterViewKey.length !== 64) {
        throw new Error("Master view key must be exactly 64 hex characters.");
    }
    
    // HKDF with SHA-256
    return crypto.hkdfSync(
        'sha256',
        Buffer.from(masterViewKey, 'hex'),
        Buffer.from('confidential-payroll-v1'),
        Buffer.from(walletAddress),
        32
    );
}

/**
 * Encrypts a salary amount using AES-256-GCM
 */
export function encryptSalary(salary_usdc_cents, employeeViewKey, nonce) {
    // IV: first 12 bytes of nonce
    const iv = nonce.subarray(0, 12);
    
    // Plaintext: salary as 8-byte big-endian Buffer
    const plaintext = Buffer.alloc(8);
    plaintext.writeBigInt64BE(BigInt(salary_usdc_cents));
    
    const cipher = crypto.createCipheriv('aes-256-gcm', employeeViewKey, iv);
    
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Returns hex string of (iv + authTag + ciphertext)
    return Buffer.concat([iv, authTag, ciphertext]).toString('hex');
}

/**
 * Decrypts a salary amount using AES-256-GCM
 */
export function decryptSalary(encryptedHex, employeeViewKey, nonce) {
    const data = Buffer.from(encryptedHex, 'hex');
    
    // iv: first 12 bytes
    const iv = data.subarray(0, 12);
    // authTag: next 16 bytes
    const authTag = data.subarray(12, 28);
    // ciphertext: the rest
    const ciphertext = data.subarray(28);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', employeeViewKey, iv);
    decipher.setAuthTag(authTag);
    
    try {
        const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        // Read 8-byte big-endian bigint
        return Number(plaintext.readBigInt64BE());
    } catch (error) {
        throw new Error("Decryption failed: check if the view key is correct or data is corrupted.");
    }
}

/**
 * Generates a random 32-byte nonce
 */
export function generateNonce() {
    const buffer = crypto.randomBytes(32);
    // Nonce as BigInt string for ZK circuit
    const bigintStr = BigInt('0x' + buffer.toString('hex')).toString();
    return { buffer, bigintStr };
}
