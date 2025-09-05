import { useCallback, useState } from 'react';
import { Principal } from '@dfinity/principal';

export function useGuardians(actor) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchState = useCallback(async () => {
    const st = await actor.get_guardians();
    return st;
  }, [actor]);

  const setGuardians = useCallback(async ({ guardians, quorum }) => {
    setLoading(true); setError('');
    try {
      const list = guardians.map(g => (typeof g === 'string' ? Principal.fromText(g) : g));
      const res = await actor.set_guardians(list, quorum);
      if ('ok' in res) return true; throw new Error(res.err);
    } catch (e) { setError(String(e)); throw e; } finally { setLoading(false); }
  }, [actor]);

  const requestRecovery = useCallback(async (newOwner) => {
    setLoading(true); setError('');
    try {
      const ownerP = typeof newOwner === 'string' ? Principal.fromText(newOwner) : newOwner;
      const res = await actor.request_recovery(ownerP);
      if ('ok' in res) return res.ok; throw new Error(res.err);
    } catch (e) { setError(String(e)); throw e; } finally { setLoading(false); }
  }, [actor]);

  const approveRecovery = useCallback(async (id) => {
    setLoading(true); setError('');
    try {
      const res = await actor.approve_recovery(id);
      if ('ok' in res) return res.ok; throw new Error(res.err);
    } catch (e) { setError(String(e)); throw e; } finally { setLoading(false); }
  }, [actor]);

  const recoveryStatus = useCallback(async (id) => actor.recovery_status(id), [actor]);

  return { loading, error, fetchState, setGuardians, requestRecovery, approveRecovery, recoveryStatus };
}
