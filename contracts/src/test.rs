#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::{Address as _, Events}, Address, Bytes, BytesN, Env};

#[test]
fn test_submit_and_get_payments() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);

    let employer = Address::generate(&env);
    let recipient = Address::generate(&env);
    
    let commitment = BytesN::from_array(&env, &[1u8; 32]);
    let encrypted_amount = Bytes::from_slice(&env, b"encrypted_salary_data");
    let nonce = BytesN::from_array(&env, &[2u8; 32]);
    let proof = Bytes::from_slice(&env, b"zk_proof_bytes");
    let public_signals = Bytes::from_slice(&env, b"public_signals");

    // 1. Submit first payment
    let payment_id_0 = client.submit_payment(
        &employer,
        &recipient,
        &commitment,
        &encrypted_amount,
        &nonce,
        &proof,
        &public_signals
    );
    assert_eq!(payment_id_0, 0);

    // 2. Submit second payment
    let payment_id_1 = client.submit_payment(
        &employer,
        &recipient,
        &commitment,
        &encrypted_amount,
        &nonce,
        &proof,
        &public_signals
    );
    assert_eq!(payment_id_1, 1);

    // 3. Verify get_payments
    let payments = client.get_payments(&employer);
    assert_eq!(payments.len(), 2);
    assert_eq!(payments.get(0).unwrap().commitment, commitment);

    // 4. Verify get_payment
    let payment = client.get_payment(&employer, &0);
    assert_eq!(payment.recipient, recipient);

    // 5. Verify events
    let events = env.events().all();
    assert!(events.len() >= 2);
}

#[test]
#[should_panic(expected = "Payment record not found")]
fn test_get_invalid_payment() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PayrollContract);
    let client = PayrollContractClient::new(&env, &contract_id);
    let employer = Address::generate(&env);

    client.get_payment(&employer, &999);
}
