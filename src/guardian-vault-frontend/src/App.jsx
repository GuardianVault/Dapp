import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { useBackend } from './hooks/useBackend';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { WalletPanel } from './components/WalletPanel';
import { RecoveryPanel } from './components/RecoveryPanel';
import { AnimatedHero } from './components/AnimatedHero';
import { UserIcon, StatusIndicator } from './components/Icons';

export default function App() {
  const { ready, identity, principal, login, logout } = useAuth();
  const actor = useBackend(identity);
  const authed = !!identity;

  return (
    <div className="min-h-screen bg-animated relative overflow-hidden">
      <main className="app relative z-10">
        {/* Hero Section */}
        {!authed && (
          <motion.header
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <AnimatedHero />
          </motion.header>
        )}

        {!authed ? (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            className="max-w-md mx-auto"
          >
            <Card variant="glow" className="text-center">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">
                    Welcome to Guardian Vault
                  </h2>
                  <p className="text-neutral-300">
                    Secure your ckBTC with guardian-based recovery and decentralized custody.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Button 
                    onClick={login} 
                    disabled={!ready}
                    loading={!ready}
                    size="lg"
                    className="w-full"
                  >
                    {!ready ? 'Connecting to Internet Identity...' : 'Sign in with Internet Identity'}
                  </Button>
                  
                  <div className="flex justify-center">
                    <StatusIndicator 
                      status={ready ? "online" : "warning"} 
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Feature highlights */}
                <div className="pt-4 border-t border-neutral-600">
                  <div className="grid grid-cols-2 gap-4 text-xs text-neutral-400">
                    <div className="flex flex-col items-center space-y-1">
                      <div className="text-brand-primary text-lg">🔐</div>
                      <span>No Seed Phrase</span>
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      <div className="text-brand-primary text-lg">👥</div>
                      <span>Social Recovery</span>
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      <div className="text-brand-primary text-lg">₿</div>
                      <span>Chain-Key BTC</span>
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      <div className="text-brand-primary text-lg">∞</div>
                      <span>On-Chain</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* User Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="glass-light p-3 rounded-xl">
                      <UserIcon className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-neutral-400">Signed in as</div>
                      <div className="font-mono text-sm text-white break-all max-w-xs truncate">
                        {principal?.toText?.() ?? String(principal)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <StatusIndicator status="online" />
                    <Button 
                      onClick={logout}
                      variant="danger"
                      size="sm"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Wallet Panel */}
            <WalletPanel 
              actor={actor} 
              principal={principal}
            />

            {/* Recovery Panel */}
            <RecoveryPanel actor={actor} />
          </div>
        )}
      </main>
    </div>
  );
}
