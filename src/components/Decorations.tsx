import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import bauduccoLogo from '@/assets/bauducco-logo.svg';

interface StarDecorationProps {
  className?: string;
}

export const StarDecoration = ({ className }: StarDecorationProps) => {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Star className="w-5 h-5 text-gold fill-transparent star-glow animate-twinkle" style={{ animationDelay: '0s' }} />
      <Star className="w-6 h-6 text-gold fill-transparent star-glow animate-twinkle" style={{ animationDelay: '0.3s' }} />
      <Star className="w-5 h-5 text-gold fill-transparent star-glow animate-twinkle" style={{ animationDelay: '0.6s' }} />
    </div>
  );
};

interface ParticlesBackgroundProps {
  particleCount?: number;
}

export const ParticlesBackground = ({ particleCount = 50 }: ParticlesBackgroundProps) => {
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gold/30"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export const BauduccoLogo = () => {
  return (
    <motion.div 
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <StarDecoration className="mb-2" />
      <img 
        src={bauduccoLogo} 
        alt="Bauducco" 
        className="h-12 md:h-16 w-auto"
      />
    </motion.div>
  );
};
