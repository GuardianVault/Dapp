use candid::Principal;
use crate::state::{with_state, update_state};
use crate::types::RecoveryRequest;

#[ic_cdk::update]
pub fn request_recovery(new_owner: Principal) -> Result<u64, String> {
    let caller = ic_cdk::caller();
    
    // Validate caller permissions and get next ID
    let id = with_state(|state| {
        let g = state.guardian_state.as_ref().ok_or("guardian state not initialized")?;
        if caller != g.owner && !g.guardians.contains(&caller) {
            return Err("only owner or guardian may open recovery".to_string());
        }
        Ok(state.next_recovery_id)
    })?;
    
    // Update state with new recovery request
    update_state(|state| {
        let recovery_id = state.next_recovery_id;
        state.next_recovery_id += 1;
        state.recovery_reqs.push(RecoveryRequest { 
            id: recovery_id, 
            new_owner, 
            approvals: vec![], 
            open: true 
        });
    });
    
    Ok(id)
}

#[ic_cdk::update]
pub fn approve_recovery(id: u64) -> Result<bool, String> {
    let caller = ic_cdk::caller();
    
    // Validate caller is a guardian and get quorum requirement
    let (quorum, owner) = with_state(|state| {
        let g = state.guardian_state.as_ref().ok_or("guardian state not initialized")?;
        if !g.guardians.contains(&caller) { 
            return Err("only guardian may approve".to_string()); 
        }
        Ok((g.quorum, g.owner))
    })?;
    
    // Process approval and check if quorum met
    let mut recovery_completed = false;
    let mut error_msg: Option<String> = None;
    
    update_state(|state| {
        if let Some(req) = state.recovery_reqs.iter_mut().find(|r| r.id == id && r.open) {
            if !req.approvals.contains(&caller) { 
                req.approvals.push(caller); 
            }
            
            if (req.approvals.len() as u8) >= quorum {
                // Transfer ownership
                if let Some(g) = state.guardian_state.as_mut() {
                    if g.owner == owner { 
                        g.owner = req.new_owner; 
                    }
                }
                req.open = false;
                recovery_completed = true;
            }
        } else {
            error_msg = Some("recovery request not found or closed".to_string());
        }
    });
    
    if let Some(err) = error_msg {
        return Err(err);
    }
    
    Ok(recovery_completed)
}

#[ic_cdk::query]
pub fn recovery_status(id: u64) -> Option<RecoveryRequest> { 
    with_state(|state| state.recovery_reqs.iter().find(|r| r.id == id).cloned())
}

#[ic_cdk::query]
pub fn get_recovery_requests(caller_principal: Option<Principal>) -> Vec<RecoveryRequest> {
    let caller = caller_principal.unwrap_or_else(|| ic_cdk::caller());
    with_state(|state| {
        let g = match &state.guardian_state {
            Some(g) => g,
            None => return Vec::new(),
        };
        
        // Only return requests if caller is owner or guardian
        if caller == g.owner || g.guardians.contains(&caller) {
            state.recovery_reqs.clone()
        } else {
            Vec::new()
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use candid::Principal;
    use crate::state::VaultStateV1;
    use crate::types::{GuardianState, RecoveryRequest};
    
    fn owner_principal() -> Principal {
        Principal::from_text("rdmx6-jaaaa-aaaaa-aaadq-cai").unwrap()
    }
    
    fn guardian1_principal() -> Principal {
        Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai").unwrap()
    }
    
    fn guardian2_principal() -> Principal {
        Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap()
    }
    
    fn guardian3_principal() -> Principal {
        Principal::from_text("rno2w-sqaaa-aaaaa-aaacq-cai").unwrap()
    }
    
    fn new_owner_principal() -> Principal {
        Principal::from_text("renrk-eyaaa-aaaaa-aaada-cai").unwrap()
    }
    
    fn setup_test_state_with_guardians() -> VaultStateV1 {
        let mut state = VaultStateV1::default();
        state.guardian_state = Some(GuardianState {
            guardians: vec![guardian1_principal(), guardian2_principal(), guardian3_principal()],
            quorum: 2,
            owner: owner_principal(),
        });
        state
    }
    
    #[test]
    fn test_recovery_request_creation() {
        let state = setup_test_state_with_guardians();
        let new_owner = new_owner_principal();
        
        // Test that owner can create recovery request
        let result = simulate_create_recovery_request(&state, owner_principal(), new_owner);
        assert!(result.is_ok());
        
        // Test that guardian can create recovery request
        let result = simulate_create_recovery_request(&state, guardian1_principal(), new_owner);
        assert!(result.is_ok());
        
        // Test that unauthorized principal cannot create recovery request
        let unauthorized = Principal::anonymous(); // Use anonymous principal for testing
        let result = simulate_create_recovery_request(&state, unauthorized, new_owner);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_recovery_approval_quorum() {
        let mut state = setup_test_state_with_guardians();
        let new_owner = new_owner_principal();
        
        // Create a recovery request
        let recovery_id = 1;
        state.recovery_reqs.push(RecoveryRequest {
            id: recovery_id,
            new_owner,
            approvals: vec![],
            open: true,
        });
        
        // Test first approval (should not complete recovery)
        let result = simulate_process_recovery_approval(&mut state, recovery_id, guardian1_principal());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), false); // Recovery not complete yet
        assert_eq!(state.recovery_reqs[0].approvals.len(), 1);
        assert!(state.recovery_reqs[0].open);
        
        // Test second approval (should complete recovery with quorum of 2)
        let result = simulate_process_recovery_approval(&mut state, recovery_id, guardian2_principal());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), true); // Recovery complete
        assert_eq!(state.recovery_reqs[0].approvals.len(), 2);
        assert!(!state.recovery_reqs[0].open); // Request should be closed
        
        // Verify ownership transfer
        assert_eq!(state.guardian_state.as_ref().unwrap().owner, new_owner);
    }
    
    #[test]
    fn test_duplicate_approval_handling() {
        let mut state = setup_test_state_with_guardians();
        let new_owner = new_owner_principal();
        
        // Create a recovery request
        let recovery_id = 1;
        state.recovery_reqs.push(RecoveryRequest {
            id: recovery_id,
            new_owner,
            approvals: vec![],
            open: true,
        });
        
        // First approval
        let result = simulate_process_recovery_approval(&mut state, recovery_id, guardian1_principal());
        assert!(result.is_ok());
        assert_eq!(state.recovery_reqs[0].approvals.len(), 1);
        
        // Duplicate approval from same guardian
        let result = simulate_process_recovery_approval(&mut state, recovery_id, guardian1_principal());
        assert!(result.is_ok());
        assert_eq!(state.recovery_reqs[0].approvals.len(), 1); // Should remain 1
    }
    
    #[test]
    fn test_unauthorized_approval() {
        let mut state = setup_test_state_with_guardians();
        let new_owner = new_owner_principal();
        
        // Create a recovery request
        let recovery_id = 1;
        state.recovery_reqs.push(RecoveryRequest {
            id: recovery_id,
            new_owner,
            approvals: vec![],
            open: true,
        });
        
        // Test approval from non-guardian
        let unauthorized = Principal::anonymous(); // Use anonymous principal for testing
        let result = simulate_process_recovery_approval(&mut state, recovery_id, unauthorized);
        assert!(result.is_err());
    }
    
    // Helper functions for testing
    fn simulate_create_recovery_request(
        state: &VaultStateV1,
        caller: Principal,
        new_owner: Principal,
    ) -> Result<u64, String> {
        let g = state.guardian_state.as_ref().ok_or("guardian state not initialized")?;
        if caller != g.owner && !g.guardians.contains(&caller) {
            return Err("only owner or guardian may open recovery".to_string());
        }
        Ok(state.next_recovery_id)
    }
    
    fn simulate_process_recovery_approval(
        state: &mut VaultStateV1,
        id: u64,
        caller: Principal,
    ) -> Result<bool, String> {
        let (quorum, owner) = {
            let g = state.guardian_state.as_ref().ok_or("guardian state not initialized")?;
            if !g.guardians.contains(&caller) {
                return Err("only guardian may approve".to_string());
            }
            (g.quorum, g.owner)
        };
        
        let req = state.recovery_reqs.iter_mut()
            .find(|r| r.id == id && r.open)
            .ok_or("recovery request not found or closed")?;
        
        if !req.approvals.contains(&caller) {
            req.approvals.push(caller);
        }
        
        if (req.approvals.len() as u8) >= quorum {
            // Transfer ownership
            if let Some(g) = state.guardian_state.as_mut() {
                if g.owner == owner {
                    g.owner = req.new_owner;
                }
            }
            req.open = false;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

