import { motion } from 'framer-motion';

export const BitcoinIcon = ({ className = "w-6 h-6", animated = true }) => {
  const iconElement = (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 6.41c.78.78.78 2.05 0 2.83L12 12.66l1.41 1.41c.39.39.39 1.02 0 1.41-.39.39-1.02.39-1.41 0L10.59 14.07c-.78-.78-.78-2.05 0-2.83L12 9.83l-1.41-1.41c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L13.41 8.42z"/>
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 7v2m0 6v2m5-7h-2m-6 0H7" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );

  if (!animated) return iconElement;

  return (
    <motion.div
      animate={{ 
        rotateY: [0, 360],
        y: [-2, 2, -2]
      }}
      transition={{ 
        rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
        y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      {iconElement}
    </motion.div>
  );
};

export const VaultIcon = ({ className = "w-6 h-6", animated = true, locked = true }) => {
  const iconElement = (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
      <circle cx="12" cy="16" r="1"/>
      {locked ? (
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      ) : (
        <path d="M7 11V7a5 5 0 0 1 5-5"/>
      )}
    </svg>
  );

  if (!animated) return iconElement;

  return (
    <motion.div
      animate={locked ? { 
        scale: [1, 1.05, 1],
        boxShadow: [
          "0 0 0px rgba(41, 171, 226, 0)",
          "0 0 10px rgba(41, 171, 226, 0.5)",
          "0 0 0px rgba(41, 171, 226, 0)"
        ]
      } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {iconElement}
    </motion.div>
  );
};

export const GuardianIcon = ({ className = "w-6 h-6", animated = true, active = false }) => {
  const iconElement = (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 1l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  if (!animated) return iconElement;

  return (
    <motion.div
      animate={active ? {
        rotate: [0, 10, -10, 0],
        scale: [1, 1.1, 1],
        filter: [
          "drop-shadow(0 0 0px rgba(16, 185, 129, 0))",
          "drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))",
          "drop-shadow(0 0 0px rgba(16, 185, 129, 0))"
        ]
      } : {}}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {iconElement}
    </motion.div>
  );
};

export const SendIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22,2 15,22 11,13 2,9 22,2"/>
  </svg>
);

export const ReceiveIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
  </svg>
);

export const RefreshIcon = ({ className = "w-6 h-6", spinning = false }) => {
  const iconElement = (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23,4 23,10 17,10"/>
      <polyline points="1,20 1,14 7,14"/>
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
    </svg>
  );

  if (!spinning) return iconElement;

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      {iconElement}
    </motion.div>
  );
};

export const CheckIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

export const XIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export const PlusIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export const UserIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export const ShieldIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export const FloatingBitcoins = ({ count = 5 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-brand-primary opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            rotate: [0, 360],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        >
          <BitcoinIcon className="w-8 h-8" animated={false} />
        </motion.div>
      ))}
    </div>
  );
};

export const StatusIndicator = ({ status, className = "" }) => {
  const statusConfig = {
    online: { color: 'bg-accent-green', shadow: 'shadow-glow', label: 'Online' },
    offline: { color: 'bg-neutral-500', shadow: '', label: 'Offline' },
    warning: { color: 'bg-accent-gold', shadow: 'shadow-glow', label: 'Warning' },
    error: { color: 'bg-accent-red', shadow: 'shadow-glow', label: 'Error' },
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className={`w-2 h-2 rounded-full ${config.color} ${config.shadow}`}
        animate={status !== 'offline' ? { opacity: [1, 0.5, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="text-sm text-neutral-400">{config.label}</span>
    </div>
  );
};

export const LoadingSpinner = ({ className = "w-6 h-6", color = "text-brand-primary" }) => (
  <motion.div
    className={`${className} ${color}`}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  >
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="32"
        opacity="0.3"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="24"
      />
    </svg>
  </motion.div>
);