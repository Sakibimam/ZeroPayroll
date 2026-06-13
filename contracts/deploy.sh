#!/bin/bash
set -e

# Ensure Rust/Cargo are in the PATH for this script
if [ -f "$HOME/.cargo/env" ]; then
    . "$HOME/.cargo/env"
fi

# Configuration
NETWORK="testnet"
SOURCE_ACCOUNT="test-account"
# Cargo replaces '-' with '_' in the output WASM filename
WASM_FILE="target/wasm32-unknown-unknown/release/stellar_payroll_contract.wasm"

echo "1. Ensuring wasm32 target is installed..."
rustup target add wasm32-unknown-unknown

echo "2. Building the contract..."
cargo build --target wasm32-unknown-unknown --release

# Try to optimize with wasm-opt if available
if command -v wasm-opt &> /dev/null; then
    echo "3. Optimizing WASM with wasm-opt..."
    wasm-opt -Oz "$WASM_FILE" -o "$WASM_FILE"
else
    echo "3. Skipping wasm-opt (not installed)"
fi

echo "4. Deploying to Stellar testnet..."
# The user must have configured the CLI before running this:
# stellar network add --rpc-url https://soroban-testnet.stellar.org:443 --network-passphrase "Test SDF Network ; September 2015" testnet
# stellar keys add test-account --secret-key <YOUR_SECRET_KEY>

if ! stellar keys address "$SOURCE_ACCOUNT" &> /dev/null; then
    echo "ERROR: Account '$SOURCE_ACCOUNT' not found in Stellar CLI."
    echo "Please run: stellar keys add $SOURCE_ACCOUNT --secret-key <YOUR_SECRET_KEY>"
    exit 1
fi

CONTRACT_ID=$(stellar contract deploy \
    --wasm "$WASM_FILE" \
    --source "$SOURCE_ACCOUNT" \
    --network "$NETWORK")

echo "------------------------------------------------"
echo "DEPLOYMENT SUCCESSFUL"
echo "CONTRACT_ID: $CONTRACT_ID"
echo "------------------------------------------------"

# Update backend .env
ENV_FILE="../backend/.env"
if [ -f "$ENV_FILE" ]; then
    # If file exists, update or append
    if grep -q "CONTRACT_ID=" "$ENV_FILE"; then
        # Use a temporary file for sed to be safe across different OS versions
        sed "s/CONTRACT_ID=.*/CONTRACT_ID=$CONTRACT_ID/" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    else
        echo "CONTRACT_ID=$CONTRACT_ID" >> "$ENV_FILE"
    fi
    echo "Updated $ENV_FILE with new CONTRACT_ID"
else
    # If file doesn't exist, create it from example if available
    if [ -f "../backend/.env.example" ]; then
        cp "../backend/.env.example" "$ENV_FILE"
        sed "s/CONTRACT_ID=.*/CONTRACT_ID=$CONTRACT_ID/" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
        echo "Created $ENV_FILE from .env.example and updated CONTRACT_ID"
    else
        echo "CONTRACT_ID=$CONTRACT_ID" > "$ENV_FILE"
        echo "Created $ENV_FILE with CONTRACT_ID"
    fi
fi
