import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

export function AnimatedBackground() {
  const { theme } = useTheme();
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);

  useEffect(() => {
    // Very minimal particles for subtle effect
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.2 + 0.3,
      duration: Math.random() * 50 + 40,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Background base - noir ou blanc selon le thème */}
      <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`} />
      
      {/* Fine dot grid pattern - HSP style - serrés avec dégradé */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: theme === 'dark' 
            ? 'radial-gradient(circle, rgba(255, 255, 255, 0.35) 1px, transparent 1px)'
            : 'radial-gradient(circle, rgba(0, 0, 0, 0.15) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />
      
      {/* Gradient mask pour fondre les points sur les bords */}
      <div
        className="absolute inset-0"
        style={{
          background: theme === 'dark'
            ? 'radial-gradient(ellipse at center, transparent 0%, transparent 35%, rgba(0, 0, 0, 0.5) 65%, black 90%)'
            : 'radial-gradient(ellipse at center, transparent 0%, transparent 35%, rgba(255, 255, 255, 0.5) 65%, white 90%)',
        }}
      />

      {/* Ultra subtle gradient accent - barely visible */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: theme === 'dark'
            ? "radial-gradient(circle, rgba(220, 38, 38, 0.015) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(220, 38, 38, 0.03) 0%, transparent 70%)",
          filter: "blur(100px)",
          top: "5%",
          right: "15%",
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.015, 0.02, 0.015],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Minimal floating particles - ultra subtle */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-black'}`}
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: theme === 'dark' ? 0.08 : 0.04,
          }}
          animate={{
            y: [0, -250, 0],
            opacity: theme === 'dark' ? [0, 0.12, 0] : [0, 0.06, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 20,
          }}
        />
      ))}
    </div>
  );
}