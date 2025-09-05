import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { Card } from './Card';
import { SendModal } from './SendModal';
import { DepositModal } from './DepositModal';
import { 
  BitcoinIcon, 
  SendIcon, 
  ReceiveIcon, 
  RefreshIcon, 
  LoadingSpinner,
  StatusIndicator 
} from './Icons';

export function WalletPanel({ actor, principal }) {
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (actor) {
      refreshBalance();
    }
  }, [actor, lastRefresh]);

  const refreshBalance = async () => {
    if (!actor) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await actor.ckbtc_balance_of([]);
      setBalance(result.toString());
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance) => {
    const btc = parseFloat(balance) / 100000000;
    return btc.toFixed(8);
  };

  const formatBalanceUSD = (balance) => {
    const btc = parseFloat(balance) / 100000000;
    // Mock USD value - in production, fetch from price API
    const mockBtcPrice = 45000;
    return (btc * mockBtcPrice).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  const handleSendComplete = (result) => {
    console.log('Send completed:', result);
    setTimeout(() => {
      setLastRefresh(Date.now());
    }, 1000);
  };

  if (!actor || !principal) {
    return null;
  }

  const hasBalance = BigInt(balance || 0) > 0n;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      {/* Main Wallet Card */}
      <Card variant="glow" className="relative overflow-hidden">
        {/* Floating Bitcoin Animation */}
        <div className="absolute top-4 right-4">
          <BitcoinIcon className="w-8 h-8 text-brand-primary opacity-20" animated={true} />
        </div>

        <div className="space-y-6">
          {/* Balance Display */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <BitcoinIcon className="w-6 h-6 text-accent-gold" animated={false} />
              <span className="text-neutral-400 font-medium">ckBTC Balance</span>
            </div>
            
            <div className="space-y-2">
              <motion.div 
                className="text-4xl md:text-5xl font-bold font-mono text-white"
                key={balance}
                initial={{ scale: 1.1, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner className="w-12 h-12" />
                  </div>
                ) : (
                  formatBalance(balance)
                )}
              </motion.div>
              
              <div className="space-y-1">
                <div className="text-sm text-neutral-400">
                  {loading ? '' : `${balance} satoshis`}
                </div>
                <div className="text-lg font-semibold text-neutral-200">
                  {loading ? '' : formatBalanceUSD(balance)}
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-light p-3 rounded-lg border border-accent-red/20"
                >
                  <div className="text-accent-red text-sm">{error}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4">
            <Button
              onClick={() => setShowDepositModal(true)}
              variant="success"
              leftIcon={<ReceiveIcon />}
              className="flex-col h-16"
            >
              <span className="text-xs">Deposit</span>
            </Button>
            
            <Button
              onClick={() => setShowSendModal(true)}
              variant="primary"
              leftIcon={<SendIcon />}
              disabled={!hasBalance}
              className="flex-col h-16"
            >
              <span className="text-xs">Send</span>
            </Button>
            
            <Button
              onClick={() => setLastRefresh(Date.now())}
              variant="secondary"
              leftIcon={<RefreshIcon spinning={loading} />}
              disabled={loading}
              className="flex-col h-16"
            >
              <span className="text-xs">Refresh</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Info Card */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Account Details</h3>
          
          <div className="space-y-3">
            <div>
              <div className="text-xs text-neutral-400 mb-2">Principal ID</div>
              <div className="glass-light p-3 rounded-lg font-mono text-xs text-neutral-200 break-all">
                {principal.toText()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-light p-4 rounded-lg text-center">
                <div className="text-xs text-neutral-400 mb-1">Network</div>
                <div className="text-sm font-semibold text-white">Internet Computer</div>
                <StatusIndicator status="online" className="mt-2 justify-center" />
              </div>
              
              <div className="glass-light p-4 rounded-lg text-center">
                <div className="text-xs text-neutral-400 mb-1">Asset</div>
                <div className="text-sm font-semibold text-white">Chain-key BTC</div>
                <div className="flex items-center justify-center mt-2">
                  <BitcoinIcon className="w-4 h-4 text-accent-gold" animated={false} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Transaction History Placeholder */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          
          <div className="text-center py-8 text-neutral-400">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="space-y-2"
            >
              <div className="text-2xl">⏳</div>
              <div className="text-sm">Transaction history coming soon</div>
            </motion.div>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <SendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        actor={actor}
        onSendComplete={handleSendComplete}
        currentBalance={balance}
      />
      
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        actor={actor}
      />
    </motion.div>
  );
}