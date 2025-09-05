use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::call::call;
use crate::state::{with_state, update_state};
use crate::types::{
    Icrc1Account, TransferError, GetDepositAddressArgs, RetrieveBtcArgs, 
    RetrieveBtcWithApprovalArgs, RetrieveBtcError, DepositAddressError,
    UtxoStatus, PendingUtxo
};

#[derive(CandidType, Deserialize)]
struct Icrc1BalanceOfArg { account: Icrc1Account }

#[derive(CandidType, Deserialize)]
struct Icrc1TransferArg {
    from_subaccount: Option<Vec<u8>>,
    to: Icrc1Account,
    amount: candid::Nat,
    fee: Option<candid::Nat>,
    memo: Option<Vec<u8>>,
    created_at_time: Option<u64>,
}

// Subaccount derivation utilities
pub fn derive_subaccount_from_principal(principal: &Principal) -> Vec<u8> {
    let mut subaccount = [0u8; 32];
    let principal_bytes = principal.as_slice();
    let len = principal_bytes.len().min(29);
    subaccount[0] = len as u8;
    subaccount[1..=len].copy_from_slice(&principal_bytes[..len]);
    subaccount.to_vec()
}

pub fn derive_subaccount_from_seed(seed: &str) -> Vec<u8> {
    // In production, use proper key derivation
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    use std::hash::{Hash, Hasher};
    seed.hash(&mut hasher);
    let hash = hasher.finish();
    let mut subaccount = [0u8; 32];
    subaccount[0..8].copy_from_slice(&hash.to_be_bytes());
    subaccount.to_vec()
}

// ICRC-1 Ledger Functions
#[ic_cdk::query]
pub async fn ckbtc_balance_of(subaccount: Option<Vec<u8>>) -> Result<candid::Nat, String> {
    let cfg = with_state(|state| state.config.clone().ok_or("config not set"))?;
    let account = Icrc1Account { owner: ic_cdk::caller(), subaccount };
    let (balance,): (candid::Nat,) = call(cfg.ckbtc_ledger, "icrc1_balance_of", (Icrc1BalanceOfArg { account },))
        .await
        .map_err(|e| format!("icrc1_balance_of failed: {:?}", e))?;
    Ok(balance)
}

#[ic_cdk::update]
pub async fn ckbtc_transfer(
    to_owner: Principal,
    to_sub: Option<Vec<u8>>,
    amount: candid::Nat,
    fee: Option<candid::Nat>,
    from_subaccount: Option<Vec<u8>>,
    memo: Option<Vec<u8>>,
) -> Result<u128, String> {
    let cfg = with_state(|state| state.config.clone().ok_or("config not set"))?;
    let arg = Icrc1TransferArg {
        from_subaccount,
        to: Icrc1Account { owner: to_owner, subaccount: to_sub },
        amount,
        fee,
        memo,
        created_at_time: Some(ic_cdk::api::time()),
    };
    let (res,): (Result<candid::Nat, TransferError>,) = call(cfg.ckbtc_ledger, "icrc1_transfer", (arg,))
        .await
        .map_err(|e| format!("icrc1_transfer failed: {:?}", e))?;
    match res { 
        Ok(height) => Ok(nat_to_u128(height)), 
        Err(e) => Err(format!("transfer error: {:?}", e)) 
    }
}

#[ic_cdk::query]
pub async fn get_transaction_fee() -> Result<candid::Nat, String> {
    let cfg = with_state(|state| state.config.clone().ok_or("config not set"))?;
    let (fee,): (candid::Nat,) = call(cfg.ckbtc_ledger, "icrc1_fee", ())
        .await
        .map_err(|e| format!("icrc1_fee failed: {:?}", e))?;
    Ok(fee)
}

// ckBTC Minter Functions
#[ic_cdk::update]
pub async fn get_deposit_address(subaccount: Option<Vec<u8>>) -> Result<String, String> {
    let cfg = with_state(|state| state.config.clone().ok_or("config not set"))?;
    let caller = ic_cdk::caller();
    
    let args = GetDepositAddressArgs {
        owner: Some(caller),
        subaccount: subaccount.clone(),
    };
    
    let (result,): (Result<String, DepositAddressError>,) = 
        call(cfg.ckbtc_minter, "get_deposit_address", (args,))
        .await
        .map_err(|e| format!("get_deposit_address failed: {:?}", e))?;
    
    match result {
        Ok(address) => {
            // Store the subaccount mapping
            update_state(|state| {
                if let Some(sub) = subaccount {
                    state.subaccounts.insert(caller, sub);
                }
            });
            Ok(address)
        },
        Err(e) => Err(format!("deposit address error: {:?}", e))
    }
}

#[ic_cdk::update]
pub async fn retrieve_btc(address: String, amount: u64) -> Result<u64, String> {
    let cfg = with_state(|state| state.config.clone().ok_or("config not set"))?;
    
    let args = RetrieveBtcArgs { address, amount };
    
    let (result,): (Result<u64, RetrieveBtcError>,) = 
        call(cfg.ckbtc_minter, "retrieve_btc", (args,))
        .await
        .map_err(|e| format!("retrieve_btc failed: {:?}", e))?;
    
    match result {
        Ok(block_index) => Ok(block_index),
        Err(e) => Err(format!("retrieve btc error: {:?}", e))
    }
}

#[ic_cdk::update]  
pub async fn retrieve_btc_with_approval(
    address: String, 
    amount: u64, 
    from_subaccount: Option<Vec<u8>>
) -> Result<u64, String> {
    let cfg = with_state(|state| state.config.clone().ok_or("config not set"))?;
    
    let args = RetrieveBtcWithApprovalArgs { 
        address, 
        amount, 
        from_subaccount 
    };
    
    let (result,): (Result<u64, RetrieveBtcError>,) = 
        call(cfg.ckbtc_minter, "retrieve_btc_with_approval", (args,))
        .await
        .map_err(|e| format!("retrieve_btc_with_approval failed: {:?}", e))?;
    
    match result {
        Ok(block_index) => Ok(block_index),
        Err(e) => Err(format!("retrieve btc with approval error: {:?}", e))
    }
}

#[ic_cdk::query]
pub async fn get_utxos(subaccount: Option<Vec<u8>>) -> Result<Vec<UtxoStatus>, String> {
    let cfg = with_state(|state| state.config.clone().ok_or("config not set"))?;
    let caller = ic_cdk::caller();
    
    let args = GetDepositAddressArgs {
        owner: Some(caller),
        subaccount,
    };
    
    let (utxos,): (Vec<UtxoStatus>,) = call(cfg.ckbtc_minter, "get_utxos", (args,))
        .await
        .map_err(|e| format!("get_utxos failed: {:?}", e))?;
    
    Ok(utxos)
}

#[ic_cdk::query]
pub async fn get_pending_utxos(subaccount: Option<Vec<u8>>) -> Result<Vec<PendingUtxo>, String> {
    let cfg = with_state(|state| state.config.clone().ok_or("config not set"))?;
    let caller = ic_cdk::caller();
    
    let args = GetDepositAddressArgs {
        owner: Some(caller),
        subaccount,
    };
    
    let (pending_utxos,): (Vec<PendingUtxo>,) = call(cfg.ckbtc_minter, "get_pending_utxos", (args,))
        .await
        .map_err(|e| format!("get_pending_utxos failed: {:?}", e))?;
    
    Ok(pending_utxos)
}

// Subaccount Management
#[ic_cdk::update]
pub fn create_subaccount(seed: String) -> Vec<u8> {
    let caller = ic_cdk::caller();
    let subaccount = derive_subaccount_from_seed(&format!("{}:{}", caller.to_text(), seed));
    
    update_state(|state| {
        state.subaccounts.insert(caller, subaccount.clone());
    });
    
    subaccount
}

#[ic_cdk::query]
pub fn get_user_subaccount() -> Option<Vec<u8>> {
    let caller = ic_cdk::caller();
    with_state(|state| state.subaccounts.get(&caller).cloned())
}

#[ic_cdk::query]
pub fn get_principal_subaccount() -> Vec<u8> {
    let caller = ic_cdk::caller();
    derive_subaccount_from_principal(&caller)
}

// Utility Functions
fn nat_to_u128(n: candid::Nat) -> u128 {
    use num_bigint::BigUint;
    use num_traits::cast::ToPrimitive;
    let b: BigUint = n.0; 
    b.to_u128().unwrap_or(0)
}

fn nat_to_u64(n: candid::Nat) -> u64 {
    use num_bigint::BigUint;
    use num_traits::cast::ToPrimitive;
    let b: BigUint = n.0; 
    b.to_u64().unwrap_or(0)
}

