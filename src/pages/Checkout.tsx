import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, 
  ArrowLeft, 
  Check, 
  CreditCard, 
  Sparkles, 
  Music, 
  Clock,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GiftCard {
  id: string;
  message: string;
  image?: File;
  audio?: File;
  unlockDelay?: number;
}

interface GiftBox {
  title: string;
  cards: GiftCard[];
  theme: string;
  hasConfetti: boolean;
  hasBackgroundMusic: boolean;
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const box = location.state?.box as GiftBox;
  
  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const boxId = Math.random().toString(36).substring(2, 8);
      navigate('/success', { 
        state: { 
          box, 
          boxId, 
          email,
          shareLink: `https://unboxme.app/${boxId}`
        } 
      });
    }, 2000);
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
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      placeholder="123"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Name on Card</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
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