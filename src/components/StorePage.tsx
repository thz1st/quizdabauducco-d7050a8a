import { motion } from 'framer-motion';
import { Star, ShoppingCart, Tag, Award, Shield, MessageSquare, CreditCard, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BauduccoLogo } from './Decorations';

import chocottonePistache from '@/assets/chocottone-pistache.jpg';
import chocottoneMousse from '@/assets/chocottone-mousse.jpg';
import chocottoneOvomaltine from '@/assets/chocottone-ovomaltine.jpg';
import chocottoneTradicional from '@/assets/chocottone-tradicional.jpg';
import panetoneFrutas from '@/assets/panetone-frutas.jpg';
import miniPanetone from '@/assets/mini-panetone.jpg';
import mariaSilvaImg from '@/assets/maria-silva.jpg';
import joaoPedroImg from '@/assets/joao-pedro.jpg';
import anaCarolinaImg from '@/assets/ana-carolina.jpg';

interface StorePageProps {
  onCheckout: (product: Product) => void;
  onRestartQuiz: () => void;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
}

const products: Product[] = [
  {
    id: 1,
    name: "Chocottone Recheio Pistache",
    description: "Recheio cremoso de pistache com gotas de chocolate",
    originalPrice: 120.00,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 847,
    image: chocottonePistache,
    badge: "Lançamento"
  },
  {
    id: 2,
    name: "Chocottone Recheio Mousse",
    description: "Recheio de mousse de chocolate ao leite",
    originalPrice: 90.00,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 623,
    image: chocottoneMousse,
    badge: "-45%"
  },
  {
    id: 3,
    name: "Chocottone Ovomaltine",
    description: "Com creme de Ovomaltine e flocos crocantes",
    originalPrice: 85.00,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 512,
    image: chocottoneOvomaltine,
    badge: "-45%"
  },
  {
    id: 4,
    name: "Chocottone Tradicional 500g",
    description: "O clássico Chocottone com gotas de chocolate",
    originalPrice: 65.00,
    discountedPrice: 8.90,
    rating: 5,
    reviews: 1247,
    image: chocottoneTradicional,
    badge: "-45%"
  },
  {
    id: 5,
    name: "Panetone Frutas Premium",
    description: "Com frutas cristalizadas selecionadas",
    originalPrice: 75.00,
    discountedPrice: 9.90,
    rating: 4,
    reviews: 389,
    image: panetoneFrutas
  },
  {
    id: 6,
    name: "Mini Panetone Gotas",
    description: "Mini panetone com gotas de chocolate",
    originalPrice: 25.00,
    discountedPrice: 4.90,
    rating: 5,
    reviews: 756,
    image: miniPanetone,
    badge: "-45%"
  },
];

const ProductCard = ({ product, onBuy }: { product: Product; onBuy: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden group cursor-pointer h-full">
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {product.badge && (
            <div className="absolute top-3 left-3 bg-gold text-coffee-dark px-3 py-1 rounded-full text-xs font-bold">
              {product.badge}
            </div>
          )}
          <div className="absolute top-3 right-3 bg-christmas-red text-foreground px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Tag className="w-3 h-3" />
            45% OFF
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < product.rating ? 'text-gold fill-gold' : 'text-muted'}`}
              />
            ))}
            <span className="text-muted-foreground text-xs ml-1">({product.reviews})</span>
          </div>
          
          {/* Prices */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-gold text-xl font-bold">
              R$ {product.discountedPrice.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-muted-foreground text-sm line-through">
              R$ {product.originalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
          
          <Button 
            variant="gold-outline" 
            size="sm" 
            className="w-full"
            onClick={onBuy}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Comprar Agora
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StorePage = ({ onCheckout, onRestartQuiz }: StorePageProps) => {
  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <BauduccoLogo />
      </div>

      {/* Promo Banner */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-block bg-gold text-coffee-dark px-4 py-1 rounded-full text-sm font-bold mb-3">
          PROMOÇÃO DE NATAL
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          Parabéns 🎁
        </h1>
        <p className="text-muted-foreground mb-4">
          Você acabou de ganhar um super presente Bauducco
        </p>
        
        {/* Social Proof */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-gold fill-gold" />
            ))}
          </div>
          <span className="text-muted-foreground text-sm">
            Mais de <span className="text-gold font-semibold">50.000</span> clientes satisfeitos
          </span>
        </div>
      </motion.div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard 
                product={product} 
                onBuy={() => onCheckout(product)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Restart Quiz Button */}
      <motion.div
        className="text-center mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button 
          variant="outline" 
          onClick={onRestartQuiz}
          className="mx-auto"
        >
          <Award className="w-4 h-4 mr-2" />
          Fazer o Quiz Novamente
        </Button>
      </motion.div>

      {/* Testimonials */}
      <motion.section
        className="max-w-5xl mx-auto mt-16 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="font-display text-2xl md:text-3xl text-center text-foreground mb-8">
          O que nossos clientes dizem
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { 
              name: "Maria Silva", 
              location: "São Paulo",
              text: "Produtos frescos e de qualidade! Chegou super rápido. Amei!", 
              image: mariaSilvaImg 
            },
            { 
              name: "João Pedro", 
              location: "Rio de Janeiro",
              text: "Melhor panetone que já comi. Minha família toda aprovou!", 
              image: joaoPedroImg 
            },
            { 
              name: "Ana Carolina", 
              location: "Belo Horizonte",
              text: "Preço excelente e sabor incomparável. Já virou tradição aqui em casa.", 
              image: anaCarolinaImg 
            },
          ].map((testimonial, i) => (
            <Card key={i} className="p-5 border-border/50">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-gold fill-gold" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-5 italic leading-relaxed">
                "{testimonial.text}"
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-foreground text-sm font-medium block">{testimonial.name}</span>
                    <span className="text-muted-foreground text-xs">{testimonial.location}</span>
                  </div>
                </div>
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* Stats */}
      <motion.div
        className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-t border-border/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {[
          { icon: Shield, value: "50.000+", label: "Clientes satisfeitos" },
          { icon: MessageSquare, value: "99%", label: "Aprovação" },
          { icon: Award, value: "80+", label: "Anos de tradição" },
          { icon: Truck, value: "24h", label: "Entrega expressa" },
        ].map((stat, i) => (
          <div key={i} className="text-center flex flex-col items-center gap-2">
            <stat.icon className="w-6 h-6 text-gold" />
            <div className="text-gold text-xl md:text-2xl font-bold">{stat.value}</div>
            <div className="text-muted-foreground text-xs">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Footer with Security Badges */}
      <motion.footer
        className="max-w-4xl mx-auto mt-8 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {/* Security Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Shield, label: "Site Seguro", sublabel: "SSL Certificado" },
            { icon: MessageSquare, label: "Reclame Aqui", sublabel: "Nota 9.5" },
            { icon: CreditCard, label: "Pagamento Seguro", sublabel: "100% Protegido" },
            { icon: Truck, label: "Entrega Garantida", sublabel: "Rastreável" },
          ].map((badge, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 bg-card/50 rounded-lg border border-border/30">
              <badge.icon className="w-8 h-8 text-gold" />
              <span className="text-foreground text-xs font-semibold text-center">{badge.label}</span>
              <span className="text-muted-foreground text-[10px] text-center">{badge.sublabel}</span>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="text-center mb-6">
          <p className="text-muted-foreground text-xs mb-3">Formas de pagamento</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {["Visa", "Mastercard", "Elo", "Amex", "Hipercard", "PIX"].map((method, i) => (
              <div 
                key={i} 
                className="bg-white/10 px-3 py-1.5 rounded text-[10px] text-muted-foreground font-medium border border-border/30"
              >
                {method}
              </div>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <div className="text-center border-t border-border/30 pt-6">
          <p className="text-muted-foreground text-[10px] leading-relaxed max-w-2xl mx-auto">
            Bauducco & Cia Ltda. CNPJ: 61.125.821/0001-90<br />
            Rua Jorge Araújo, 201 - Guarulhos/SP - CEP: 07040-000<br />
            SAC: 0800 770 8855 | atendimento@bauducco.com.br
          </p>
          <p className="text-muted-foreground/60 text-[9px] mt-4">
            © 2025 Bauducco. Todos os direitos reservados.
          </p>
        </div>
      </motion.footer>
    </div>
  );
};

export default StorePage;
