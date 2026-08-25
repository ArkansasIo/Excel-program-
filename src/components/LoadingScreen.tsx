import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Cpu, Settings as SettingsIcon } from 'lucide-react';

export default function LoadingScreen({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Initializing Engine Core...');

  useEffect(() => {
    let currentProgress = 0;
    const stages = [
      { p: 15, text: 'Mapping SQL Excel Database...' },
      { p: 40, text: 'Scanning 8-Bit Virtual Structure...' },
      { p: 65, text: 'Loading ASM Modules...' },
      { p: 90, text: 'Booting PHPMyAdmin Interface...' },
      { p: 100, text: 'System Ready.' },
    ];

    const interval = setInterval(() => {
      currentProgress += Math.random() * 8 + 2;
      if (currentProgress > 100) currentProgress = 100;
      
      setProgress(currentProgress);
      
      const currentStage = stages.find(s => currentProgress <= s.p);
      if (currentStage) {
        setStage(currentStage.text);
      }

      if (currentProgress === 100) {
        clearInterval(interval);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 800);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1e1e] overflow-hidden text-[#cccccc] font-sans">
      {/* Engine Runlines Background */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#107c41]/5 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        {/* Logos container */}
        <div className="flex items-center space-x-6 mb-8 relative">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center justify-center bg-[#2d2d2d] border border-[#3c3c3c] w-24 h-24 rounded-2xl shadow-xl shadow-black/50 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#107c41]/20 to-transparent"></div>
            <Database className="w-10 h-10 text-[#107c41] mb-2 relative z-10" />
            <span className="text-[10px] font-bold text-gray-300 relative z-10 uppercase tracking-widest">Excel SQL</span>
          </motion.div>

          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 40 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="h-px bg-gradient-to-r from-[#107c41] to-blue-500"
          ></motion.div>

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col items-center justify-center bg-[#2d2d2d] border border-[#3c3c3c] w-24 h-24 rounded-2xl shadow-xl shadow-black/50 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent"></div>
            <Cpu className="w-10 h-10 text-blue-500 mb-2 relative z-10" />
            <span className="text-[10px] font-bold text-gray-300 relative z-10 uppercase tracking-widest">ASM V-Core</span>
          </motion.div>
        </div>

        {/* Titles */}
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.6, duration: 0.5 }}
           className="text-center mb-10"
        >
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase flex items-center justify-center">
            Database Engine <SettingsIcon className="w-4 h-4 ml-2 animate-[spin_3s_linear_infinite] opacity-50" />
          </h1>
          <p className="text-sm text-gray-400 mt-2 tracking-widest font-mono">WORKSPACE INITIALIZATION</p>
        </motion.div>

        {/* Progress bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="w-full"
        >
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-[#107c41]">{stage}</span>
            <span className="text-gray-500">{Math.floor(progress)}%</span>
          </div>
          <div className="h-1 w-full bg-[#3c3c3c] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#107c41] to-blue-500 shadow-[0_0_10px_rgba(16,124,65,0.5)]"
              style={{ width: `${progress}%` }}
              layout
            ></motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
