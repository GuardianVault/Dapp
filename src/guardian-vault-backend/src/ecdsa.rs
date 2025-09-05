use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::call::call;
use crate::state::{with_state, update_state};
use sha2::{Sha256, Digest};
use std::collections::HashMap;

// ECDSA Management Canister Types
#[derive(CandidType, Deserialize)]
struct EcdsaPublicKeyArgs { 
    canister_id: Option<Principal>, 
    derivation_path: Vec<Vec<u8>>, 
    key_id: EcdsaKeyId 
}

#[derive(CandidType, Deserialize)]
struct EcdsaKeyId { 
    curve: String, 
    name: String 
}

#[derive(CandidType, Deserialize)]
struct EcdsaPublicKeyReply { 
    public_key: Vec<u8> 
}

#[derive(CandidType, Deserialize)]
struct SignWithEcdsaArgs { 
    message_hash: Vec<u8>, 
    derivation_path: Vec<Vec<u8>>, 
    key_id: EcdsaKeyId 
}

#[derive(CandidType, Deserialize)]
struct SignWithEcdsaReply { 
    signature: Vec<u8> 
}

// Bitcoin address and transaction types
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct BitcoinAddress {
    pub address: String,
    pub derivation_path: Vec<Vec<u8>>,
    pub public_key: Vec<u8>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct BitcoinTransaction {
    pub inputs: Vec<TransactionInput>,
    pub outputs: Vec<TransactionOutput>,
    pub fee: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct TransactionInput {
    pub previous_output: OutPoint,
    pub script_sig: Vec<u8>,
    pub sequence: u32,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct TransactionOutput {
    pub value: u64,
    pub script_pubkey: Vec<u8>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct OutPoint {
    pub txid: Vec<u8>,
    pub vout: u32,
}

// Core ECDSA Functions
#[ic_cdk::update]
pub async fn ecdsa_public_key(derivation_path: Vec<Vec<u8>>) -> Result<Vec<u8>, String> {
    let cfg = with_state(|state| state.config.clone().ok_or("config not set"))?;
    
    let args = EcdsaPublicKeyArgs {
        canister_id: Some(ic_cdk::id()),
        derivation_path,
        key_id: EcdsaKeyId { 
            curve: "secp256k1".to_string(), 
            name: cfg.ecdsa_key_name 
        },
    };
    
    let (res,): (EcdsaPublicKeyReply,) = call(
        Principal::management_canister(), 
        "ecdsa_public_key", 
        (args,)
    )
    .await
    .map_err(|e| format!("ecdsa_public_key failed: {:?}", e))?;
    
    Ok(res.public_key)
}

#[ic_cdk::update]
pub async fn sign_with_ecdsa(
    message_hash: Vec<u8>, 
    derivation_path: Vec<Vec<u8>>
) -> Result<Vec<u8>, String> {
    let cfg = with_state(|state| state.config.clone().ok_or("config not set"))?;
    
    let args = SignWithEcdsaArgs { 
        message_hash, 
        derivation_path, 
        key_id: EcdsaKeyId { 
            curve: "secp256k1".to_string(), 
            name: cfg.ecdsa_key_name 
        } 
    };
    
    let (res,): (SignWithEcdsaReply,) = call(
        Principal::management_canister(), 
        "sign_with_ecdsa", 
        (args,)
    )
    .await
    .map_err(|e| format!("sign_with_ecdsa failed: {:?}", e))?;
    
    Ok(res.signature)
}

// Bitcoin Address Generation
#[ic_cdk::update]
pub async fn generate_bitcoin_address() -> Result<String, String> {
    let caller = ic_cdk::caller();
    
    // Create unique derivation path for this user
    let derivation_path = create_user_derivation_path(&caller);
    
    // Get the public key from threshold ECDSA
    let public_key = ecdsa_public_key(derivation_path.clone()).await?;
    
    // Generate Bitcoin address from public key
    let address = public_key_to_bitcoin_address(&public_key)?;
    
    // Store the address mapping
    update_state(|state| {
        state.btc_addresses.insert(caller, address.clone());
    });
    
    Ok(address)
}

#[ic_cdk::query]
pub fn get_bitcoin_address() -> Option<String> {
    let caller = ic_cdk::caller();
    with_state(|state| state.btc_addresses.get(&caller).cloned())
}

#[ic_cdk::update]
pub async fn get_or_create_bitcoin_address() -> Result<String, String> {
    let caller = ic_cdk::caller();
    
    // Check if address already exists
    if let Some(existing_address) = with_state(|state| state.btc_addresses.get(&caller).cloned()) {
        return Ok(existing_address);
    }
    
    // Create new address
    generate_bitcoin_address().await
}

// Bitcoin Transaction Signing
#[ic_cdk::update]
pub async fn sign_bitcoin_transaction(
    transaction: BitcoinTransaction,
    input_index: u32
) -> Result<Vec<u8>, String> {
    let caller = ic_cdk::caller();
    
    // Verify caller owns this transaction (basic check)
    // In production, implement proper authorization
    
    // Create derivation path for the caller
    let derivation_path = create_user_derivation_path(&caller);
    
    // Serialize transaction for signing
    let tx_hash = create_transaction_hash(&transaction, input_index)?;
    
    // Sign with threshold ECDSA
    let signature = sign_with_ecdsa(tx_hash, derivation_path).await?;
    
    Ok(signature)
}

// Wallet Management
#[ic_cdk::update]
pub async fn derive_child_key(child_index: u32) -> Result<Vec<u8>, String> {
    let caller = ic_cdk::caller();
    
    // Create child derivation path
    let mut derivation_path = create_user_derivation_path(&caller);
    derivation_path.push(child_index.to_be_bytes().to_vec());
    
    // Get child public key
    let child_public_key = ecdsa_public_key(derivation_path).await?;
    
    Ok(child_public_key)
}

#[ic_cdk::query]
pub fn get_wallet_info() -> Result<WalletInfo, String> {
    let caller = ic_cdk::caller();
    
    with_state(|state| {
        let btc_address = state.btc_addresses.get(&caller).cloned();
        let subaccount = state.subaccounts.get(&caller).cloned();
        
        Ok(WalletInfo {
            owner: caller,
            bitcoin_address: btc_address,
            subaccount,
            derivation_path: create_user_derivation_path(&caller),
        })
    })
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct WalletInfo {
    pub owner: Principal,
    pub bitcoin_address: Option<String>,
    pub subaccount: Option<Vec<u8>>,
    pub derivation_path: Vec<Vec<u8>>,
}

// Helper Functions
fn create_user_derivation_path(user: &Principal) -> Vec<Vec<u8>> {
    vec![
        b"guardian_vault".to_vec(),
        user.as_slice().to_vec(),
    ]
}

fn public_key_to_bitcoin_address(public_key: &[u8]) -> Result<String, String> {
    // For demo purposes, create a simplified address
    // In production, implement proper Bitcoin address generation with:
    // 1. RIPEMD160(SHA256(public_key))
    // 2. Add version byte
    // 3. Double SHA256 checksum
    // 4. Base58 encoding
    
    if public_key.len() != 33 && public_key.len() != 65 {
        return Err("Invalid public key length".to_string());
    }
    
    // Create a mock Bitcoin address for demo
    let mut hasher = Sha256::new();
    hasher.update(b"btc_address_");
    hasher.update(public_key);
    let hash = hasher.finalize();
    
    // Convert to a Bitcoin-like address (mock)
    let address = format!("bc1q{}", hex::encode(&hash[..20]));
    
    Ok(address)
}

fn create_transaction_hash(
    transaction: &BitcoinTransaction,
    input_index: u32
) -> Result<Vec<u8>, String> {
    // Simplified transaction hashing for demo
    // In production, implement proper Bitcoin transaction serialization and hashing
    
    let mut hasher = Sha256::new();
    
    // Hash transaction data
    hasher.update(&input_index.to_be_bytes());
    
    for input in &transaction.inputs {
        hasher.update(&input.previous_output.txid);
        hasher.update(&input.previous_output.vout.to_be_bytes());
        hasher.update(&input.sequence.to_be_bytes());
    }
    
    for output in &transaction.outputs {
        hasher.update(&output.value.to_be_bytes());
        hasher.update(&output.script_pubkey);
    }
    
    hasher.update(&transaction.fee.to_be_bytes());
    
    // Double SHA256 as per Bitcoin protocol
    let first_hash = hasher.finalize();
    let mut second_hasher = Sha256::new();
    second_hasher.update(&first_hash);
    let final_hash = second_hasher.finalize();
    
    Ok(final_hash.to_vec())
}

// Add hex dependency helper (would need to add to Cargo.toml)
// For now, implement basic hex encoding
mod hex {
    pub fn encode(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{:02x}", b)).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_derivation_path_creation() {
        let user = Principal::from_text("rdmx6-jaaaa-aaaaa-aaadq-cai").unwrap();
        let path = create_user_derivation_path(&user);
        
        assert_eq!(path.len(), 2);
        assert_eq!(path[0], b"guardian_vault".to_vec());
        assert_eq!(path[1], user.as_slice().to_vec());
    }
    
    #[test]
    fn test_public_key_to_address() {
        // Test with compressed public key (33 bytes)
        let compressed_key = vec![0x02; 33];
        let address = public_key_to_bitcoin_address(&compressed_key);
        assert!(address.is_ok());
        assert!(address.unwrap().starts_with("bc1q"));
        
        // Test with uncompressed public key (65 bytes)
        let uncompressed_key = vec![0x04; 65];
        let address = public_key_to_bitcoin_address(&uncompressed_key);
        assert!(address.is_ok());
        
        // Test with invalid key length
        let invalid_key = vec![0x00; 32];
        let address = public_key_to_bitcoin_address(&invalid_key);
        assert!(address.is_err());
    }
    
    #[test]
    fn test_transaction_hash_creation() {
        let transaction = BitcoinTransaction {
            inputs: vec![
                TransactionInput {
                    previous_output: OutPoint {
                        txid: vec![0x01; 32],
                        vout: 0,
                    },
                    script_sig: vec![],
                    sequence: 0xffffffff,
                }
            ],
            outputs: vec![
                TransactionOutput {
                    value: 50000,
                    script_pubkey: vec![0x76, 0xa9, 0x14], // OP_DUP OP_HASH160 ...
                }
            ],
            fee: 1000,
        };
        
        let hash = create_transaction_hash(&transaction, 0);
        assert!(hash.is_ok());
        assert_eq!(hash.unwrap().len(), 32); // SHA256 output length
    }
}