use candid::{CandidType, Deserialize};
use ic_cdk::api::call::call;
use candid::Principal;
use crate::state::state;

#[derive(CandidType, Deserialize)]
struct EcdsaPublicKeyArgs { canister_id: Option<Principal>, derivation_path: Vec<Vec<u8>>, key_id: EcdsaKeyId }

#[derive(CandidType, Deserialize)]
struct EcdsaKeyId { curve: String, name: String }

#[derive(CandidType, Deserialize)]
struct EcdsaPublicKeyReply { public_key: Vec<u8> }

#[ic_cdk::query]
pub async fn ecdsa_public_key(derivation_path: Vec<Vec<u8>>) -> Result<Vec<u8>, String> {
    let cfg = state().config.clone().ok_or("config not set")?;
    let args = EcdsaPublicKeyArgs {
        canister_id: Some(ic_cdk::id()), derivation_path,
        key_id: EcdsaKeyId { curve: "secp256k1".into(), name: cfg.ecdsa_key_name },
    };
    let (res,): (EcdsaPublicKeyReply,) = call(Principal::management_canister(), "ecdsa_public_key", (args,))
        .await
        .map_err(|e| format!("ecdsa_public_key failed: {:?}", e))?;
    Ok(res.public_key)
}

#[derive(CandidType, Deserialize)]
struct SignWithEcdsaArgs { message_hash: Vec<u8>, derivation_path: Vec<Vec<u8>>, key_id: EcdsaKeyId }
#[derive(CandidType, Deserialize)]
struct SignWithEcdsaReply { signature: Vec<u8> }

#[ic_cdk::query]
pub async fn sign_with_ecdsa(message_hash: Vec<u8>, derivation_path: Vec<Vec<u8>>) -> Result<Vec<u8>, String> {
    let cfg = state().config.clone().ok_or("config not set")?;
    let args = SignWithEcdsaArgs { message_hash, derivation_path, key_id: EcdsaKeyId { curve: "secp256k1".into(), name: cfg.ecdsa_key_name } };
    let (res,): (SignWithEcdsaReply,) = call(Principal::management_canister(), "sign_with_ecdsa", (args,))
        .await
        .map_err(|e| format!("sign_with_ecdsa failed: {:?}", e))?;
    Ok(res.signature)
}

