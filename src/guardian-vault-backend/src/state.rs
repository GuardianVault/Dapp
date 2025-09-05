use candid::{CandidType, Deserialize, Principal};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    storable::{Bound, Storable},
    DefaultMemoryImpl, StableCell,
};
use serde::Serialize;
use std::{borrow::Cow, cell::RefCell, collections::{BTreeMap, HashMap}};
use crate::types::{Config, GuardianState, RecoveryRequest};
use crate::vetkd::RecoverySecret;

type Memory = VirtualMemory<DefaultMemoryImpl>;

const STATE_VERSION: u32 = 1;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct VaultStateV1 {
    pub version: u32,
    pub config: Option<Config>,
    pub guardian_state: Option<GuardianState>,
    pub next_recovery_id: u64,
    pub recovery_reqs: Vec<RecoveryRequest>,
    pub subaccounts: BTreeMap<Principal, Vec<u8>>, // user -> subaccount
    pub recovery_secrets: HashMap<Vec<u8>, RecoverySecret>, // secret_id -> recovery_secret
    pub submitted_recovery_shares: HashMap<u64, HashMap<Principal, Vec<u8>>>, // recovery_id -> guardian -> share
    pub btc_addresses: HashMap<Principal, String>, // user -> btc_address
    pub transaction_history: Vec<TransactionRecord>,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct TransactionRecord {
    pub id: u64,
    pub from: Principal,
    pub to: Principal,
    pub amount: u64,
    pub fee: u64,
    pub memo: Option<Vec<u8>>,
    pub timestamp: u64,
    pub status: TransactionStatus,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub enum TransactionStatus {
    Pending,
    Confirmed,
    Failed,
}

impl Default for VaultStateV1 {
    fn default() -> Self {
        Self {
            version: STATE_VERSION,
            config: None,
            guardian_state: None,
            next_recovery_id: 1,
            recovery_reqs: Vec::new(),
            subaccounts: BTreeMap::new(),
            recovery_secrets: HashMap::new(),
            submitted_recovery_shares: HashMap::new(),
            btc_addresses: HashMap::new(),
            transaction_history: Vec::new(),
        }
    }
}

impl Storable for VaultStateV1 {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static STATE: RefCell<StableCell<VaultStateV1, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
            VaultStateV1::default()
        ).unwrap()
    );
}

pub fn with_state<R>(f: impl FnOnce(&VaultStateV1) -> R) -> R {
    STATE.with(|state| f(&state.borrow().get()))
}

pub fn with_state_mut<R>(f: impl FnOnce(&mut VaultStateV1) -> R) -> R {
    STATE.with(|state| {
        let mut cell = state.borrow_mut();
        let mut current_state = cell.get().clone();
        let result = f(&mut current_state);
        cell.set(current_state).unwrap();
        result
    })
}

// Legacy compatibility functions for existing code
pub fn state() -> VaultStateV1 {
    with_state(|s| s.clone())
}

pub fn state_mut() -> VaultStateV1 {
    with_state(|s| s.clone())
}

pub fn update_state<F>(f: F) 
where
    F: FnOnce(&mut VaultStateV1),
{
    with_state_mut(f);
}

// Migration logic for future state versions
pub fn migrate_state() -> Result<(), String> {
    with_state_mut(|state| {
        match state.version {
            1 => {
                // Current version, no migration needed
                Ok(())
            },
            v if v > STATE_VERSION => {
                Err(format!("Cannot downgrade from version {} to {}", v, STATE_VERSION))
            },
            v => {
                // Migration from older versions would go here
                // For now, just update version
                state.version = STATE_VERSION;
                ic_cdk::println!("Migrated state from version {} to {}", v, STATE_VERSION);
                Ok(())
            }
        }
    })
}

// Initialize state on first run
pub fn init_state(config: Config) -> Result<(), String> {
    with_state_mut(|state| {
        if state.config.is_some() {
            return Err("State already initialized".to_string());
        }
        state.config = Some(config);
        Ok(())
    })
}

