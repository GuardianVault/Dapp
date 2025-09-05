import { useEffect, useState } from 'react';
import { AuthClient } from '@dfinity/auth-client';

export function useAuth() {
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const client = await AuthClient.create();
      setAuthClient(client);
      if (await client.isAuthenticated()) setIdentity(client.getIdentity());
      setReady(true);
    })();
  }, []);

  async function login() {
    if (!authClient) return;
    await new Promise((resolve, reject) =>
      authClient.login({
        identityProvider:
          process.env.DFX_NETWORK === 'ic'
            ? 'https://identity.ic0.app'
            : 'http://127.0.0.1:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai',
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000),
        onSuccess: resolve,
        onError: reject,
      }),
    );
    setIdentity(authClient.getIdentity());
  }

  async function logout() {
    if (!authClient) return;
    await authClient.logout();
    setIdentity(null);
  }

  return { ready, identity, principal: identity?.getPrincipal(), login, logout };
}

