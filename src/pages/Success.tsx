import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, 
  Check, 
  Copy, 
  Download, 
  Share2, 
  Home,
  QrCode,
  Mail,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateQRCode } from "@/utils/qrCode";
import { supabase } from "@/integrations/supabase/client";

interface SuccessData {
  box: any;
  slug: string;
  email: string;
  shareLink: string;
}

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const data = location.state as SuccessData;
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle Stripe payment completion
  useEffect(() => {
    const handleStripeReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      // Check if this is a return from Stripe and we have pending data
      if (sessionId) {
        const pendingData = sessionStorage.getItem('pendingGiftBox');
        if (pendingData) {
          setIsProcessing(true);
          try {
            const { box, email } = JSON.parse(pendingData);
            
            // Clear pending data
            sessionStorage.removeItem('pendingGiftBox');
            
            // Generate unique slug from title
            const { data: slugData, error: slugError } = await supabase
              .rpc('generate_unique_slug', { title_input: box.title });
            
            if (slugError) throw slugError;
            const slug = slugData;

            // Convert cards to JSONB format for database
            const cardsData = box.cards.map((card: any) => ({
              id: card.id,
              message: card.message,
              image_url: card.image_url || null,
              audio_url: card.audio_url || null,
              unlock_delay: card.unlockDelay || 0
            }));

            // Save gift to Supabase
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
                is_public: true // Mark as public for sharing
              })
              .select()
              .single();

            if (giftError) throw giftError;

            const shareLink = `${window.location.origin}/gift/${slug}`;
            
            // Update location state with the created gift data and clear URL
            window.history.replaceState({}, document.title, '/success');
            navigate('/success', {
              state: {
                box: box,
                slug: slug,
                email: email,
                shareLink: shareLink
              },
              replace: true
            });
            
          } catch (error) {
            console.error('Gift creation error:', error);
            toast({
              title: "Error creating gift box",
              description: "Your payment was successful, but there was an issue creating your gift box. Please contact support.",
              variant: "destructive",
            });
            navigate('/');
          } finally {
            setIsProcessing(false);
          }
        }
        return;
      }
    };

    handleStripeReturn();
  }, [navigate, toast]);

  // Generate QR code when data is available
  useEffect(() => {
    if (!data?.shareLink) return;
    
    const generateQR = async () => {
      try {
        const qrDataUrl = await generateQRCode(data.shareLink);
        setQrCodeDataUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };
    
    generateQR();
  }, [data]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8 bg-gradient-card border-0 shadow-elegant">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Creating your gift box...</h2>
            <p className="text-muted-foreground">Payment successful! Setting up your beautiful gift box.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!data) {
    navigate('/');
    return null;
  }

  const { box, slug, email, shareLink } = data;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied!",
      description: "The gift box link has been copied to your clipboard.",
    });
  };

  const downloadQR = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `gift-box-${slug}-qr.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code Downloaded",
      description: "QR code saved to your downloads folder.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Success Header */}
        <div className="text-center mb-8 animate-bounce-in">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 animate-glow-pulse">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Your Gift Box is Ready! 🎉
          </h1>
          <p className="text-xl text-muted-foreground">
            "{box.title}" has been created successfully
          </p>
        </div>

        {/* Box Details */}
        <Card className="p-6 mb-6 bg-gradient-card border-0 shadow-elegant animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Gift Box Details</h2>
            <Badge variant="secondary" className="bg-gradient-primary text-white">
              {slug}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Gift className="w-4 h-4 text-primary" />
              <span>{box.cards.length} cards</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-primary" />
              <span>Sent to {email}</span>
            </div>
          </div>
        </Card>

        {/* Share Options */}
        <Card className="p-6 mb-6 bg-gradient-card border-0 shadow-card animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">Share Your Gift Box</h2>
          
          <div className="space-y-6">
            {/* QR Code Display */}
            {qrCodeDataUrl && (
              <div className="text-center">
                <label className="text-sm font-medium mb-2 block">QR Code</label>
                <div className="bg-white p-4 rounded-lg inline-block shadow-inner">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Gift Box QR Code" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Scan with any QR code reader to open the gift box
                </p>
              </div>
            )}

            {/* Share Link */}
            <div>
              <label className="text-sm font-medium mb-2 block">Gift Box Link</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                  {shareLink}
                </div>
                <Button onClick={copyLink} variant="outline" size="sm">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={downloadQR} 
                variant="outline" 
                className="w-full"
                disabled={!qrCodeDataUrl}
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR Code
              </Button>
              <Button onClick={copyLink} variant="outline" className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share Link
              </Button>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 mb-6 bg-gradient-card border-0 shadow-card">
          <h2 className="text-lg font-semibold mb-4">What's Next?</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Share the link or QR code</p>
                <p className="text-muted-foreground">Send it via text, email, or social media</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Recipients open their gift</p>
                <p className="text-muted-foreground">They'll see the cards unlock one by one</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Keep the magic alive</p>
                <p className="text-muted-foreground">The link stays active forever - bookmark it!</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate('/builder')}
            variant="hero" 
            className="flex-1"
          >
            <Gift className="w-4 h-4 mr-2" />
            Create Another Box
          </Button>
          <Button 
            onClick={() => navigate('/')}
            variant="outline" 
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Email Confirmation */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            📧 A confirmation email with your gift box details has been sent to <strong>{email}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Success;