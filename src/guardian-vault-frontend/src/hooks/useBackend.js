import { useMemo } from 'react';
import { HttpAgent } from '@dfinity/agent';
import { createActor, canisterId } from 'declarations/guardian-vault-backend';

export function useBackend(identity) {
  return useMemo(() => {
    if (!identity) return null;
    const agent = new HttpAgent({ identity });
    if (process.env.DFX_NETWORK !== 'ic') agent.fetchRootKey();
    return createActor(canisterId, { agent });
  }, [identity]);
}

