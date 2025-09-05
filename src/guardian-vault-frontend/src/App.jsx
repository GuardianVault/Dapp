import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { initAuth, login } from './identity';
import { backendActor } from './agent';

function formatIcpNat(n) {
  try {
    // candid Nat in JS binding is a BigInt-like or string; normalize to string
    return n?.toString?.() ?? String(n);
  } catch {
    return String(n);
  }
}

export default function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [principal, setPrincipal] = useState('');
  const [balance, setBalance] = useState('0');
  const [status, setStatus] = useState('');

  useEffect(() => {
    (async () => {
      const { isAuthenticated, identity } = await initAuth();
      if (isAuthenticated && identity) {
        setIsAuthed(true);
        setPrincipal(identity.getPrincipal().toText());
        refreshBalance();
      }
    })();
  }, []);

  async function doLogin() {
    await login();
    const { isAuthenticated, identity } = await initAuth();
    if (isAuthenticated && identity) {
      setIsAuthed(true);
      setPrincipal(identity.getPrincipal().toText());
      await refreshBalance();
    }
  }

  async function refreshBalance() {
    try {
      setStatus('Fetching ckBTC balance…');
      const actor = await backendActor();
      const res = await actor.ckbtc_balance_of([]);
      if ('ok' in res) setBalance(formatIcpNat(res.ok));
      else setStatus(`Balance error: ${res.err}`);
    } catch (e) {
      setStatus(`Error: ${String(e)}`);
    } finally {
      setTimeout(() => setStatus(''), 1500);
    }
  }

  return (
    <main className="app">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="hero"
      >
        <img src="/logo2.svg" alt="Guardian Vault" height="40" />
        <h1>Guardian Vault</h1>
        <p className="tag">Decentralized ckBTC wallet with guardian recovery</p>
      </motion.header>

      <section className="panel">
        {!isAuthed ? (
          <button className="btn" onClick={doLogin}>Sign in with Internet Identity</button>
        ) : (
          <div className="grid">
            <div>
              <div className="label">Principal</div>
              <div className="mono small">{principal}</div>
            </div>
            <div>
              <div className="label">ckBTC Balance</div>
              <div className="big">{balance}</div>
              <button className="btn" onClick={refreshBalance}>Refresh</button>
            </div>
          </div>
        )}
        {status && <div className="status">{status}</div>}
      </section>
    </main>
  );
}
