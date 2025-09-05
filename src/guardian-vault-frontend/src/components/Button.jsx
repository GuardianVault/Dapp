import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const variants = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost',
  success: 'btn btn-success',
  warning: 'btn btn-warning',
  danger: 'btn btn-danger',
};

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export const Button = forwardRef(function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  ...props
}, ref) {
  const baseClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.md;
  
  return (
    <motion.button
      ref={ref}
      whileHover={disabled || loading ? {} : { 
        scale: 1.02,
        boxShadow: variant === 'primary' ? '0 0 20px rgba(41, 171, 226, 0.3)' : undefined
      }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        ${baseClasses} 
        ${sizeClasses}
        disabled:opacity-50 disabled:cursor-not-allowed 
        disabled:transform-none
        inline-flex items-center justify-center gap-2
        relative overflow-hidden
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...props}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}
      {leftIcon && !loading && (
        <span className="w-4 h-4">{leftIcon}</span>
      )}
      <span className={loading ? 'opacity-70' : ''}>{children}</span>
      {rightIcon && !loading && (
        <span className="w-4 h-4">{rightIcon}</span>
      )}
    </motion.button>
  );
});

