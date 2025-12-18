import { motion } from 'framer-motion';
import { Star, ShoppingCart, Tag, Award, Shield, MessageSquare, CreditCard, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BauduccoLogo } from './Decorations';

import chocottonePistache from '@/assets/chocottone-pistache-new.webp';
import chocottoneMousse from '@/assets/chocottone-mousse-new.webp';
import chocottoneAvela from '@/assets/chocottone-avela.webp';
import chocottoneTrufado from '@/assets/chocottone-trufado.webp';
import chocottoneMms from '@/assets/chocottone-mms.webp';
import chocottoneFini from '@/assets/chocottone-fini.jpg';
import lataChocottone from '@/assets/lata-chocottone.webp';
import cestaNatal from '@/assets/cesta-natal.webp';
import chocoBrownie from '@/assets/choco-brownie.webp';
import cookiesTradicional from '@/assets/cookies-tradicional.webp';
import biscoitoMorango from '@/assets/biscoito-morango.webp';
import bellastella from '@/assets/bellastella.webp';
import buongrano from '@/assets/buongrano.webp';
import biscoitoNatalino from '@/assets/biscoito-natalino.webp';
import biscoitoBaunilha from '@/assets/biscoito-baunilha.webp';
import chocobiscuitMeioAmargo from '@/assets/chocobiscuit-meio-amargo.webp';
import croissantChocolate from '@/assets/croissant-chocolate.webp';
import palmier from '@/assets/palmier.webp';
import recheadinhoBrigadeiro from '@/assets/recheadinho-brigadeiro.webp';
import biscoitoChampanhe from '@/assets/biscoito-champanhe.png';
import mariaSilvaImg from '@/assets/maria-silva.jpg';
import joaoPedroImg from '@/assets/joao-pedro.jpg';
import anaCarolinaImg from '@/assets/ana-carolina.jpg';
import visaLogo from '@/assets/visa.png';
import mastercardLogo from '@/assets/mastercard.png';
import eloLogo from '@/assets/elo.png';
import pixLogo from '@/assets/pix.png';

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
    name: "Chocottone Recheio Pistache 450g",
    description: "Panettone com recheio de pistache, gotas e cobertura sabor chocolate",
    originalPrice: 89.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 847,
    image: chocottonePistache,
    badge: "Lançamento"
  },
  {
    id: 2,
    name: "Chocottone Recheio Mousse 450g",
    description: "Panettone com recheio de chocolate sabor mousse, gotas e cobertura",
    originalPrice: 79.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 623,
    image: chocottoneMousse,
    badge: "-45%"
  },
  {
    id: 3,
    name: "Chocottone Chocolate e Avelã 450g",
    description: "Panettone com recheio de chocolate e avelã, cobertura e gotas",
    originalPrice: 79.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 512,
    image: chocottoneAvela,
    badge: "-45%"
  },
  {
    id: 4,
    name: "Chocottone Trufado 450g",
    description: "Panettone com recheio de chocolate sabor trufa, gotas e cobertura",
    originalPrice: 79.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 1247,
    image: chocottoneTrufado,
    badge: "-45%"
  },
  {
    id: 5,
    name: "Chocottone M&M's",
    description: "Panettone com gotas de chocolate, cobertura e sachê de M&M's",
    originalPrice: 69.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 389,
    image: chocottoneMms,
    badge: "Novidade"
  },
  {
    id: 6,
    name: "Chocottone Fini Dentaduras 450g",
    description: "Panettone com recheio sabor morango e framboesa, gotas e cobertura",
    originalPrice: 69.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 756,
    image: chocottoneFini,
    badge: "Novo"
  },
  {
    id: 7,
    name: "Lata Chocottone 750g",
    description: "Chocottone tradicional com gotas de chocolate em lata colecionável",
    originalPrice: 99.90,
    discountedPrice: 54.95,
    rating: 5,
    reviews: 932,
    image: lataChocottone,
    badge: "Premium"
  },
  {
    id: 8,
    name: "Cesta de Natal Bauducco 1,97kg",
    description: "Cesta com sortimento de produtos Bauducco + enfeite natalino colecionável",
    originalPrice: 149.90,
    discountedPrice: 54.95,
    rating: 5,
    reviews: 428,
    image: cestaNatal,
    badge: "Especial"
  },
  {
    id: 9,
    name: "Choco Brownie Netflix 80g",
    description: "Biscoito sabor brownie com gotas de chocolate - edição Netflix",
    originalPrice: 29.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 1156,
    image: chocoBrownie,
    badge: "Edição Limitada"
  },
  {
    id: 10,
    name: "Cookies Tradicional 100g",
    description: "Cookies nº1 do Brasil com gotas de chocolate",
    originalPrice: 29.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 2341,
    image: cookiesTradicional,
    badge: "-45%"
  },
  {
    id: 11,
    name: "Biscoito Recheado Morango 140g",
    description: "Biscoito sabor chocolate com recheio sabor morango",
    originalPrice: 29.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 1823,
    image: biscoitoMorango,
    badge: "-57%"
  },
  {
    id: 12,
    name: "BellaStella Cacau & Avelã 320g",
    description: "Biscoito doce com chocolate e avelã - Importado da Itália",
    originalPrice: 49.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 654,
    image: bellastella,
    badge: "Novo"
  },
  {
    id: 13,
    name: "BuonGrano Leite & Ovos 320g",
    description: "Biscoito doce com leite - Importado da Itália",
    originalPrice: 49.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 543,
    image: buongrano,
    badge: "Novo"
  },
  {
    id: 14,
    name: "Biscoito de Natal 110g",
    description: "Biscoito doce sabor leite com lascas sabor chocolate",
    originalPrice: 29.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 892,
    image: biscoitoNatalino,
    badge: "Novo"
  },
  {
    id: 15,
    name: "Biscoito Recheado Baunilha 140g",
    description: "Biscoito sabor chocolate com recheio sabor baunilha",
    originalPrice: 29.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 1567,
    image: biscoitoBaunilha,
    badge: "-57%"
  },
  {
    id: 16,
    name: "Choco Biscuit Meio Amargo 80g",
    description: "Biscoito e barra sabor chocolate meio amargo - Nº1 do Brasil",
    originalPrice: 29.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 2134,
    image: chocobiscuitMeioAmargo,
    badge: "-57%"
  },
  {
    id: 17,
    name: "Pão Croissant Chocolate 45g",
    description: "Croissant com recheio sabor chocolate - Fermentação Natural",
    originalPrice: 29.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 743,
    image: croissantChocolate,
    badge: "Novo"
  },
  {
    id: 18,
    name: "Palmier Tradicional 100g",
    description: "Biscoito de massa folhada tipo palmier com cobertura açucarada",
    originalPrice: 29.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 1256,
    image: palmier,
    badge: "-57%"
  },
  {
    id: 19,
    name: "Recheadinho Brigadeiro 104g",
    description: "Bolinho recheado sabor brigadeiro - Feito com leite",
    originalPrice: 29.90,
    discountedPrice: 12.90,
    rating: 5,
    reviews: 987,
    image: recheadinhoBrigadeiro,
    badge: "-57%"
  },
  {
    id: 20,
    name: "Biscoito Champanhe 150g",
    description: "Biscoito champanhe com açúcar cristal - Ideal para receitas deliciosas",
    originalPrice: 49.90,
    discountedPrice: 24.90,
    rating: 5,
    reviews: 678,
    image: biscoitoChampanhe,
    badge: "-50%"
  },
];

const ProductCard = ({ product, onBuy }: { product: Product; onBuy: () => void }) => {
  const discountPercent = Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100);
  
  // Check if badge is a discount badge (contains % or OFF)
  const isDiscountBadge = product.badge && (product.badge.includes('%') || product.badge.toLowerCase().includes('off'));
  const showLeftBadge = product.badge && !isDiscountBadge;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden group cursor-pointer h-full">
        <div className="relative aspect-square overflow-hidden bg-secondary/30 p-2">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          />
          {showLeftBadge && (
            <div className="absolute top-3 left-3 bg-gold text-coffee-dark px-3 py-1 rounded-full text-xs font-bold">
              {product.badge}
            </div>
          )}
          <div className="absolute top-3 right-3 bg-christmas-red text-foreground px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {discountPercent}% OFF
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
          <div className="flex items-baseline gap-2 mb-3 flex-wrap">
            <span className="text-gold text-lg sm:text-xl font-bold whitespace-nowrap">
              R$&nbsp;{product.discountedPrice.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-muted-foreground text-xs sm:text-sm line-through whitespace-nowrap">
              R$&nbsp;{product.originalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
          
          <Button 
            variant="gold-outline" 
            className="w-full h-8 px-3 text-xs"
            onClick={onBuy}
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
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
          <div className="flex justify-center items-center gap-3 flex-wrap">
            {[
              { src: visaLogo, alt: "Visa" },
              { src: mastercardLogo, alt: "Mastercard" },
              { src: eloLogo, alt: "Elo" },
              { src: pixLogo, alt: "PIX" },
            ].map((method, i) => (
              <div 
                key={i} 
                className="bg-white rounded-md px-2 py-1.5 flex items-center justify-center"
              >
                <img src={method.src} alt={method.alt} className="h-6 w-auto object-contain" />
              </div>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <div className="text-center border-t border-border/30 pt-6">
          <p className="text-muted-foreground/60 text-[10px] mt-2">
            © 2025 Bauducco. Todos os direitos reservados.
          </p>
          <p className="text-muted-foreground text-[10px] mt-2">
            CNPJ: 49.033.004/0001-65 | Bauducco Indústria de Alimentos Ltda.
          </p>
        </div>
      </motion.footer>
    </div>
  );
};

export default StorePage;
