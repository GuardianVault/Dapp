use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::call::call;
use ic_cdk::export::candid;
use ic_cdk::storage;
use serde::Serialize;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Config {
    /// ICRC-1 ckBTC ledger canister ID
    ckbtc_ledger: Principal,
    /// ckBTC minter canister ID (for deposit/withdrawal flows)
    ckbtc_minter: Principal,
    /// ECDSA key name configured on subnet (e.g., "secp256k1")
    ecdsa_key_name: String,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct GuardianState {
    guardians: Vec<Principal>,
    quorum: u8,
    owner: Principal,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct RecoveryRequest {
    id: u64,
    new_owner: Principal,
    approvals: Vec<Principal>,
    open: bool,
}

#[derive(Default, CandidType, Deserialize, Serialize)]
pub struct VaultState {
    config: Option<Config>,
    guardian_state: Option<GuardianState>,
    next_recovery_id: u64,
    recovery_reqs: Vec<RecoveryRequest>,
}

fn state_mut() -> &'static mut VaultState {
    storage::get_mut::<VaultState>()
}

fn state() -> &'static VaultState {
    storage::get::<VaultState>()
}

#[ic_cdk::init]
fn init(ckbtc_ledger: Principal, ckbtc_minter: Principal, ecdsa_key_name: String) {
    let caller = ic_cdk::caller();
    let st = state_mut();
    st.config = Some(Config { ckbtc_ledger, ckbtc_minter, ecdsa_key_name });
    st.guardian_state = Some(GuardianState {
        guardians: vec![],
        quorum: 0,
        owner: caller,
    });
}

#[ic_cdk::update]
fn set_guardians(guardians: Vec<Principal>, quorum: u8) -> Result<(), String> {
    let caller = ic_cdk::caller();
    let st = state_mut();
    let g = st
        .guardian_state
        .as_mut()
        .ok_or("guardian state not initialized")?;
    if g.owner != caller {
        return Err("only owner can set guardians".into());
    }
    if guardians.is_empty() || quorum == 0 || (quorum as usize) > guardians.len() {
        return Err("invalid quorum/guardians".into());
    }
    g.guardians = guardians;
    g.quorum = quorum;
    Ok(())
}

#[ic_cdk::update]
fn set_config(ckbtc_ledger: Principal, ckbtc_minter: Principal, ecdsa_key_name: String) -> Result<(), String> {
    let caller = ic_cdk::caller();
    let st = state_mut();
    let g = st
        .guardian_state
        .as_ref()
        .ok_or("guardian state not initialized")?;
    if g.owner != caller { return Err("only owner can set config".into()); }
    st.config = Some(Config { ckbtc_ledger, ckbtc_minter, ecdsa_key_name });
    Ok(())
}

#[ic_cdk::query]
fn get_guardians() -> Option<GuardianState> {
    state().guardian_state.clone()
}

#[ic_cdk::update]
fn request_recovery(new_owner: Principal) -> Result<u64, String> {
    let caller = ic_cdk::caller();
    let st = state_mut();
    let g = st
        .guardian_state
        .as_ref()
        .ok_or("guardian state not initialized")?;
    if caller != g.owner && !g.guardians.contains(&caller) {
        return Err("only owner or guardian may open recovery".into());
    }
    let id = st.next_recovery_id;
    st.next_recovery_id += 1;
    st.recovery_reqs.push(RecoveryRequest {
        id,
        new_owner,
        approvals: vec![],
        open: true,
    });
    Ok(id)
}

#[ic_cdk::update]
fn approve_recovery(id: u64) -> Result<bool, String> {
    let caller = ic_cdk::caller();
    let st = state_mut();
    let (quorum, owner);
    {
        let g = st
            .guardian_state
            .as_ref()
            .ok_or("guardian state not initialized")?;
        if !g.guardians.contains(&caller) {
            return Err("only guardian may approve".into());
        }
        quorum = g.quorum;
        owner = g.owner;
    }
    let req = st
        .recovery_reqs
        .iter_mut()
        .find(|r| r.id == id && r.open)
        .ok_or("recovery request not found or closed")?;
    if !req.approvals.contains(&caller) {
        req.approvals.push(caller);
    }
    if (req.approvals.len() as u8) >= quorum {
        // finalize
        if let Some(g) = st.guardian_state.as_mut() {
            if g.owner == owner {
                g.owner = req.new_owner;
            }
        }
        req.open = false;
        return Ok(true);
    }
    Ok(false)
}

#[ic_cdk::query]
fn recovery_status(id: u64) -> Option<RecoveryRequest> {
    state().recovery_reqs.iter().find(|r| r.id == id).cloned()
}

// ----------------- ckBTC ICRC-1 Ledger bindings -----------------

#[derive(CandidType, Deserialize)]
struct Icrc1BalanceOfArg {
    account: Icrc1Account,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Icrc1Account {
    owner: Principal,
    subaccount: Option<Vec<u8>>, // 32 bytes if present
}

#[derive(CandidType, Deserialize)]
struct Icrc1TransferArg {
    from_subaccount: Option<Vec<u8>>,
    to: Icrc1Account,
    amount: candid::Nat,
    fee: Option<candid::Nat>,
    memo: Option<Vec<u8>>,
    created_at_time: Option<u64>,
}

#[ic_cdk::query]
async fn ckbtc_balance_of(subaccount: Option<Vec<u8>>) -> Result<candid::Nat, String> {
    let cfg = state().config.clone().ok_or("config not set")?;
    let account = Icrc1Account {
        owner: ic_cdk::caller(),
        subaccount,
    };
    let (balance,): (candid::Nat,) = call(
        cfg.ckbtc_ledger,
        "icrc1_balance_of",
        (Icrc1BalanceOfArg { account },),
    )
    .await
    .map_err(|e| format!("icrc1_balance_of failed: {:?}", e))?;
    Ok(balance)
}

#[ic_cdk::update]
async fn ckbtc_transfer(
    to_owner: Principal,
    to_sub: Option<Vec<u8>>,
    amount: candid::Nat,
    fee: Option<candid::Nat>,
) -> Result<u128, String> {
    let cfg = state().config.clone().ok_or("config not set")?;
    let arg = Icrc1TransferArg {
        from_subaccount: None,
        to: Icrc1Account { owner: to_owner, subaccount: to_sub },
        amount,
        fee,
        memo: None,
        created_at_time: None,
    };
    let (res,): (Result<candid::Nat, TransferError>,) = call(cfg.ckbtc_ledger, "icrc1_transfer", (arg,))
        .await
        .map_err(|e| format!("icrc1_transfer failed: {:?}", e))?;
    match res {
        Ok(height) => Ok(nat_to_u128(height)),
        Err(e) => Err(format!("transfer error: {:?}", e)),
    }
}

#[derive(CandidType, Deserialize, Debug)]
pub enum TransferError {
    BadFee { expected_fee: candid::Nat },
    BadBurn { min_burn_amount: candid::Nat },
    InsufficientFunds { balance: candid::Nat },
    TooOld,
    CreatedInFuture { ledger_time: u64 },
    TemporarilyUnavailable,
    Duplicate { duplicate_of: candid::Nat },
    GenericError { error_code: candid::Nat, message: String },
}

fn nat_to_u128(n: candid::Nat) -> u128 {
    use num_bigint::BigUint;
    use num_traits::cast::ToPrimitive;
    let b: BigUint = n.0;
    b.to_u128().unwrap_or(0)
}

// ----------------- Management canister: tECDSA -----------------

#[derive(CandidType, Deserialize)]
struct EcdsaPublicKeyArgs {
    canister_id: Option<Principal>,
    derivation_path: Vec<Vec<u8>>,
    key_id: EcdsaKeyId,
}

#[derive(CandidType, Deserialize)]
struct EcdsaKeyId {
    curve: String,     // e.g., "secp256k1"
    name: String,      // key name configured on subnet
}

#[derive(CandidType, Deserialize)]
struct EcdsaPublicKeyReply { public_key: Vec<u8> }

#[ic_cdk::query]
async fn ecdsa_public_key(derivation_path: Vec<Vec<u8>>) -> Result<Vec<u8>, String> {
    let cfg = state().config.clone().ok_or("config not set")?;
    let args = EcdsaPublicKeyArgs {
        canister_id: Some(ic_cdk::id()),
        derivation_path,
        key_id: EcdsaKeyId { curve: "secp256k1".into(), name: cfg.ecdsa_key_name },
    };
    let (res,): (EcdsaPublicKeyReply,) = call(Principal::management_canister(), "ecdsa_public_key", (args,))
        .await
        .map_err(|e| format!("ecdsa_public_key failed: {:?}", e))?;
    Ok(res.public_key)
}

#[derive(CandidType, Deserialize)]
struct SignWithEcdsaArgs {
    message_hash: Vec<u8>,
    derivation_path: Vec<Vec<u8>>,
    key_id: EcdsaKeyId,
}

#[derive(CandidType, Deserialize)]
struct SignWithEcdsaReply { signature: Vec<u8> }

#[ic_cdk::query]
async fn sign_with_ecdsa(message_hash: Vec<u8>, derivation_path: Vec<Vec<u8>>) -> Result<Vec<u8>, String> {
    let cfg = state().config.clone().ok_or("config not set")?;
    let args = SignWithEcdsaArgs {
        message_hash,
        derivation_path,
        key_id: EcdsaKeyId { curve: "secp256k1".into(), name: cfg.ecdsa_key_name },
    };
    let (res,): (SignWithEcdsaReply,) = call(Principal::management_canister(), "sign_with_ecdsa", (args,))
        .await
        .map_err(|e| format!("sign_with_ecdsa failed: {:?}", e))?;
    Ok(res.signature)
}

// ----------------- Management canister: vetKD -----------------

#[derive(CandidType, Deserialize)]
struct VetKdPublicKeyArgs { canister_id: Option<Principal>, derivation_id: Vec<u8> }
#[derive(CandidType, Deserialize)]
struct VetKdPublicKeyReply { public_key: Vec<u8> }

#[ic_cdk::query]
async fn vetkd_public_key(derivation_id: Vec<u8>) -> Result<Vec<u8>, String> {
    let args = VetKdPublicKeyArgs { canister_id: Some(ic_cdk::id()), derivation_id };
    let (res,): (VetKdPublicKeyReply,) = call(Principal::management_canister(), "vetkd_public_key", (args,))
        .await
        .map_err(|e| format!("vetkd_public_key failed: {:?}", e))?;
    Ok(res.public_key)
}

#[derive(CandidType, Deserialize)]
struct VetKdEncryptedKeyArgs {
    derivation_id: Vec<u8>,
    public_key: Vec<u8>,
    encryption_public_key: Vec<u8>,
}
#[derive(CandidType, Deserialize)]
struct VetKdEncryptedKeyReply { encrypted_key: Vec<u8> }

#[ic_cdk::query]
async fn vetkd_encrypted_key(
    derivation_id: Vec<u8>,
    public_key: Vec<u8>,
    encryption_public_key: Vec<u8>,
) -> Result<Vec<u8>, String> {
    let args = VetKdEncryptedKeyArgs { derivation_id, public_key, encryption_public_key };
    let (res,): (VetKdEncryptedKeyReply,) = call(Principal::management_canister(), "vetkd_encrypted_key", (args,))
        .await
        .map_err(|e| format!("vetkd_encrypted_key failed: {:?}", e))?;
    Ok(res.encrypted_key)
}

// Keep greet for smoke checks (useful in dev)
#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

ic_cdk::export::candid::export_service!();

#[ic_cdk::query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    __export_service()
}
