import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, QrCode, Copy, Check, ShieldCheck, Truck, Loader2, Package } from 'lucide-react';
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

const onlyDigits = (value: string) => (value || '').replace(/\D/g, '');

const isValidCPF = (cpfRaw: string) => {
  const cpf = onlyDigits(cpfRaw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split('').map((c) => Number(c));

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let mod = (sum * 10) % 11;
  if (mod === 10) mod = 0;
  if (mod !== digits[9]) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  mod = (sum * 10) % 11;
  if (mod === 10) mod = 0;
  if (mod !== digits[10]) return false;

  return true;
};

const CheckoutPage = ({ cartItems, onBack }: CheckoutPageProps) => {
  const [paymentMethod] = useState<'pix'>('pix');
  const [showQRCode, setShowQRCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [pixQrCode, setPixQrCode] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const { toast } = useToast();

  const MIN_PIX_AMOUNT = 7.5;

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
    state: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, cep: value }));

    // Auto-lookup when CEP has 8 digits (with or without hyphen)
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const { data, error } = await supabase.functions.invoke('lookup-cep', {
          body: { cep: cleanCep },
        });

        if (error) throw error;

        if (data && !data.error) {
          setFormData(prev => ({
            ...prev,
            street: data.street || prev.street,
            neighborhood: data.neighborhood || prev.neighborhood,
            city: data.city || prev.city,
            state: data.state || prev.state,
          }));
          toast({
            title: "Endereço encontrado!",
            description: `${data.city} - ${data.state}`,
          });
        } else if (data?.error) {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP informado.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error looking up CEP:', error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleGenerateQR = async () => {
    // Validate cart first
    const rawTotal = cartItems.reduce((acc, item) => acc + item.product.discountedPrice * item.quantity, 0);
    const total = Math.round(rawTotal * 100) / 100;
    if (!cartItems.length || total <= 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione pelo menos 1 produto para gerar o PIX.',
        variant: 'destructive',
      });
      return;
    }

    // Validate form
    if (!formData.name || !formData.email || !formData.cpf) {
      toast({
        title: "Preencha os dados",
        description: "Por favor, preencha nome, email e CPF para gerar o PIX.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidCPF(formData.cpf)) {
      toast({
        title: 'CPF inválido',
        description: 'Verifique o CPF informado e tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setShowQRCode(false);
    setPixCode('');
    setPixQrCode('');
    setTransactionId('');

    try {
      // Avoid floating-point issues on minimum check
      const totalForCheck = Math.round(total * 100) / 100;

      if (totalForCheck + 1e-9 < MIN_PIX_AMOUNT) {
        toast({
          title: 'Valor mínimo do PIX',
          description: `O valor mínimo para pagamento via PIX é R$ ${MIN_PIX_AMOUNT.toFixed(2).replace('.', ',')}. Adicione mais itens ao carrinho.`,
          variant: 'destructive',
        });
        return;
      }

      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      console.log('Generating PIX for order:', orderId, 'Amount:', total);

      let data, error;
      try {
        const response = await supabase.functions.invoke('create-pix', {
          body: {
            amount: total,
            customerName: formData.name,
            customerEmail: formData.email,
            customerDocument: onlyDigits(formData.cpf),
            customerPhone: onlyDigits(formData.phone),
            orderId: orderId,
            street: formData.street,
            number: formData.number,
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            zipCode: formData.cep,
          },
        });
        data = response.data;
        error = response.error;
      } catch (fetchError) {
        console.error('Network/CORS error:', fetchError);
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }

      console.log('PIX response:', data, error);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Erro ao gerar PIX');
      }

      if (!data) {
        throw new Error('Resposta vazia do servidor');
      }

      if (data.error) {
        console.error('API Error:', data);
        toast({
          title: "Erro na API",
          description: data.error || "Verifique os dados informados.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!data.pixCode && !data.pixQrCode) {
        throw new Error('PIX não foi gerado corretamente');
      }

      setPixCode(data.pixCode || '');
      setPixQrCode(data.pixQrCode || '');
      setTransactionId(data.transactionId || '');
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
      setShowQRCode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!transactionId) {
      toast({
        title: "Erro",
        description: "ID da transação não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setCheckingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke('check-pix', {
        body: { transactionId },
      });

      console.log('Payment check response:', data, error);

      if (error) {
        throw new Error(error.message || 'Erro ao verificar pagamento');
      }

      if (data?.isPaid) {
        setPaymentConfirmed(true);
        toast({
          title: "Pagamento confirmado!",
          description: "Seu pedido foi processado com sucesso.",
        });
      } else {
        toast({
          title: "Pagamento pendente",
          description: "O pagamento ainda não foi identificado. Tente novamente em alguns segundos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      toast({
        title: "Erro ao verificar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCheckingPayment(false);
    }
  };

  // Payment confirmed success screen
  if (paymentConfirmed) {
    return (
      <div className="min-h-screen px-4 py-6 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-24 h-24 bg-christmas-green/20 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Package className="w-12 h-12 text-christmas-green" />
          </motion.div>
          
          <motion.h1
            className="font-display text-3xl md:text-4xl text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Pagamento Confirmado!
          </motion.h1>
          
          <motion.p
            className="text-lg text-muted-foreground mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Seu produto chegará em sua casa em breve. Obrigado por comprar conosco!
          </motion.p>

          <motion.div
            className="bg-card/50 border border-border rounded-xl p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3 text-left">
              <Truck className="w-8 h-8 text-gold flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Entrega em até 24h</p>
                <p className="text-sm text-muted-foreground">
                  {formData.street}, {formData.number} - {formData.neighborhood}, {formData.city}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <BauduccoLogo />
          </motion.div>
        </motion.div>
      </div>
    );
  }

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
                    <div className="relative">
                      <Label htmlFor="cep">CEP</Label>
                      <Input id="cep" placeholder="00000-000" className="mt-1" value={formData.cep} onChange={handleCepChange} />
                      {loadingCep && (
                        <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-9 text-muted-foreground" />
                      )}
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

                {paymentMethod === 'pix' && !showQRCode && (
                  <Button variant="gold" size="lg" className="w-full" onClick={handleGenerateQR} disabled={loading || cartItems.length === 0}>
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
                        src={`data:image/png;base64,${pixQrCode}`} 
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
                    <div className="flex gap-2 mb-4">
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
                      <p className="text-christmas-green text-sm mb-4">Código copiado!</p>
                    )}
                    
                    {/* Check Payment Button */}
                    <Button 
                      variant="gold" 
                      size="lg" 
                      className="w-full mt-4" 
                      onClick={handleCheckPayment}
                      disabled={checkingPayment || !transactionId}
                    >
                      {checkingPayment ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5 mr-2" />
                      )}
                      {checkingPayment ? 'Verificando...' : 'Já efetuei o pagamento'}
                    </Button>
                  </motion.div>
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
