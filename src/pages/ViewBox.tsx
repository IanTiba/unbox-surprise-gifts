import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Lock, 
  Clock,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Share2,
  Heart,
  Sparkles,
  Gift,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GiftCard {
  id: string;
  message: string;
  image_url?: string;
  audio_url?: string;
  unlockDelay: number;
}

interface GiftBox {
  id: string;
  title: string;
  cards: GiftCard[];
  theme: string;
  hasConfetti: boolean;
  hasBackgroundMusic: boolean;
  emoji: string;
  createdAt: Date;
}

const ViewBox = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [box, setBox] = useState<GiftBox | null>(null);
  const [unlockedCards, setUnlockedCards] = useState<Set<number>>(new Set([0]));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cardsAnimation, setCardsAnimation] = useState(false);

  // Load box data from Supabase
  useEffect(() => {
    const loadGift = async () => {
      if (!slug) {
        navigate('/');
        return;
      }

      try {
        const { data: gift, error } = await supabase
          .from('gifts')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error) {
          console.error('Error loading gift:', error);
          navigate('/');
          return;
        }

        if (!gift) {
          navigate('/');
          return;
        }

        // Convert database format to component format
        const boxData: GiftBox = {
          id: gift.id,
          title: gift.title,
          emoji: gift.emoji,
          theme: gift.theme,
          hasConfetti: gift.has_confetti,
          hasBackgroundMusic: gift.has_background_music,
          cards: Array.isArray(gift.cards) ? gift.cards.map((card: any) => ({
            id: card.id || card.index?.toString() || Date.now().toString(),
            message: card.message,
            unlockDelay: card.unlock_delay || 0,
            image_url: card.image_url,
            audio_url: card.audio_url
          })) : [],
          createdAt: new Date(gift.created_at)
        };

        setBox(boxData);
        setIsLoading(false);

        // Trigger entrance animation
        setTimeout(() => {
          setCardsAnimation(true);
        }, 500);
      } catch (error) {
        console.error('Error loading gift:', error);
        navigate('/');
      }
    };

    loadGift();
  }, [slug, navigate]);

  // Load the box and trigger confetti
  useEffect(() => {
    if (box?.hasConfetti && !confettiTriggered) {
      setTimeout(() => {
        setConfettiTriggered(true);
        toast({
          title: "🎉 Magical Surprise!",
          description: "Your beautiful gift box awaits exploration!",
        });
      }, 1500);
    }
  }, [box, confettiTriggered, toast]);

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'purple-pink':
        return {
          primary: 'from-purple-500 via-pink-500 to-rose-400',
          secondary: 'from-purple-100 to-pink-100',
          accent: 'bg-purple-500',
          glow: 'shadow-purple-500/30'
        };
      case 'blue-teal':
        return {
          primary: 'from-blue-500 via-cyan-500 to-teal-400',
          secondary: 'from-blue-100 to-teal-100',
          accent: 'bg-blue-500',
          glow: 'shadow-blue-500/30'
        };
      case 'warm-sunset':
        return {
          primary: 'from-orange-500 via-amber-500 to-yellow-400',
          secondary: 'from-orange-100 to-yellow-100',
          accent: 'bg-orange-500',
          glow: 'shadow-orange-500/30'
        };
      default:
        return {
          primary: 'from-purple-500 via-pink-500 to-rose-400',
          secondary: 'from-purple-100 to-pink-100',
          accent: 'bg-purple-500',
          glow: 'shadow-purple-500/30'
        };
    }
  };

  const canUnlockCard = (cardIndex: number) => {
    if (cardIndex === 0) return true;
    const card = box?.cards[cardIndex];
    if (!card || !box) return false;
    
    // Convert days to hours (unlockDelay is in days from BoxBuilder)
    const hoursToWait = card.unlockDelay * 24;
    const createdTime = box.createdAt.getTime();
    const currentTime = Date.now();
    const hoursPassed = (currentTime - createdTime) / (1000 * 60 * 60);
    
    return hoursPassed >= hoursToWait;
  };

  const getRemainingTime = (cardIndex: number) => {
    const card = box?.cards[cardIndex];
    if (!card || !box) return "";
    
    const hoursToWait = card.unlockDelay * 24;
    const createdTime = box.createdAt.getTime();
    const currentTime = Date.now();
    const hoursPassed = (currentTime - createdTime) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, hoursToWait - hoursPassed);
    
    if (hoursRemaining <= 0) return "";
    
    const daysRemaining = Math.floor(hoursRemaining / 24);
    const hoursOnly = Math.floor(hoursRemaining % 24);
    
    if (daysRemaining > 0) {
      if (hoursOnly > 0) {
        return `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}, ${hoursOnly} hour${hoursOnly > 1 ? 's' : ''} remaining`;
      }
      return `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining`;
    }
    
    return `${hoursOnly} hour${hoursOnly > 1 ? 's' : ''} remaining`;
  };

  const unlockCard = (cardIndex: number) => {
    if (canUnlockCard(cardIndex)) {
      setUnlockedCards(prev => new Set([...prev, cardIndex]));
      toast({
        title: "✨ Card Unlocked!",
        description: `Card ${cardIndex + 1} reveals its magical secret!`,
      });
    }
  };

  const shareBox = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast({
      title: "🔗 Link Copied!",
      description: "Share this magical gift box with anyone!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <Gift className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">Opening your magical gift box...</p>
            <p className="text-sm text-gray-500">Preparing something special</p>
          </div>
        </div>
      </div>
    );
  }

  if (!box) return null;

  const themeColors = getThemeColors(box.theme);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 relative overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-300/10 to-rose-300/10 rounded-full blur-3xl"></div>
      </div>

      {/* Confetti Animation */}
      {confettiTriggered && box.hasConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 100}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
                animationIterationCount: 'infinite'
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-md mx-auto px-6 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative mb-6">
            <div className="text-8xl mb-4 animate-bounce-in filter drop-shadow-lg">{box.emoji}</div>
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-xl animate-glow-pulse"></div>
          </div>
          
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            {box.title}
          </h1>
          
          <div className="flex items-center justify-center space-x-3">
            <Badge className={`${themeColors.accent} text-white px-4 py-2 shadow-lg`}>
              <Gift className="w-4 h-4 mr-2" />
              {box.cards.length} Special Cards
            </Badge>
            <Badge variant="outline" className="px-4 py-2 bg-white/50 backdrop-blur-sm border-purple-200">
              <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
              Gift Box
            </Badge>
          </div>
        </div>

        {/* All Cards Displayed Vertically */}
        <div className={`space-y-6 mb-8 ${cardsAnimation ? 'animate-fade-in' : 'opacity-50'}`}>
          {box.cards.map((card, index) => {
            const isCardUnlocked = unlockedCards.has(index);
            
            return (
              <Card key={card.id} className={`border-0 shadow-2xl overflow-hidden bg-gradient-to-br ${themeColors.primary} ${themeColors.glow} shadow-xl relative`}>
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-white/20 rounded-full"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-white/15 rounded-full"></div>
                
                <div className="relative p-8 text-white">
                  {isCardUnlocked ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2">
                          Card {index + 1} of {box.cards.length}
                        </Badge>
                        {card.audio_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="text-white hover:bg-white/20 backdrop-blur-sm"
                          >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </Button>
                        )}
                      </div>
                       
                      {card.image_url && (
                        <div className="rounded-xl overflow-hidden shadow-lg bg-white/10 backdrop-blur-sm p-2">
                          <img 
                            src={card.image_url} 
                            alt="Card attachment" 
                            className="w-full h-auto object-cover rounded-lg"
                          />
                        </div>
                      )}
                      
                       {card.message && card.message.trim() && (
                         <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                           <p className="text-lg leading-relaxed font-medium text-white/95">
                             {card.message}
                           </p>
                         </div>
                       )}
                      
                      {card.audio_url && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 bg-white/15 backdrop-blur-sm rounded-xl p-4">
                            <Volume2 className="w-5 h-5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">Audio Message</p>
                              <p className="text-sm text-white/80">Tap play to listen</p>
                            </div>
                          </div>
                          <audio controls className="w-full rounded-lg">
                            <source src={card.audio_url} type="audio/wav" />
                          </audio>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mb-6">
                        <div className="relative inline-block">
                          <Lock className="w-16 h-16 mx-auto mb-4 opacity-60" />
                          <div className="absolute -inset-2 bg-white/10 rounded-full blur-lg"></div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-3">Locked with Love</h3>
                      <p className="text-white/80 mb-6 text-lg">
                        {canUnlockCard(index) 
                          ? "This special moment is ready to be revealed!"
                          : getRemainingTime(index) || `This card unlocks in ${card.unlockDelay} day${card.unlockDelay > 1 ? 's' : ''}`
                        }
                      </p>
                      
                      {canUnlockCard(index) && (
                        <Button 
                          onClick={() => unlockCard(index)}
                          className="bg-white text-gray-800 hover:bg-white/90 shadow-lg px-8 py-3 text-lg font-medium"
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          Unlock Magic
                        </Button>
                      )}
                      
                      {!canUnlockCard(index) && (
                        <div className="flex items-center justify-center space-x-2 text-white/60 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                          <Clock className="w-5 h-5" />
                          <span className="font-medium">Patience makes it sweeter...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Actions */}
        <div className="space-y-3">
          <Button 
            onClick={shareBox}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl py-3 text-base font-medium"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share This Magical Experience
          </Button>
          
          <Button 
            onClick={() => navigate('/')}
            variant="outline" 
            className="w-full bg-white/80 backdrop-blur-sm border-purple-200 hover:bg-white shadow-lg py-2"
          >
            <Gift className="w-4 h-4 mr-2" />
            Create Your Own Gift Box
          </Button>
        </div>

        {/* Enhanced Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-gray-700">Made with love using Unbox Me</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBox;