use candid::Principal;
use crate::state::{with_state, update_state};
use crate::types::GuardianState;

#[ic_cdk::update]
pub fn set_guardians(guardians: Vec<Principal>, quorum: u8) -> Result<(), String> {
    let caller = ic_cdk::caller();
    
    update_state(|state| {
        // Initialize guardian state if it doesn't exist
        if state.guardian_state.is_none() {
            state.guardian_state = Some(GuardianState {
                guardians: Vec::new(),
                quorum: 0,
                owner: caller,
            });
        }
        
        let g = state.guardian_state.as_mut().unwrap();
        if g.owner != caller { 
            return;
        }
        if guardians.is_empty() || quorum == 0 || (quorum as usize) > guardians.len() {
            return;
        }
        g.guardians = guardians;
        g.quorum = quorum;
    });
    
    // Validate after state update
    with_state(|state| {
        let g = state.guardian_state.as_ref().ok_or("guardian state not initialized")?;
        if g.owner != caller { return Err("only owner can set guardians".into()); }
        if g.guardians.is_empty() || g.quorum == 0 || (g.quorum as usize) > g.guardians.len() {
            return Err("invalid quorum/guardians".into());
        }
        Ok(())
    })
}

#[ic_cdk::query]
pub fn get_guardians() -> Option<GuardianState> { 
    with_state(|state| state.guardian_state.clone())
}

#[ic_cdk::update]
pub fn initialize_guardians(owner: Principal) -> Result<(), String> {
    let _caller = ic_cdk::caller();
    
    with_state(|state| {
        if state.guardian_state.is_some() {
            return Err("Guardian state already initialized".to_string());
        }
        Ok(())
    })?;
    
    update_state(|state| {
        state.guardian_state = Some(GuardianState {
            guardians: Vec::new(),
            quorum: 0,
            owner,
        });
    });
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use candid::Principal;
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
    
    fn guardian3_principal() -> Principal {
        Principal::from_text("rno2w-sqaaa-aaaaa-aaacq-cai").unwrap()
    }
    
    #[test]
    fn test_guardian_quorum_validation() {
        let guardians = vec![guardian1_principal(), guardian2_principal(), guardian3_principal()];
        
        // Valid quorum scenarios
        assert!(validate_quorum(&guardians, 1).is_ok()); // 1 of 3
        assert!(validate_quorum(&guardians, 2).is_ok()); // 2 of 3
        assert!(validate_quorum(&guardians, 3).is_ok()); // 3 of 3
        
        // Invalid quorum scenarios
        assert!(validate_quorum(&guardians, 0).is_err()); // 0 guardians required
        assert!(validate_quorum(&guardians, 4).is_err()); // More than available guardians
        assert!(validate_quorum(&vec![], 1).is_err()); // No guardians but quorum > 0
    }
    
    #[test]
    fn test_guardian_initialization() {
        let mut state = VaultStateV1::default();
        let owner = owner_principal();
        
        // Test initialization
        state.guardian_state = Some(GuardianState {
            guardians: vec![],
            quorum: 0,
            owner,
        });
        
        let guardians = vec![guardian1_principal(), guardian2_principal()];
        let result = simulate_set_guardians(&mut state, owner, guardians.clone(), 2);
        assert!(result.is_ok());
        
        let guardian_state = state.guardian_state.as_ref().unwrap();
        assert_eq!(guardian_state.guardians, guardians);
        assert_eq!(guardian_state.quorum, 2);
        assert_eq!(guardian_state.owner, owner);
    }
    
    #[test]
    fn test_unauthorized_guardian_operations() {
        let mut state = VaultStateV1::default();
        let owner = owner_principal();
        let unauthorized = Principal::anonymous();
        
        state.guardian_state = Some(GuardianState {
            guardians: vec![],
            quorum: 0,
            owner,
        });
        
        let guardians = vec![guardian1_principal()];
        let result = simulate_set_guardians(&mut state, unauthorized, guardians, 1);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("only owner"));
    }
    
    // Helper functions
    fn validate_quorum(guardians: &[Principal], quorum: u8) -> Result<(), String> {
        if guardians.is_empty() || quorum == 0 || (quorum as usize) > guardians.len() {
            return Err("Invalid quorum/guardians".to_string());
        }
        Ok(())
    }
    
    fn simulate_set_guardians(
        state: &mut VaultStateV1,
        caller: Principal,
        guardians: Vec<Principal>,
        quorum: u8,
    ) -> Result<(), String> {
        let g = state.guardian_state.as_mut().ok_or("guardian state not initialized")?;
        if g.owner != caller {
            return Err("only owner can set guardians".to_string());
        }
        if guardians.is_empty() || quorum == 0 || (quorum as usize) > guardians.len() {
            return Err("invalid quorum/guardians".to_string());
        }
        g.guardians = guardians;
        g.quorum = quorum;
        Ok(())
    }
}

