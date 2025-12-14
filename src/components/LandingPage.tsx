import { motion } from 'framer-motion';
import { TreePine, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BauduccoLogo, StarDecoration } from './Decorations';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage = ({ onStart }: LandingPageProps) => {
  const benefits = [
    { icon: '4', text: 'Perguntas' },
    { icon: '2', text: 'Minutos' },
    { icon: '✓', text: 'Desconto Garantido' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        className="w-full max-w-md mx-auto flex flex-col items-center text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Logo */}
        <BauduccoLogo />

        {/* Title */}
        <motion.h1
          className="font-display text-4xl md:text-5xl font-light text-foreground mt-8 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Quiz de Natal
        </motion.h1>

        {/* Highlight Box */}
        <motion.div
          className="gradient-dark-card magic-border rounded-2xl p-6 mb-6 w-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <TreePine className="w-8 h-8 text-christmas-green" />
            <span className="text-gold text-2xl md:text-3xl font-bold">
              Ganhe até 45% de desconto!
            </span>
          </div>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Responda 4 perguntas sobre a Bauducco e desbloqueie um cupom exclusivo 
            de Natal para usar em nossos deliciosos produtos!
          </p>
        </motion.div>

        {/* Benefits Tags */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full border border-border/50"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <span className="w-6 h-6 bg-gold text-coffee-dark rounded-full flex items-center justify-center text-xs font-bold">
                {benefit.icon === '✓' ? <Check className="w-4 h-4" /> : benefit.icon}
              </span>
              <span className="text-foreground text-sm font-medium">{benefit.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="w-full"
        >
          <Button
            variant="gold"
            size="xl"
            onClick={onStart}
            className="w-full max-w-xs mx-auto animate-pulse-glow"
          >
            Começar Quiz
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          className="text-muted-foreground text-xs mt-8 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Uma tradição de Natal que adoça sua vida
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LandingPage;
