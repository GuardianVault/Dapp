import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

export function DepositModal({ isOpen, onClose, actor }) {
  const [depositAddress, setDepositAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [utxos, setUtxos] = useState([]);
  const [pendingUtxos, setPendingUtxos] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && actor) {
      fetchDepositInfo();
    }
  }, [isOpen, actor]);

  const fetchDepositInfo = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get deposit address
      const address = await actor.get_deposit_address([]);
      setDepositAddress(address);
      
      // Get UTXOs and pending UTXOs
      const [utxosResult, pendingResult] = await Promise.all([
        actor.get_utxos([]).catch(() => []),
        actor.get_pending_utxos([]).catch(() => [])
      ]);
      
      setUtxos(utxosResult);
      setPendingUtxos(pendingResult);
    } catch (err) {
      console.error('Error fetching deposit info:', err);
      setError(err.message || 'Failed to load deposit information');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatBtcAmount = (satoshis) => {
    return (satoshis / 100000000).toFixed(8);
  };

  const formatTxid = (txid) => {
    const hex = Array.from(txid).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}...${hex.slice(-8)}`;
  };

  const handleClose = () => {
    setError('');
    setCopied(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Deposit Bitcoin</h2>
              <button 
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading deposit information...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="text-red-800">{error}</div>
                <Button 
                  onClick={fetchDepositInfo} 
                  className="mt-3 !bg-red-600 hover:!bg-red-700"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Deposit Address */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Bitcoin Deposit Address</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Send Bitcoin to this address to mint ckBTC to your account. Minimum 6 confirmations required.
                  </p>
                  
                  {depositAddress && (
                    <div className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <code className="font-mono text-sm break-all flex-1 mr-2">
                          {depositAddress}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(depositAddress)}
                          className="!px-3 !py-1 !text-xs shrink-0"
                        >
                          {copied ? '✓ Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pending Deposits */}
                {pendingUtxos.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Pending Deposits</h3>
                    <div className="space-y-2">
                      {pendingUtxos.map((utxo, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-mono text-sm">
                                {formatTxid(utxo.outpoint.txid)}:{utxo.outpoint.vout}
                              </div>
                              <div className="text-sm text-gray-600">
                                {utxo.confirmations}/6 confirmations
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                {formatBtcAmount(utxo.value)} BTC
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmed UTXOs */}
                {utxos.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Confirmed Deposits</h3>
                    <div className="space-y-2">
                      {utxos.map((utxo, index) => (
                        <div key={index} className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-mono text-sm">
                                {formatTxid(utxo.outpoint.txid)}:{utxo.outpoint.vout}
                              </div>
                              <div className="text-sm text-gray-600">
                                Block height: {utxo.height}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-700">
                                {formatBtcAmount(utxo.value)} BTC
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">How to Deposit</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                    <li>Copy the Bitcoin address above</li>
                    <li>Send Bitcoin from your wallet to this address</li>
                    <li>Wait for 6 confirmations on the Bitcoin network</li>
                    <li>ckBTC will be automatically minted to your account</li>
                    <li>Refresh this page to see pending and confirmed deposits</li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={fetchDepositInfo}
                    className="flex-1 !bg-blue-600 hover:!bg-blue-700"
                  >
                    Refresh Status
                  </Button>
                  <Button
                    onClick={handleClose}
                    className="flex-1 !bg-gray-500 hover:!bg-gray-600"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}