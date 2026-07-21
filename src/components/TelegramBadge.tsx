import React from 'react';
import { motion } from 'motion/react';

export const TelegramBadge: React.FC = () => {
  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40">
      <motion.a
        href="https://t.me/velouraglobel"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 bg-[#0088cc] hover:bg-[#0099e6] text-white rounded-full shadow-lg shadow-[#0088cc]/30 border border-[#0088cc]/20 cursor-pointer group select-none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          y: [0, -6, 0]
        }}
        transition={{
          scale: { delay: 1, duration: 0.3, type: 'spring' },
          opacity: { delay: 1, duration: 0.3 },
          y: {
            repeat: Infinity,
            repeatType: 'reverse',
            duration: 1.8,
            ease: 'easeInOut'
          }
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Animated Ripple Effect */}
        <span className="absolute inset-0 rounded-full bg-[#0088cc]/30 -z-10 animate-ping opacity-75" />

        {/* Telegram High-fidelity SVG Icon */}
        <div className="relative w-6 h-6 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-5.5 h-5.5 fill-current text-white transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.33-.26-1.98-.47-.8-.26-1.42-.4-1.36-.85.03-.24.36-.48.99-.74 3.86-1.68 6.43-2.78 7.72-3.3 3.67-1.48 4.43-1.74 4.93-1.75.11 0 .35.03.5.16.13.1.17.24.18.34.02.09.03.26.02.41z" />
          </svg>
        </div>

        {/* Text with animated tracking */}
        <span className="text-xs font-bold tracking-wide font-sans select-none block max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300 ease-in-out whitespace-nowrap">
          Join Telegram
        </span>
      </motion.a>
    </div>
  );
};
