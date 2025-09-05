use candid::{CandidType, Deserialize, Principal};
use serde::Serialize;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Config {
    pub ckbtc_ledger: Principal,
    pub ckbtc_minter: Principal,
    pub ecdsa_key_name: String,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct GuardianState {
    pub guardians: Vec<Principal>,
    pub quorum: u8,
    pub owner: Principal,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct RecoveryRequest {
    pub id: u64,
    pub new_owner: Principal,
    pub approvals: Vec<Principal>,
    pub open: bool,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Icrc1Account {
    pub owner: Principal,
    pub subaccount: Option<Vec<u8>>, // 32 bytes if present
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

// ckBTC Minter Types
#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct GetDepositAddressArgs {
    pub owner: Option<Principal>,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct RetrieveBtcArgs {
    pub address: String,
    pub amount: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct RetrieveBtcWithApprovalArgs {
    pub address: String,
    pub amount: u64,
    pub from_subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum RetrieveBtcError {
    MalformedAddress(String),
    GenericError { error_message: String, error_code: u64 },
    TemporarilyUnavailable(String),
    AlreadyProcessing,
    AmountTooLow(u64),
    InsufficientFunds { balance: u64 },
}

#[derive(CandidType, Deserialize, Debug)]
pub enum DepositAddressError {
    TemporarilyUnavailable(String),
    GenericError { error_message: String, error_code: u64 },
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct UtxoStatus {
    pub height: u32,
    pub value: u64,
    pub outpoint: OutPoint,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct OutPoint {
    pub txid: Vec<u8>,
    pub vout: u32,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct PendingUtxo {
    pub outpoint: OutPoint,
    pub value: u64,
    pub confirmations: u32,
}

