pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template SalaryCommitment() {
    // Private inputs
    signal input salary_amount;
    signal input nonce;

    // Public inputs
    signal input recipient_address;

    // Public output
    signal output commitment;

    // Range checks for salary_amount: 1 to 10,000,000
    // USDC cents: 1 cent to $100,000.00
    component lowerBound = GreaterEqThan(32);
    lowerBound.in[0] <== salary_amount;
    lowerBound.in[1] <== 1;
    lowerBound.out === 1;

    component upperBound = LessEqThan(32);
    upperBound.in[0] <== salary_amount;
    upperBound.in[1] <== 10000000;
    upperBound.out === 1;

    // Nonce must be non-zero to ensure entropy
    component nonceIsZero = IsZero();
    nonceIsZero.in <== nonce;
    nonceIsZero.out === 0;

    // Compute commitment: Poseidon(salary_amount, nonce, recipient_address)
    // Using Poseidon(3) as requested
    component hasher = Poseidon(3);
    hasher.inputs[0] <== salary_amount;
    hasher.inputs[1] <== nonce;
    hasher.inputs[2] <== recipient_address;

    commitment <== hasher.out;
}

// main component with recipient_address as public input
component main { public [recipient_address] } = SalaryCommitment();
