import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, QrCode, Copy, Check, ShieldCheck, Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BauduccoLogo } from './Decorations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Product } from './StorePage';
import type { CartItem } from './FloatingCart';

interface CheckoutPageProps {
  cartItems: CartItem[];
  onBack: () => void;
}

const CheckoutPage = ({ cartItems, onBack }: CheckoutPageProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [showQRCode, setShowQRCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [pixQrCode, setPixQrCode] = useState('');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleGenerateQR = async () => {
    // Validate form
    if (!formData.name || !formData.email || !formData.cpf) {
      toast({
        title: "Preencha os dados",
        description: "Por favor, preencha nome, email e CPF para gerar o PIX.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const total = cartItems.reduce((acc, item) => acc + item.product.discountedPrice * item.quantity, 0);
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      console.log('Generating PIX for order:', orderId, 'Amount:', total);

      const { data, error } = await supabase.functions.invoke('create-pix', {
        body: {
          amount: total,
          customerName: formData.name,
          customerEmail: formData.email,
          customerDocument: formData.cpf,
          orderId: orderId,
        },
      });

      console.log('PIX response:', data, error);

      if (error) {
        throw new Error(error.message || 'Erro ao gerar PIX');
      }

      if (data?.error) {
        console.error('API Error:', data);
        toast({
          title: "Erro na API",
          description: data.message || "Verifique as credenciais do gateway.",
          variant: "destructive",
        });
        // Show QR anyway with fallback for testing
        setPixCode(data.details?.message || 'Erro ao gerar código PIX');
        setShowQRCode(true);
        return;
      }

      setPixCode(data.pixCode || '');
      setPixQrCode(data.pixQrCode || '');
      setShowQRCode(true);

      toast({
        title: "PIX gerado!",
        description: "Escaneie o QR Code ou copie o código para pagar.",
      });

    } catch (error) {
      console.error('Error generating PIX:', error);
      toast({
        title: "Erro ao gerar PIX",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <BauduccoLogo />
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      <div className="max-w-4xl mx-auto">
        <motion.h1
          className="font-display text-2xl md:text-3xl text-foreground text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Finalizar Compra
        </motion.h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <motion.div
            className="md:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-4">Resumo do Pedido</h3>
                
                <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground mb-1">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-gold font-bold text-sm">
                            R$ {(item.product.discountedPrice * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} itens)</span>
                    <span className="text-foreground">
                      R$ {cartItems.reduce((acc, item) => acc + item.product.discountedPrice * item.quantity, 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="text-christmas-green">Grátis</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span className="text-foreground">Total</span>
                    <span className="text-gold">
                      R$ {cartItems.reduce((acc, item) => acc + item.product.discountedPrice * item.quantity, 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-christmas-green" />
                    <span>Compra 100% Segura</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="w-4 h-4 text-christmas-green" />
                    <span>Entrega em até 24h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Form */}
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardContent className="p-6">
                {/* Personal Data */}
                <h3 className="font-semibold text-foreground mb-4">Dados Pessoais</h3>
                <div className="grid gap-4 mb-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input id="name" placeholder="Seu nome completo" className="mt-1" value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" type="email" placeholder="seu@email.com" className="mt-1" value={formData.email} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input id="cpf" placeholder="000.000.000-00" className="mt-1" value={formData.cpf} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" placeholder="(00) 00000-0000" className="mt-1" value={formData.phone} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <h3 className="font-semibold text-foreground mb-4">Endereço de Entrega</h3>
                <div className="grid gap-4 mb-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input id="cep" placeholder="00000-000" className="mt-1" value={formData.cep} onChange={handleInputChange} />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="street">Rua</Label>
                      <Input id="street" placeholder="Nome da rua" className="mt-1" value={formData.street} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="number">Número</Label>
                      <Input id="number" placeholder="123" className="mt-1" value={formData.number} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input id="neighborhood" placeholder="Seu bairro" className="mt-1" value={formData.neighborhood} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input id="city" placeholder="Sua cidade" className="mt-1" value={formData.city} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <h3 className="font-semibold text-foreground mb-4">Forma de Pagamento</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <Button
                    variant={paymentMethod === 'pix' ? 'gold' : 'outline'}
                    className="h-16"
                    onClick={() => setPaymentMethod('pix')}
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    PIX
                  </Button>
                  <Button
                    variant={paymentMethod === 'card' ? 'gold' : 'outline'}
                    className="h-16"
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Cartão
                  </Button>
                </div>

                {paymentMethod === 'pix' && !showQRCode && (
                  <Button variant="gold" size="lg" className="w-full" onClick={handleGenerateQR} disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <QrCode className="w-5 h-5 mr-2" />
                    )}
                    {loading ? 'Gerando PIX...' : 'Gerar QR Code Pix'}
                  </Button>
                )}

                {paymentMethod === 'pix' && showQRCode && (
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {pixQrCode ? (
                      <img 
                        src={pixQrCode} 
                        alt="QR Code PIX" 
                        className="w-48 h-48 mx-auto mb-4 rounded-xl"
                      />
                    ) : (
                      <div className="bg-foreground p-4 rounded-xl inline-block mb-4">
                        <div className="w-48 h-48 flex items-center justify-center text-background text-sm">
                          QR Code não disponível
                        </div>
                      </div>
                    )}
                    <p className="text-muted-foreground text-sm mb-4">
                      Escaneie o QR Code ou copie o código abaixo
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={pixCode ? (pixCode.length > 50 ? pixCode.slice(0, 50) + '...' : pixCode) : 'Código não disponível'}
                        readOnly
                        className="text-xs"
                      />
                      <Button variant="gold-outline" onClick={handleCopyPix} disabled={!pixCode}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    {copied && (
                      <p className="text-christmas-green text-sm mt-2">Código copiado!</p>
                    )}
                  </motion.div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Número do Cartão</Label>
                      <Input id="cardNumber" placeholder="0000 0000 0000 0000" className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Validade</Label>
                        <Input id="expiry" placeholder="MM/AA" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" className="mt-1" />
                      </div>
                    </div>
                    <Button variant="gold" size="lg" className="w-full">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Finalizar Pagamento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
