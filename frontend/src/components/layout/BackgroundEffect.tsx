import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

/**
 * BackgroundEffect - A subtle, modular background with animated particles.
 * To disable, just comment out its usage in App.tsx or any layout file.
 */
const BackgroundEffect: React.FC = () => {
  // Generate a fixed set of random positions for particles
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      // Focus more on sides (0-20% and 80-100%)
      left: i % 2 === 0 ? `${Math.random() * 40}%` : `${60 + Math.random() * 20}%`,
      top: `${Math.random() * 100}%`,
      scale: 0.5 + Math.random() * 1,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#f1f5f9]">
      {/* Soft gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-accent/5 opacity-40" />
      
      {/* Animated Star Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-accent/20 blur-[0.px]"
          style={{ 
            left: p.left, 
            top: p.top,
          }}
          animate={{
            y: [0, -40, 0],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.6, 0.3],
            scale: [p.scale, p.scale * 1.2, p.scale],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
        >
          <Sparkles size={48} />
        </motion.div>
      ))}

      {/* Subtle Vignette to dim the "whiteness" */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.02)]" />
    </div>
  );
};

export default BackgroundEffect;
