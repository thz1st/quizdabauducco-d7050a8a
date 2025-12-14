import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Product } from './StorePage';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface FloatingCartProps {
  items: CartItem[];
  onAddItem: (product: Product) => void;
  onRemoveItem: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onCheckout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const FloatingCart = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
  isOpen,
  onToggle,
}: FloatingCartProps) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.discountedPrice * item.quantity,
    0
  );

  return (
    <>
      {/* Floating Cart Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gold rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        onClick={onToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <ShoppingCart className="w-7 h-7 text-coffee-dark" />
        
        {/* Badge Counter */}
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 bg-christmas-red text-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              {totalItems > 99 ? '99+' : totalItems}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
            />
            
            {/* Cart Panel */}
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-gold" />
                  <h2 className="font-display text-lg text-foreground">Seu Carrinho</h2>
                </div>
                <button
                  onClick={onToggle}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Seu carrinho está vazio</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      className="flex gap-3 bg-secondary/30 rounded-lg p-3"
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground line-clamp-2">
                          {item.product.name}
                        </h3>
                        <p className="text-gold font-bold mt-1">
                          R$ {item.product.discountedPrice.toFixed(2).replace('.', ',')}
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.product.id, Math.max(0, item.quantity - 1))
                            }
                            className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-foreground" />
                          </button>
                          <span className="text-foreground font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-foreground" />
                          </button>
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="ml-auto p-1.5 hover:bg-destructive/20 rounded-full transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="p-4 border-t border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="text-2xl font-bold text-gold">
                      R$ {totalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full"
                    onClick={onCheckout}
                  >
                    Finalizar Compra
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingCart;
