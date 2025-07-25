import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GiftCard {
  id: string;
  message: string;
  image?: File | string;
  audio?: File | string;
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
  const { boxId } = useParams<{ boxId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [box, setBox] = useState<GiftBox | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [unlockedCards, setUnlockedCards] = useState<Set<number>>(new Set([0]));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  // Load box data from localStorage or database
  useEffect(() => {
    console.log('ViewBox: boxId is:', boxId);
    console.log('ViewBox: Looking for key:', `box_${boxId}`);
    
    // Try to get box data from localStorage first
    const savedBox = localStorage.getItem(`box_${boxId}`);
    console.log('ViewBox: savedBox from localStorage:', savedBox);
    
    if (savedBox) {
      try {
        const parsedBox = JSON.parse(savedBox);
        console.log('ViewBox: parsed box data:', parsedBox);
        // Convert createdAt back to Date object
        parsedBox.createdAt = new Date(parsedBox.createdAt);
        setBox(parsedBox);
      } catch (error) {
        console.error('Error parsing saved box data:', error);
        // Fallback to demo box if parsing fails
        setBox(createDemoBox());
      }
    } else {
      console.log('ViewBox: No saved data found, using demo box');
      // If no saved data, create a demo box
      setBox(createDemoBox());
    }
  }, [boxId]);

  // Create demo box for testing
  const createDemoBox = (): GiftBox => ({
    id: boxId || "demo",
    title: "Demo Gift Box 🎁",
    emoji: "🎁", 
    theme: "purple-pink",
    hasConfetti: true,
    hasBackgroundMusic: false,
    createdAt: new Date(),
    cards: [
      {
        id: "1",
        message: "Welcome to your demo gift box! This is what your recipients will see.",
        unlockDelay: 0
      },
      {
        id: "2", 
        message: "Cards can be unlocked after a delay that you set when creating the box.",
        unlockDelay: 24
      }
    ]
  });

  // Load the box and trigger confetti
  useEffect(() => {
    if (box?.hasConfetti && !confettiTriggered) {
      setTimeout(() => {
        setConfettiTriggered(true);
        toast({
          title: "🎉 Surprise!",
          description: "Your gift box is ready to explore!",
        });
      }, 1000);
    }
  }, [box, confettiTriggered, toast]);

  const getThemeGradient = (theme: string) => {
    switch (theme) {
      case 'purple-pink':
        return 'linear-gradient(135deg, #a855f7, #ec4899)';
      case 'blue-teal':
        return 'linear-gradient(135deg, #3b82f6, #06b6d4)';
      case 'warm-sunset':
        return 'linear-gradient(135deg, #f97316, #eab308)';
      default:
        return 'linear-gradient(135deg, #a855f7, #ec4899)';
    }
  };

  const canUnlockCard = (cardIndex: number) => {
    if (cardIndex === 0) return true;
    const card = box?.cards[cardIndex];
    if (!card || !box) return false;
    
    const hoursToWait = card.unlockDelay;
    const createdTime = box.createdAt.getTime();
    const currentTime = Date.now();
    const hoursPassed = (currentTime - createdTime) / (1000 * 60 * 60);
    
    return hoursPassed >= hoursToWait;
  };

  const unlockCard = (cardIndex: number) => {
    if (canUnlockCard(cardIndex)) {
      setUnlockedCards(prev => new Set([...prev, cardIndex]));
      setCurrentCardIndex(cardIndex);
      toast({
        title: "Card Unlocked! 🔓",
        description: `Card ${cardIndex + 1} is now available to view.`,
      });
    }
  };

  const shareBox = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast({
      title: "Link copied!",
      description: "Gift box link has been copied to your clipboard.",
    });
  };

  if (!box) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading your gift box...</p>
        </div>
      </div>
    );
  }

  const currentCard = box.cards[currentCardIndex];
  const isCardUnlocked = unlockedCards.has(currentCardIndex);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Confetti Effect */}
      {confettiTriggered && box.hasConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            >
              🎉
            </div>
          ))}
        </div>
      )}

      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{box.emoji}</div>
          <h1 className="text-2xl font-bold mb-2">{box.title}</h1>
          <Badge variant="secondary" className="bg-gradient-primary text-white">
            {box.cards.length} Cards
          </Badge>
        </div>

        {/* Main Card */}
        <Card 
          className="mb-6 border-0 shadow-elegant overflow-hidden"
          style={{ background: getThemeGradient(box.theme) }}
        >
          <div className="p-6 text-white">
            {isCardUnlocked ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    Card {currentCardIndex + 1}
                  </Badge>
                  {currentCard.audio && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
                
                {currentCard.image && typeof currentCard.image === 'string' && (
                  <div className="rounded-lg overflow-hidden mb-4">
                    <img 
                      src={currentCard.image} 
                      alt="Card attachment" 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                
                <p className="text-lg leading-relaxed">{currentCard.message}</p>
                
                {currentCard.audio && (
                  <div className="flex items-center space-x-2 bg-white/20 rounded-lg p-3">
                    <Volume2 className="w-4 h-4" />
                    <span className="text-sm">Audio message available</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lock className="w-12 h-12 mx-auto mb-4 opacity-60" />
                <h3 className="text-lg font-semibold mb-2">This Card is Locked</h3>
                <p className="text-white/80 mb-4">
                  {canUnlockCard(currentCardIndex) 
                    ? "Tap to unlock this card!"
                    : `Wait ${currentCard.unlockDelay} hours to unlock`
                  }
                </p>
                {canUnlockCard(currentCardIndex) && (
                  <Button 
                    onClick={() => unlockCard(currentCardIndex)}
                    variant="secondary"
                    className="bg-white text-gray-800 hover:bg-white/90"
                  >
                    🔓 Unlock Card
                  </Button>
                )}
                {!canUnlockCard(currentCardIndex) && (
                  <div className="flex items-center justify-center space-x-2 text-white/60">
                    <Clock className="w-4 h-4" />
                    <span>Coming soon...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
            disabled={currentCardIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {box.cards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCardIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentCardIndex 
                    ? 'bg-primary' 
                    : unlockedCards.has(index)
                    ? 'bg-primary/50'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentCardIndex(Math.min(box.cards.length - 1, currentCardIndex + 1))}
            disabled={currentCardIndex === box.cards.length - 1}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={shareBox}
            variant="hero" 
            className="w-full"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share This Gift Box
          </Button>
          
          <Button 
            onClick={() => navigate('/')}
            variant="outline" 
            className="w-full"
          >
            Create Your Own Gift Box
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Made with 💝 using Unbox Me</p>
        </div>
      </div>
    </div>
  );
};

export default ViewBox;