import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthClient } from '@dfinity/auth-client';
import { createActor } from '../declarations/guardian-vault-backend';

// Extension-specific styles
const styles = {
  container: {
    width: '360px',
    minHeight: '500px',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    color: '#F1F5F9',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    margin: 0,
    padding: 0,
  },
  header: {
    background: 'rgba(41, 171, 226, 0.1)',
    padding: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#29ABE2',
    margin: 0,
  },
  subtitle: {
    fontSize: '12px',
    color: '#94A3B8',
    margin: 0,
  },
  content: {
    padding: '16px',
  },
  card: {
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  },
  button: {
    background: 'linear-gradient(135deg, #29ABE2, #1E40AF)',
    color: 'white',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    width: '100%',
    transition: 'all 0.2s ease',
  },
  buttonSecondary: {
    background: 'rgba(71, 85, 105, 0.8)',
    color: '#F1F5F9',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  balance: {
    textAlign: 'center',
    padding: '16px 0',
  },
  balanceAmount: {
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: 'ui-monospace, monospace',
    color: '#29ABE2',
    marginBottom: '4px',
  },
  balanceUsd: {
    fontSize: '14px',
    color: '#94A3B8',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '16px',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    marginBottom: '12px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#10B981',
    marginRight: '6px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100px',
    fontSize: '14px',
    color: '#94A3B8',
  },
};

const LoadingSpinner = () => (
  <div style={{
    width: '16px',
    height: '16px',
    border: '2px solid rgba(41, 171, 226, 0.3)',
    borderTop: '2px solid #29ABE2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '8px',
  }} />
);

function GuardianVaultPopup() {
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [actor, setActor] = useState(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);
      
      const isAuthenticated = await client.isAuthenticated();
      
      if (isAuthenticated) {
        const identity = client.getIdentity();
        setIdentity(identity);
        setIsAuthenticated(true);
        
        // Create actor with the identity
        const backendActor = createActor(process.env.CANISTER_ID_GUARDIAN_VAULT_BACKEND || 'rdmx6-jaaaa-aaaaa-aaadq-cai', {
          agentOptions: { identity },
        });
        
        setActor(backendActor);
        await fetchBalance(backendActor);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Auth initialization failed:', err);
      setError('Failed to initialize authentication');
      setLoading(false);
    }
  };

  const login = async () => {
    if (!authClient) return;
    
    try {
      setLoading(true);
      
      await authClient.login({
        identityProvider: process.env.DFX_NETWORK === 'local' 
          ? `http://127.0.0.1:4943/?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}`
          : 'https://identity.ic0.app',
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          setIdentity(identity);
          setIsAuthenticated(true);
          
          const backendActor = createActor(process.env.CANISTER_ID_GUARDIAN_VAULT_BACKEND || 'rdmx6-jaaaa-aaaaa-aaadq-cai', {
            agentOptions: { identity },
          });
          
          setActor(backendActor);
          await fetchBalance(backendActor);
          setLoading(false);
        },
        onError: (err) => {
          console.error('Login failed:', err);
          setError('Login failed');
          setLoading(false);
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      setError('Login error');
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!authClient) return;
    
    await authClient.logout();
    setIdentity(null);
    setIsAuthenticated(false);
    setActor(null);
    setBalance('0');
  };

  const fetchBalance = async (actorInstance) => {
    try {
      const result = await actorInstance.ckbtc_balance_of([]);
      setBalance(result.toString());
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
    }
  };

  const refreshBalance = async () => {
    if (!actor) return;
    
    setLoading(true);
    await fetchBalance(actor);
    setLoading(false);
  };

  const formatBalance = (balance) => {
    const btc = parseFloat(balance) / 100000000;
    return btc.toFixed(8);
  };

  const formatBalanceUSD = (balance) => {
    const btc = parseFloat(balance) / 100000000;
    const mockBtcPrice = 45000;
    return (btc * mockBtcPrice).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  const openWebApp = () => {
    const webAppUrl = process.env.DFX_NETWORK === 'local' 
      ? `http://127.0.0.1:4943/?canisterId=${process.env.CANISTER_ID_GUARDIAN_VAULT_FRONTEND}`
      : 'https://guardian-vault.icp0.io';
    
    chrome.tabs.create({ url: webAppUrl });
  };

  const sendToCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Simple send functionality - in production, integrate with page detection
      const amount = prompt('Enter amount to send (ckBTC):');
      const recipient = prompt('Enter recipient Principal ID:');
      
      if (amount && recipient && actor) {
        setLoading(true);
        try {
          const result = await actor.ckbtc_transfer(
            recipient,
            null,
            BigInt(Math.floor(parseFloat(amount) * 100000000)),
            null,
            null,
            null
          );
          alert('Transaction sent successfully!');
          await refreshBalance();
        } catch (err) {
          alert('Transaction failed: ' + err.message);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Send error:', err);
      setError('Send failed');
    }
  };

  if (loading && !isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <h1 style={styles.title}>Guardian Vault</h1>
          </div>
          <p style={styles.subtitle}>Browser Extension</p>
        </div>
        <div style={styles.loading}>
          <LoadingSpinner />
          Initializing...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <h1 style={styles.title}>Guardian Vault</h1>
          </div>
          <p style={styles.subtitle}>Browser Extension</p>
        </div>
        <div style={styles.content}>
          <div style={styles.card}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>
              Welcome to Guardian Vault
            </h3>
            <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '16px' }}>
              Secure ckBTC wallet with guardian recovery on the Internet Computer.
            </p>
            <button 
              style={styles.button}
              onClick={login}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Sign in with Internet Identity
            </button>
          </div>
          
          <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
            <p>• No seed phrases</p>
            <p>• Social recovery</p>
            <p>• Chain-key Bitcoin</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <h1 style={styles.title}>Guardian Vault</h1>
        </div>
        <div style={styles.status}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={styles.statusDot} />
            Connected to IC
          </div>
          <button 
            style={{...styles.buttonSecondary, padding: '4px 8px'}}
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Balance Display */}
        <div style={styles.card}>
          <div style={styles.balance}>
            <div style={styles.balanceAmount}>
              {loading ? '...' : formatBalance(balance)} ckBTC
            </div>
            <div style={styles.balanceUsd}>
              {loading ? '' : formatBalanceUSD(balance)}
            </div>
          </div>
          
          <button 
            style={{...styles.buttonSecondary, width: '100%'}}
            onClick={refreshBalance}
            disabled={loading}
          >
            {loading ? <><LoadingSpinner /> Refreshing...</> : '🔄 Refresh Balance'}
          </button>
        </div>

        {/* Quick Actions */}
        <div style={styles.card}>
          <h4 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px' }}>
            Quick Actions
          </h4>
          
          <div style={styles.actionGrid}>
            <button 
              style={{...styles.buttonSecondary, fontSize: '12px'}}
              onClick={sendToCurrentTab}
              disabled={BigInt(balance || 0) === 0n}
            >
              📤 Send
            </button>
            
            <button 
              style={{...styles.buttonSecondary, fontSize: '12px'}}
              onClick={openWebApp}
            >
              🌐 Open Web App
            </button>
          </div>
          
          <button 
            style={{...styles.button, marginTop: '8px', fontSize: '12px'}}
            onClick={openWebApp}
          >
            View Full Wallet
          </button>
        </div>

        {/* Recent Activity Placeholder */}
        <div style={styles.card}>
          <h4 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px' }}>
            Recent Activity
          </h4>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px 0', 
            color: '#64748B', 
            fontSize: '12px' 
          }}>
            ⏳ No recent transactions
          </div>
        </div>

        {error && (
          <div style={{
            ...styles.card,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            fontSize: '12px',
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Initialize React app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<GuardianVaultPopup />);