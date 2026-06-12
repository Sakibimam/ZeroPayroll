#!/bin/bash
set -e

# Ensure cargo/circom are in path for this script
[ -f "$HOME/.cargo/env" ] && . "$HOME/.cargo/env"

# Configuration
PTAU_URL="https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau"
PTAU_FILE="powersOfTau28_hez_final_14.ptau"
CIRCUIT_NAME="salary_commitment"

echo "1. Checking for circom compiler..."
if ! command -v circom &> /dev/null; then
    echo "ERROR: circom still not found in PATH."
    exit 1
fi
echo "Using circom: $(which circom)"

# Cleanup files with literal backslashes if they exist
rm -f *\\_*

echo "2. Downloading Powers of Tau ceremony file..."
if [ -f "$PTAU_FILE" ] && [ $(wc -c < "$PTAU_FILE") -lt 1000000 ]; then
    echo "Existing ptau file is invalid, deleting..."
    rm "$PTAU_FILE"
fi

if [ ! -f "$PTAU_FILE" ]; then
    echo "Downloading ptau file (~19MB)..."
    curl -L "$PTAU_URL" -o "$PTAU_FILE"
else
    echo "Ptau file already exists."
fi

echo "3. Compiling the circuit..."
circom "$CIRCUIT_NAME.circom" --r1cs --wasm --sym -l ../node_modules -l node_modules

echo "4. Running Groth16 setup..."
npx snarkjs groth16 setup "$CIRCUIT_NAME.r1cs" "$PTAU_FILE" "${CIRCUIT_NAME}_0000.zkey"
npx snarkjs zkey contribute "${CIRCUIT_NAME}_0000.zkey" "${CIRCUIT_NAME}_final.zkey" --name="First Contribution" -v -e="random entropy"

echo "5. Exporting verification key..."
npx snarkjs zkey export verificationkey "${CIRCUIT_NAME}_final.zkey" verification_key.json

echo "Setup complete. Files ready."
