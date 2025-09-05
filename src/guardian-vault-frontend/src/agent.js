import { HttpAgent } from '@dfinity/agent';
import { createActor, canisterId } from 'declarations/guardian-vault-backend';
import { getIdentity } from './identity';

export async function backendActor() {
  const identity = getIdentity();
  const agent = new HttpAgent({ identity });
  if (process.env.DFX_NETWORK !== 'ic') {
    // Fetch root key for local dev only
    await agent.fetchRootKey();
  }
  return createActor(canisterId, { agent });
}

