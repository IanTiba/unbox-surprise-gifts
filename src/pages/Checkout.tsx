import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Gift, 
  ArrowLeft, 
  Check, 
  CreditCard, 
  Sparkles, 
  Music, 
  Clock,
  Mail,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GiftCard {
  id: string;
  message: string;
  image?: File;
  image_url?: string;
  audio?: File;
  audio_url?: string;
  unlockDelay?: number;
}

interface GiftBox {
  title: string;
  cards: GiftCard[];
  theme: string;
  hasConfetti: boolean;
  hasBackgroundMusic: boolean;
  emoji: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const box = location.state?.box as GiftBox;
  
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  // Check for canceled payment on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('canceled') === 'true') {
      setShowCancelAlert(true);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (!box) {
    navigate('/builder');
    return null;
  }

  const getPrice = () => {
    const cardCount = box.cards.length;
    const hasAudio = box.cards.some(card => card.audio);
    const hasDelays = box.cards.some(card => card.unlockDelay && card.unlockDelay > 0);
    
    if (hasDelays) return 9.99;
    if (cardCount > 5 || hasAudio || box.hasConfetti) return 7.99;
    return 4.99;
  };

  const getPriceTier = () => {
    const price = getPrice();
    if (price === 9.99) return { name: "Time Capsule", features: ["Up to 7 cards", "Text, images & audio", "Delayed delivery", "All premium features"] };
    if (price === 7.99) return { name: "Deluxe", features: ["Up to 7 cards", "Text, images & audio", "Confetti animation", "Background music"] };
    return { name: "Standard", features: ["Up to 5 cards", "Text & images", "Basic themes", "Instant delivery"] };
  };

  const handlePayment = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!cardNumber.trim() || !expiry.trim() || !cvc.trim() || !cardName.trim()) {
      toast({
        title: "Payment information required",
        description: "Please fill in all payment details.",
        variant: "destructive",
      });
      return;
    }

    if (!box.title.trim()) {
      toast({
        title: "Box title required",
        description: "Please add a title to your gift box.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create Stripe payment session with card information
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: getPrice(),
          email: email,
          giftBox: box,
          cardData: {
            number: cardNumber,
            expiry: expiry,
            cvc: cvc,
            name: cardName
          }
        }
      });

      if (error) throw error;

      if (!data.url) {
        throw new Error("No checkout URL returned from payment service");
      }

      // Store gift box data in session storage for after payment
      sessionStorage.setItem('pendingGiftBox', JSON.stringify({
        box,
        email,
        sessionId: data.session_id
      }));

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');

      // Show message about payment in new tab
      toast({
        title: "Redirecting to payment",
        description: "Complete your payment in the new tab that opened.",
      });

    } catch (error) {
      console.error('Payment creation error:', error);
      toast({
        title: "Payment setup failed",
        description: "There was an issue setting up your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const tier = getPriceTier();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="px-6 py-4 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/builder', { state: { box } })}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Builder
          </Button>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Checkout</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{tier.name} Plan</span>
                  <Badge variant="secondary" className="bg-gradient-primary text-white">
                    ${getPrice()}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Your Gift Box: "{box.title}"</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Gift className="w-4 h-4" />
                      <span>{box.cards.length} cards</span>
                    </div>
                    {box.hasConfetti && (
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Confetti animation</span>
                      </div>
                    )}
                    {box.hasBackgroundMusic && (
                      <div className="flex items-center space-x-2">
                        <Music className="w-4 h-4" />
                        <span>Background music</span>
                      </div>
                    )}
                    {box.cards.some(card => card.unlockDelay && card.unlockDelay > 0) && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Delayed unlock</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${getPrice()}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll send you the gift box link and QR code
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => {
                      // Format card number with spaces
                      const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                      if (value.replace(/\s/g, '').length <= 16) {
                        setCardNumber(value);
                      }
                    }}
                    className="mt-1"
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => {
                        // Format expiry as MM/YY
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          setExpiry(value.slice(0, 2) + '/' + value.slice(2, 4));
                        } else {
                          setExpiry(value);
                        }
                      }}
                      className="mt-1"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => {
                        // Only allow numbers, max 4 digits
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 4) {
                          setCvc(value);
                        }
                      }}
                      className="mt-1"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Name on Card</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              variant="hero"
              size="lg"
              className="w-full text-lg py-6"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Complete Purchase ${getPrice()}
                </>
              )}
            </Button>

            {showCancelAlert && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Payment was canceled. No charge was made to your card. You can try again when ready.
                </AlertDescription>
              </Alert>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Stripe. Your payment information is encrypted and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;