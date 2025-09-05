import { motion } from 'framer-motion';
import { VaultIcon, FloatingBitcoins, StatusIndicator } from './Icons';

export function AnimatedHero() {
  return (
    <div className="relative">
      <FloatingBitcoins count={8} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
        className="text-center space-y-6 relative z-10"
      >
        {/* Logo Animation */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="glass-light p-6 rounded-2xl"
            >
              <VaultIcon className="w-16 h-16 text-brand-primary" animated={true} />
            </motion.div>
            
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-brand-primary opacity-20"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold text-gradient mb-4"
        >
          Guardian Vault
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-lg md:text-xl text-neutral-300 mb-8 max-w-2xl mx-auto"
        >
          Decentralized ckBTC wallet with guardian recovery on the Internet Computer
        </motion.p>

        {/* Features badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          {[
            { label: 'Seedless', icon: '🔐' },
            { label: 'Social Recovery', icon: '👥' },
            { label: 'Chain-Key BTC', icon: '₿' },
            { label: 'Internet Computer', icon: '∞' },
          ].map((feature, index) => (
            <motion.div
              key={feature.label}
              className="glass-light px-4 py-2 rounded-full text-sm font-medium text-neutral-200"
              whileHover={{ scale: 1.05, y: -2 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
            >
              <span className="mr-2">{feature.icon}</span>
              {feature.label}
            </motion.div>
          ))}
        </motion.div>

        {/* Status indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="flex justify-center"
        >
          <StatusIndicator status="online" className="text-sm" />
        </motion.div>
      </motion.div>
    </div>
  );
}