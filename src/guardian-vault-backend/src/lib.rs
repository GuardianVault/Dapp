pub mod types;
pub mod state;
pub mod config;
pub mod guardians;
pub mod recovery;
pub mod ckbtc;
pub mod ecdsa;
pub mod vetkd;

pub use config::*;
pub use guardians::*;
pub use recovery::*;
pub use ckbtc::*;
pub use ecdsa::*;
pub use vetkd::*;

use candid::Principal;
use crate::state::migrate_state;
use crate::types::{Config, GuardianState, RecoveryRequest, UtxoStatus, PendingUtxo};


#[ic_cdk::init]
fn init() {
    ic_cdk::println!("Guardian Vault canister initialized");
}

#[ic_cdk::pre_upgrade]
fn pre_upgrade() {
    ic_cdk::println!("Preparing for canister upgrade");
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    ic_cdk::println!("Canister upgraded successfully");
    if let Err(e) = migrate_state() {
        ic_cdk::trap(&format!("State migration failed: {}", e));
    }
    ic_cdk::println!("State migration completed");
}

#[ic_cdk::query]
fn greet(name: String) -> String { format!("Hello, {}!", name) }

#[ic_cdk::query]
fn get_canister_status() -> String {
    format!("Guardian Vault Backend v{}", env!("CARGO_PKG_VERSION"))
}

candid::export_service!();

#[ic_cdk::query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String { 
    __export_service() 
}
