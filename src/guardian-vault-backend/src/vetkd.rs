use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::call::call;
use serde::Serialize;
use crate::state::{with_state, update_state};
use crate::types::{GuardianState, RecoveryRequest};
use sha2::{Sha256, Digest};
use std::collections::HashMap;

// VetKD Management Canister Types
#[derive(CandidType, Deserialize)]
struct VetKdPublicKeyArgs { 
    canister_id: Option<Principal>, 
    derivation_id: Vec<u8>,
    key_id: VetKdKeyId
}

#[derive(CandidType, Deserialize)]
struct VetKdKeyId {
    curve: String,
    name: String,
}

#[derive(CandidType, Deserialize)]
struct VetKdPublicKeyReply { 
    public_key: Vec<u8> 
}

#[derive(CandidType, Deserialize)]
struct VetKdEncryptedKeyArgs { 
    derivation_id: Vec<u8>, 
    public_key_derivation_path: Vec<Vec<u8>>,
    encryption_public_key: Vec<u8>,
    key_id: VetKdKeyId
}

#[derive(CandidType, Deserialize)]
struct VetKdEncryptedKeyReply { 
    encrypted_key: Vec<u8> 
}

// Guardian Recovery Types
#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct GuardianShare {
    pub guardian: Principal,
    pub encrypted_share: Vec<u8>,
    pub share_index: u8,
    pub derivation_path: Vec<Vec<u8>>,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct RecoverySecret {
    pub secret_id: Vec<u8>,
    pub guardian_shares: HashMap<Principal, GuardianShare>,
    pub threshold: u8,
    pub created_at: u64,
}

// Core VetKD Functions
#[ic_cdk::update]
pub async fn vetkd_public_key(derivation_id: Vec<u8>) -> Result<Vec<u8>, String> {
    let cfg = with_state(|state| state.config.clone().ok_or("config not set"))?;
    
    let args = VetKdPublicKeyArgs { 
        canister_id: Some(ic_cdk::id()), 
        derivation_id,
        key_id: VetKdKeyId {
            curve: "bls12_381".to_string(),
            name: cfg.ecdsa_key_name.clone()
        }
    };
    
    let (res,): (VetKdPublicKeyReply,) = call(
        Principal::management_canister(), 
        "vetkd_public_key", 
        (args,)
    )
    .await
    .map_err(|e| format!("vetkd_public_key failed: {:?}", e))?;
    
    Ok(res.public_key)
}

#[ic_cdk::update]
pub async fn vetkd_encrypted_key(
    derivation_id: Vec<u8>, 
    public_key_derivation_path: Vec<Vec<u8>>,
    encryption_public_key: Vec<u8>
) -> Result<Vec<u8>, String> {
    let cfg = with_state(|state| state.config.clone().ok_or("config not set"))?;
    
    let args = VetKdEncryptedKeyArgs { 
        derivation_id,
        public_key_derivation_path,
        encryption_public_key,
        key_id: VetKdKeyId {
            curve: "bls12_381".to_string(),
            name: cfg.ecdsa_key_name.clone()
        }
    };
    
    let (res,): (VetKdEncryptedKeyReply,) = call(
        Principal::management_canister(), 
        "vetkd_encrypted_key", 
        (args,)
    )
    .await
    .map_err(|e| format!("vetkd_encrypted_key failed: {:?}", e))?;
    
    Ok(res.encrypted_key)
}

// Guardian Recovery Functions
#[ic_cdk::update]
pub async fn create_guardian_shares(guardians: Vec<Principal>) -> Result<Vec<u8>, String> {
    let caller = ic_cdk::caller();
    
    // Verify caller is owner
    let guardian_state = with_state(|state| {
        let g = state.guardian_state.as_ref().ok_or("guardian state not initialized")?;
        if g.owner != caller {
            return Err("only owner can create guardian shares".to_string());
        }
        Ok(g.clone())
    })?;
    
    if guardians.is_empty() || guardians.len() != guardian_state.guardians.len() {
        return Err("guardian list mismatch".to_string());
    }
    
    // Generate unique secret ID
    let secret_id = generate_secret_id(&caller, &guardians);
    
    // Create derivation path for the secret
    let secret_derivation_path = vec![secret_id.clone(), b"vault_recovery".to_vec()];
    
    // Get the master public key for this secret
    let master_public_key = vetkd_public_key(secret_id.clone()).await?;
    
    // Create encrypted shares for each guardian
    let mut guardian_shares = HashMap::new();
    
    for (index, guardian) in guardians.iter().enumerate() {
        // Create unique derivation path for this guardian
        let guardian_derivation_path = vec![
            secret_id.clone(),
            guardian.as_slice().to_vec(),
            (index as u8).to_be_bytes().to_vec(),
        ];
        
        // For demo purposes, we'll create a placeholder encryption key
        // In production, this would come from the guardian's identity or device
        let guardian_encryption_key = generate_guardian_encryption_key(guardian);
        
        // Create encrypted share for this guardian
        let encrypted_share = vetkd_encrypted_key(
            secret_id.clone(),
            guardian_derivation_path.clone(),
            guardian_encryption_key
        ).await?;
        
        let share = GuardianShare {
            guardian: *guardian,
            encrypted_share,
            share_index: index as u8,
            derivation_path: guardian_derivation_path,
        };
        
        guardian_shares.insert(*guardian, share);
    }
    
    // Store the recovery secret
    let recovery_secret = RecoverySecret {
        secret_id: secret_id.clone(),
        guardian_shares,
        threshold: guardian_state.quorum,
        created_at: ic_cdk::api::time(),
    };
    
    update_state(|state| {
        state.recovery_secrets.insert(secret_id.clone(), recovery_secret);
    });
    
    Ok(secret_id)
}

#[ic_cdk::query]
pub fn get_guardian_share(secret_id: Vec<u8>) -> Result<Option<GuardianShare>, String> {
    let caller = ic_cdk::caller();
    
    with_state(|state| {
        if let Some(recovery_secret) = state.recovery_secrets.get(&secret_id) {
            Ok(recovery_secret.guardian_shares.get(&caller).cloned())
        } else {
            Ok(None)
        }
    })
}

#[ic_cdk::update]
pub async fn submit_recovery_share(
    recovery_id: u64,
    secret_id: Vec<u8>,
    decrypted_share: Vec<u8>
) -> Result<bool, String> {
    let caller = ic_cdk::caller();
    
    // Verify caller is a guardian for this recovery
    let (is_guardian, quorum) = with_state(|state| -> Result<(bool, u8), String> {
        let g = state.guardian_state.as_ref().ok_or("guardian state not initialized")?;
        let is_guardian = g.guardians.contains(&caller);
        Ok((is_guardian, g.quorum))
    })?;
    
    if !is_guardian {
        return Err("only guardians can submit recovery shares".to_string());
    }
    
    // Verify the recovery request exists and is open
    let recovery_complete = with_state(|state| {
        let req = state.recovery_reqs.iter()
            .find(|r| r.id == recovery_id && r.open)
            .ok_or("recovery request not found or closed")?;
        
        // In production, verify the decrypted share is valid
        // For now, we'll trust the guardian's submission
        Ok(false) // Not complete yet
    })?;
    
    // Store the submitted share
    update_state(|state| {
        state.submitted_recovery_shares
            .entry(recovery_id)
            .or_insert_with(HashMap::new)
            .insert(caller, decrypted_share);
    });
    
    // Check if we have enough shares to complete recovery
    let shares_count = with_state(|state| {
        state.submitted_recovery_shares
            .get(&recovery_id)
            .map(|shares| shares.len() as u8)
            .unwrap_or(0)
    });
    
    if shares_count >= quorum {
        // In production, this would trigger proper share combination
        // For now, we'll handle it in the calling function
        Ok(true)
    } else {
        Ok(false)
    }
}

#[ic_cdk::update]
pub async fn complete_recovery(recovery_id: u64) -> Result<bool, String> {
    // Verify we have enough shares
    let (shares, quorum, new_owner) = with_state(|state| {
        let shares = state.submitted_recovery_shares
            .get(&recovery_id)
            .ok_or("no recovery shares found")?;
        
        let req = state.recovery_reqs.iter()
            .find(|r| r.id == recovery_id && r.open)
            .ok_or("recovery request not found or closed")?;
        
        let g = state.guardian_state.as_ref().ok_or("guardian state not initialized")?;
        
        if (shares.len() as u8) < g.quorum {
            Err("insufficient recovery shares".to_string())
        } else {
            Ok((shares.clone(), g.quorum, req.new_owner))
        }
    })?;
    
    // In production, combine the shares to reconstruct the secret
    // For now, we'll mark the recovery as complete
    
    update_state(|state| {
        // Transfer ownership
        if let Some(g) = state.guardian_state.as_mut() {
            g.owner = new_owner;
        }
        
        // Close the recovery request
        if let Some(req) = state.recovery_reqs.iter_mut().find(|r| r.id == recovery_id) {
            req.open = false;
        }
        
        // Clear the recovery shares
        state.submitted_recovery_shares.remove(&recovery_id);
    });
    
    Ok(true)
}

// Helper functions
fn generate_secret_id(owner: &Principal, guardians: &[Principal]) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(b"guardian_vault_recovery_");
    hasher.update(owner.as_slice());
    for guardian in guardians {
        hasher.update(guardian.as_slice());
    }
    hasher.update(&ic_cdk::api::time().to_be_bytes());
    hasher.finalize().to_vec()
}

fn generate_guardian_encryption_key(guardian: &Principal) -> Vec<u8> {
    // In production, this would be derived from the guardian's identity
    // or provided by their device during setup
    let mut hasher = Sha256::new();
    hasher.update(b"guardian_encryption_key_");
    hasher.update(guardian.as_slice());
    hasher.finalize().to_vec()
}

#[ic_cdk::query]
pub fn get_recovery_status_for_guardian(recovery_id: u64) -> Result<Option<RecoveryRequest>, String> {
    let caller = ic_cdk::caller();
    
    with_state(|state| {
        let g = state.guardian_state.as_ref().ok_or("guardian state not initialized")?;
        
        if !g.guardians.contains(&caller) {
            return Err("only guardians can check recovery status".to_string());
        }
        
        Ok(state.recovery_reqs.iter().find(|r| r.id == recovery_id).cloned())
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::VaultStateV1;
    use crate::types::GuardianState;
    
    fn owner_principal() -> Principal {
        Principal::from_text("rdmx6-jaaaa-aaaaa-aaadq-cai").unwrap()
    }
    
    fn guardian1_principal() -> Principal {
        Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai").unwrap()
    }
    
    fn guardian2_principal() -> Principal {
        Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap()
    }
    
    #[test]
    fn test_secret_id_generation() {
        let owner = owner_principal();
        let guardians = vec![guardian1_principal(), guardian2_principal()];
        
        let secret_id1 = generate_secret_id(&owner, &guardians);
        let secret_id2 = generate_secret_id(&owner, &guardians);
        
        // Should be different due to timestamp
        assert_ne!(secret_id1, secret_id2);
        assert_eq!(secret_id1.len(), 32); // SHA256 output
    }
    
    #[test]
    fn test_guardian_encryption_key_generation() {
        let guardian = guardian1_principal();
        
        let key1 = generate_guardian_encryption_key(&guardian);
        let key2 = generate_guardian_encryption_key(&guardian);
        
        // Should be deterministic for same guardian
        assert_eq!(key1, key2);
        assert_eq!(key1.len(), 32); // SHA256 output
    }
}

