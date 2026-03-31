import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import './LoadingState.css';

const MESSAGES = [
  'Fetching PR diff from GitHub...',
  'Sending to AI for analysis...',
  'Generating code review...',
];

export default function LoadingState() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let interval = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev < MESSAGES.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-state">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="loading-spinner-wrap"
      >
        <Loader2 size={24} color="var(--text-tertiary)" />
      </motion.div>
      <div className="loading-messages">
        <AnimatePresence mode="wait">
          <motion.p
            key={activeIndex}
            initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(2px)' }}
            transition={{ duration: 0.4 }}
            className="loading-message active"
          >
            {MESSAGES[activeIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
