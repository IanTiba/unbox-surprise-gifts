import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
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

// Initialize Stripe - Replace with your actual publishable key
const stripePromise = loadStripe("YOUR_STRIPE_PUBLISHABLE_KEY_HERE");

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

const CheckoutForm = ({ box, email, setEmail }: { 
  box: GiftBox; 
  email: string; 
  setEmail: (email: string) => void; 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('canceled') === 'true') {
      setShowCancelAlert(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment system not ready",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email to continue.",
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
      // Create payment intent
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: getPrice(),
          email: email,
          giftBox: box
        }
      });

      if (error) throw error;

      if (!data.client_secret) {
        throw new Error("No client secret returned from payment service");
      }

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: email,
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || "Payment failed");
      }

      if (paymentIntent.status === 'succeeded') {
        // Payment successful, create gift box
        const { data: slugData, error: slugError } = await supabase
          .rpc('generate_unique_slug', { title_input: box.title });
        
        if (slugError) throw slugError;
        const slug = slugData;

        const cardsData = box.cards.map(card => ({
          id: card.id,
          message: card.message,
          image_url: card.image_url || null,
          audio_url: card.audio_url || null,
          unlock_delay: card.unlockDelay || 0
        }));

        const { data: gift, error: giftError } = await supabase
          .from('gifts')
          .insert({
            slug,
            title: box.title,
            emoji: box.emoji,
            theme: box.theme,
            has_confetti: box.hasConfetti,
            has_background_music: box.hasBackgroundMusic,
            cards: cardsData,
            user_id: null,
            is_public: true
          })
          .select()
          .single();

        if (giftError) throw giftError;

        const shareLink = `${window.location.origin}/gift/${slug}`;
        
        toast({
          title: "Payment successful! 🎉",
          description: "Your gift box has been created.",
        });
        
        navigate('/success', {
          state: {
            box: box,
            slug: slug,
            email: email,
            shareLink: shareLink
          }
        });
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const tier = getPriceTier();

  return (
    <form onSubmit={handlePayment}>
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
                    required
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
                <Label>Card Information</Label>
                <div className="mt-2 p-3 border rounded-md">
                  <CardElement 
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {showCancelAlert && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Payment was canceled. No charge was made to your card. You can try again when ready.
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isProcessing || !stripe}
            variant="hero"
            size="lg"
            className="w-full text-lg py-6"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Complete Purchase ${getPrice()}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Stripe. Your payment information is encrypted and secure.
          </p>
        </div>
      </div>
    </form>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const box = location.state?.box as GiftBox;
  const [email, setEmail] = useState("");

  if (!box) {
    navigate('/builder');
    return null;
  }

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
        <Elements stripe={stripePromise}>
          <CheckoutForm box={box} email={email} setEmail={setEmail} />
        </Elements>
      </div>
    </div>
  );
};

export default Checkout;