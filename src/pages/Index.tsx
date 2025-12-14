import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ParticlesBackground, Snowfall } from '@/components/Decorations';
import LandingPage from '@/components/LandingPage';
import QuizPage from '@/components/QuizPage';
import RewardPage from '@/components/RewardPage';
import StorePage, { type Product } from '@/components/StorePage';
import CheckoutPage from '@/components/CheckoutPage';
import FloatingCart, { type CartItem } from '@/components/FloatingCart';
import { useToast } from '@/hooks/use-toast';

type Step = 'landing' | 'quiz' | 'reward' | 'store' | 'checkout';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  const handleStart = () => setCurrentStep('quiz');
  const handleQuizComplete = () => setCurrentStep('reward');
  const handleViewProducts = () => setCurrentStep('store');
  
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    
    toast({
      title: "✅ Adicionado ao carrinho!",
      description: `${product.name} foi adicionado com sucesso`,
    });
  };

  const handleRemoveFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity === 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleCheckoutFromCart = () => {
    if (cartItems.length > 0) {
      setIsCartOpen(false);
      setCurrentStep('checkout');
    }
  };

  const handleCheckout = (product: Product) => {
    handleAddToCart(product);
  };

  const handleBackToStore = () => setCurrentStep('store');
  const handleRestartQuiz = () => setCurrentStep('landing');

  const showCart = currentStep === 'store';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Snowfall snowflakeCount={60} />
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
          
          {currentStep === 'checkout' && cartItems.length > 0 && (
            <CheckoutPage 
              cartItems={cartItems}
              onBack={handleBackToStore}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Floating Cart */}
      {showCart && (
        <FloatingCart
          items={cartItems}
          onAddItem={handleAddToCart}
          onRemoveItem={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={handleCheckoutFromCart}
          isOpen={isCartOpen}
          onToggle={() => setIsCartOpen(!isCartOpen)}
        />
      )}
    </div>
  );
};

export default Index;
