import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BauduccoLogo, StarDecoration } from './Decorations';
import confetti from 'canvas-confetti';

interface RewardPageProps {
  onContinue: () => void;
}

const RewardPage = ({ onContinue }: RewardPageProps) => {
  useEffect(() => {
    // Fire confetti on mount
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ['#FBBC05', '#FFD700', '#FFA500', '#FFFFFF'];

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: randomInRange(0.1, 0.5),
        },
        colors,
        gravity: 1.2,
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <BauduccoLogo />

      <motion.div
        className="w-full max-w-md mx-auto flex flex-col items-center text-center mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Gift Icon */}
        <motion.div
          className="relative mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <div className="w-24 h-24 bg-gold/20 rounded-full flex items-center justify-center animate-pulse-glow">
            <Gift className="w-12 h-12 text-gold animate-bounce-gentle" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-gold animate-twinkle" />
          <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-gold animate-twinkle" style={{ animationDelay: '0.5s' }} />
        </motion.div>

        {/* Success Message */}
        <motion.h2
          className="font-display text-3xl md:text-4xl text-foreground mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Parabéns! 🎄
        </motion.h2>

        <motion.p
          className="text-muted-foreground mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Você ganhou um presente especial de Natal!
        </motion.p>

        {/* Coupon Ticket */}
        <motion.div
          className="relative w-full max-w-sm mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: "spring" }}
        >
          <div className="gradient-dark-card border-2 border-dashed border-gold rounded-2xl p-8 relative overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 animate-shimmer" />
            
            <StarDecoration className="mb-4" />
            
            <div className="text-gold text-6xl md:text-7xl font-bold font-display mb-2">
              45% OFF
            </div>
            
            <p className="text-muted-foreground text-sm">
              Válido para produtos selecionados
            </p>

            {/* Decorative circles on sides */}
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full" />
            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full" />
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="w-full"
        >
          <Button
            variant="gold"
            size="xl"
            onClick={onContinue}
            className="w-full max-w-xs mx-auto"
          >
            Ver Produtos Bauducco
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RewardPage;
