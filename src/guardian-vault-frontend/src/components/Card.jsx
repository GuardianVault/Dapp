import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const variants = {
  default: 'glass',
  glow: 'glass card-glow',
  light: 'glass-light',
  solid: 'bg-neutral-800 border border-neutral-700',
};

export const Card = forwardRef(function Card({
  children,
  className = '',
  variant = 'default',
  hover = true,
  animated = true,
  padding = 'p-6',
  ...props
}, ref) {
  const baseClasses = variants[variant] || variants.default;
  
  const cardProps = {
    ref,
    className: `
      ${baseClasses} 
      ${padding}
      rounded-xl 
      transition-all duration-300
      ${className}
    `,
    ...props
  };

  if (!animated) {
    return (
      <div {...cardProps}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      {...cardProps}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      whileHover={hover ? {
        y: -4,
        boxShadow: variant === 'glow' 
          ? '0 0 30px rgba(41, 171, 226, 0.4), 0 8px 32px 0 rgba(31, 38, 135, 0.37)'
          : '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
      } : {}}
    >
      {children}
    </motion.div>
  );
});

