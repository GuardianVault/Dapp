import { AuthClient } from '@dfinity/auth-client';

let authClient;
let identity;

export async function initAuth() {
  if (!authClient) {
    authClient = await AuthClient.create();
  }
  if (await authClient.isAuthenticated()) {
    identity = authClient.getIdentity();
    return { isAuthenticated: true, identity };
  }
  return { isAuthenticated: false };
}

export async function login() {
  if (!authClient) authClient = await AuthClient.create();
  return new Promise((resolve, reject) => {
    authClient.login({
      identityProvider: process.env.DFX_NETWORK === 'ic'
        ? 'https://identity.ic0.app'
        : 'http://127.0.0.1:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai',
      maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000),
      onSuccess: () => {
        identity = authClient.getIdentity();
        resolve(identity);
      },
      onError: reject,
    });
  });
}

export function getIdentity() {
  return identity;
}

