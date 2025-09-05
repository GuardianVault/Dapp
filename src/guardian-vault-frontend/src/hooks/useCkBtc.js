import { useCallback, useState } from 'react';

export function useCkBtc(actor) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const balanceOf = useCallback(async (sub = []) => {
    setLoading(true); setError('');
    try {
      const res = await actor.ckbtc_balance_of(sub);
      if ('ok' in res) return res.ok?.toString?.() ?? String(res.ok);
      throw new Error(res.err);
    } catch (e) {
      setError(String(e));
      throw e;
    } finally { setLoading(false); }
  }, [actor]);

  const transfer = useCallback(async ({ to, sub = [], amount, fee }) => {
    setLoading(true); setError('');
    try {
      const res = await actor.ckbtc_transfer(to, sub, amount, fee ?? []);
      if ('ok' in res) return res.ok?.toString?.() ?? String(res.ok);
      throw new Error(res.err);
    } catch (e) {
      setError(String(e));
      throw e;
    } finally { setLoading(false); }
  }, [actor]);

  return { loading, error, balanceOf, transfer };
}

