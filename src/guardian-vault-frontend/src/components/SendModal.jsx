import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Principal } from '@dfinity/principal';
import { Button } from './Button';
import { Card } from './Card';
import { SendIcon, XIcon, BitcoinIcon, LoadingSpinner } from './Icons';

export function SendModal({ isOpen, onClose, actor, onSendComplete, currentBalance }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fee, setFee] = useState(null);
  const [balance, setBalance] = useState('0');

  // Fetch transaction fee on mount
  useEffect(() => {
    if (actor && isOpen) {
      fetchFee();
      fetchBalance();
    }
  }, [actor, isOpen]);

  const fetchFee = async () => {
    try {
      const feeResult = await actor.get_transaction_fee();
      setFee(feeResult);
    } catch (err) {
      console.error('Error fetching fee:', err);
    }
  };

  const fetchBalance = async () => {
    try {
      const balanceResult = await actor.ckbtc_balance_of([]);
      setBalance(balanceResult.toString());
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const validateRecipient = (recipient) => {
    try {
      Principal.fromText(recipient);
      return true;
    } catch {
      return false;
    }
  };

  const validateAmount = (amount, balance, fee) => {
    const amountBigInt = BigInt(amount);
    const balanceBigInt = BigInt(balance);
    const feeBigInt = BigInt(fee || 0);
    
    if (amountBigInt <= 0) return { valid: false, error: 'Amount must be greater than 0' };
    if (amountBigInt + feeBigInt > balanceBigInt) return { valid: false, error: 'Insufficient balance including fees' };
    
    return { valid: true };
  };

  const handleSend = async () => {
    setError('');
    
    // Validate inputs
    if (!recipient.trim()) {
      setError('Recipient is required');
      return;
    }
    
    if (!validateRecipient(recipient)) {
      setError('Invalid recipient Principal ID');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid amount');
      return;
    }

    const amountSat = Math.floor(parseFloat(amount) * 100000000); // Convert to satoshis
    const validation = validateAmount(amountSat.toString(), balance, fee);
    
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setLoading(true);
    
    try {
      const recipientPrincipal = Principal.fromText(recipient);
      const memoBytes = memo ? new TextEncoder().encode(memo) : null;
      
      const result = await actor.ckbtc_transfer(
        recipientPrincipal,
        null, // to_subaccount
        BigInt(amountSat),
        fee ? BigInt(fee) : null,
        null, // from_subaccount
        memoBytes ? Array.from(memoBytes) : null
      );
      
      console.log('Transfer result:', result);
      onSendComplete?.(result);
      handleClose();
    } catch (err) {
      console.error('Transfer failed:', err);
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRecipient('');
    setAmount('');
    setMemo('');
    setError('');
    setLoading(false);
    onClose();
  };

  const formatSatoshis = (sats) => {
    return (parseFloat(sats) / 100000000).toFixed(8);
  };

  const formatUSD = (btc) => {
    const mockPrice = 45000;
    return (parseFloat(btc) * mockPrice).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  const maxSendable = balance && fee ? 
    Math.max(0, (BigInt(balance) - BigInt(fee || 0))) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="glass-light p-2 rounded-lg">
                    <SendIcon className="w-5 h-5 text-brand-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Send ckBTC</h2>
                </div>
                <button 
                  onClick={handleClose}
                  className="glass-light p-2 rounded-lg hover:bg-neutral-600/50 transition-colors"
                >
                  <XIcon className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Balance Display */}
                <div className="glass-light p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Available Balance</span>
                    <BitcoinIcon className="w-5 h-5 text-accent-gold" animated={false} />
                  </div>
                  <div className="space-y-1">
                    <div className="font-mono text-2xl text-white">{formatSatoshis(balance)} ckBTC</div>
                    <div className="text-sm text-neutral-300">{formatUSD(formatSatoshis(balance))}</div>
                    {fee && (
                      <div className="text-xs text-neutral-400">
                        Network fee: {formatSatoshis(fee)} ckBTC
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Recipient */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Recipient Principal ID
                    </label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="rrkah-fqaaa-aaaaa-aaaaq-cai"
                      className="input font-mono text-sm"
                      disabled={loading}
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-neutral-300">
                        Amount (ckBTC)
                      </label>
                      {maxSendable > 0 && (
                        <button
                          type="button"
                          onClick={() => setAmount(formatSatoshis(maxSendable))}
                          className="text-xs text-brand-primary hover:text-brand-secondary transition-colors"
                          disabled={loading}
                        >
                          Use Max: {formatSatoshis(maxSendable)}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.00000001"
                        min="0"
                        max={formatSatoshis(maxSendable)}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00000000"
                        className="input font-mono text-lg pr-16"
                        disabled={loading}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        ckBTC
                      </div>
                    </div>
                    {amount && (
                      <div className="text-sm text-neutral-400 mt-1">
                        ≈ {formatUSD(amount)}
                      </div>
                    )}
                  </div>

                  {/* Memo */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Memo (optional)
                    </label>
                    <input
                      type="text"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="Optional transaction note"
                      className="input"
                      disabled={loading}
                      maxLength={64}
                    />
                    <div className="text-xs text-neutral-500 mt-1">
                      {memo.length}/64 characters
                    </div>
                  </div>
                </div>

                {/* Transaction Summary */}
                {amount && recipient && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="glass-light p-4 rounded-xl space-y-2"
                  >
                    <div className="text-sm font-medium text-neutral-300 mb-2">Transaction Summary</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Amount:</span>
                        <span className="text-white font-mono">{amount} ckBTC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Network Fee:</span>
                        <span className="text-white font-mono">{formatSatoshis(fee || 0)} ckBTC</span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-600 pt-1">
                        <span className="text-neutral-300 font-medium">Total:</span>
                        <span className="text-white font-mono font-semibold">
                          {(parseFloat(amount) + parseFloat(formatSatoshis(fee || 0))).toFixed(8)} ckBTC
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Error Display */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass-light p-4 rounded-xl border border-accent-red/20"
                    >
                      <div className="text-accent-red text-sm">{error}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Button
                    onClick={handleClose}
                    variant="ghost"
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSend}
                    variant="primary"
                    className="flex-1"
                    disabled={loading || !recipient || !amount}
                    loading={loading}
                    leftIcon={loading ? <LoadingSpinner className="w-4 h-4" /> : <SendIcon />}
                  >
                    {loading ? 'Sending...' : 'Send Transaction'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}