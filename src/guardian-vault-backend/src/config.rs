use candid::Principal;
use crate::state::{update_state, with_state};
use crate::types::{Config, GuardianState};

#[ic_cdk::update]
pub fn init_config(ckbtc_ledger: Principal, ckbtc_minter: Principal, ecdsa_key_name: String) -> Result<(), String> {
    let caller = ic_cdk::caller();
    
    // Check if already initialized
    let already_init = with_state(|state| state.config.is_some());
    if already_init {
        return Err("Config already initialized".to_string());
    }
    
    update_state(|state| {
        state.config = Some(Config { ckbtc_ledger, ckbtc_minter, ecdsa_key_name });
        state.guardian_state = Some(GuardianState { guardians: vec![], quorum: 0, owner: caller });
    });
    
    Ok(())
}

#[ic_cdk::update]
pub fn set_config(ckbtc_ledger: Principal, ckbtc_minter: Principal, ecdsa_key_name: String) -> Result<(), String> {
    let caller = ic_cdk::caller();
    
    // Validate permissions
    with_state(|state| {
        let g = state.guardian_state.as_ref().ok_or("guardian state not initialized")?;
        if g.owner != caller { 
            return Err("only owner can set config".to_string()); 
        }
        Ok(())
    })?;
    
    // Update config
    update_state(|state| {
        state.config = Some(Config { ckbtc_ledger, ckbtc_minter, ecdsa_key_name });
    });
    
    Ok(())
}

#[ic_cdk::query]
pub fn get_config() -> Option<Config> {
    with_state(|state| state.config.clone())
}

