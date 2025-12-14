import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ParticlesBackground } from '@/components/Decorations';
import LandingPage from '@/components/LandingPage';
import QuizPage from '@/components/QuizPage';
import RewardPage from '@/components/RewardPage';
import StorePage, { type Product } from '@/components/StorePage';
import CheckoutPage from '@/components/CheckoutPage';

type Step = 'landing' | 'quiz' | 'reward' | 'store' | 'checkout';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleStart = () => setCurrentStep('quiz');
  const handleQuizComplete = () => setCurrentStep('reward');
  const handleViewProducts = () => setCurrentStep('store');
  const handleCheckout = (product: Product) => {
    setSelectedProduct(product);
    setCurrentStep('checkout');
  };
  const handleBackToStore = () => setCurrentStep('store');
  const handleRestartQuiz = () => setCurrentStep('landing');

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticlesBackground particleCount={40} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          {currentStep === 'landing' && (
            <LandingPage onStart={handleStart} />
          )}
          
          {currentStep === 'quiz' && (
            <QuizPage onComplete={handleQuizComplete} />
          )}
          
          {currentStep === 'reward' && (
            <RewardPage onContinue={handleViewProducts} />
          )}
          
          {currentStep === 'store' && (
            <StorePage 
              onCheckout={handleCheckout}
              onRestartQuiz={handleRestartQuiz}
            />
          )}
          
          {currentStep === 'checkout' && selectedProduct && (
            <CheckoutPage 
              product={selectedProduct}
              onBack={handleBackToStore}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Index;
