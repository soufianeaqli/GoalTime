import React from 'react';
import { motion } from 'framer-motion';

export default function Card({ children, className = '', hover = true, onClick, ...props }) {
  const Comp = hover ? motion.div : 'div';
  const animProps = hover ? { whileHover: { y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' } } : {};

  return (
    <Comp
      onClick={onClick}
      className={`glass-card-hover transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...animProps}
      {...props}
    >
      {children}
    </Comp>
  );
}

Card.Image = function CardImage({ src, alt, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-t-2xl ${className}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
};

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return <div className={`px-5 py-4 border-t border-black/5 dark:border-white/5 ${className}`}>{children}</div>;
};
