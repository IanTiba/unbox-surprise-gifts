import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Gift, 
  Plus, 
  Trash2, 
  Image, 
  Mic, 
  Clock, 
  Sparkles, 
  Music,
  ArrowLeft,
  Eye,
  X,
  Play,
  Square,
  Volume2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface GiftCard {
  id: string;
  message: string;
  image?: File;
  imagePreview?: string;
  audio?: Blob;
  audioUrl?: string;
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

const BoxBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [recordingCardId, setRecordingCardId] = useState<string | null>(null);
  
  const [box, setBox] = useState<GiftBox>({
    title: "",
    cards: [{ id: "1", message: "" }],
    theme: "purple-pink",
    hasConfetti: false,
    hasBackgroundMusic: false,
    emoji: "🎁",
  });

  const addCard = () => {
    if (box.cards.length < 7) {
      const newCard: GiftCard = {
        id: Date.now().toString(),
        message: "",
      };
      setBox({ ...box, cards: [...box.cards, newCard] });
    }
  };

  const removeCard = (cardId: string) => {
    if (box.cards.length > 1) {
      setBox({
        ...box,
        cards: box.cards.filter(card => card.id !== cardId),
      });
    }
  };

  const updateCard = (cardId: string, field: keyof GiftCard, value: any) => {
    setBox({
      ...box,
      cards: box.cards.map(card =>
        card.id === cardId ? { ...card, [field]: value } : card
      ),
    });
  };

  const updateBox = (field: keyof GiftBox, value: any) => {
    setBox({ ...box, [field]: value });
  };

  // Image Upload Functions
  const handleImageUpload = (cardId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please select an image smaller than 5MB.",
            variant: "destructive",
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const imagePreview = e.target?.result as string;
          updateCard(cardId, 'image', file);
          updateCard(cardId, 'imagePreview', imagePreview);
        };
        reader.readAsDataURL(file);
        
        toast({
          title: "Image uploaded",
          description: "Your image has been added to the card.",
        });
      }
    };
    input.click();
  };

  const removeImage = (cardId: string) => {
    updateCard(cardId, 'image', undefined);
    updateCard(cardId, 'imagePreview', undefined);
  };

  // Audio Recording Functions
  const startRecording = async (cardId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        updateCard(cardId, 'audio', audioBlob);
        updateCard(cardId, 'audioUrl', audioUrl);
        
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Recording saved",
          description: "Your audio message has been recorded.",
        });
      };

      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(cardId);
      setRecordingCardId(cardId);
      mediaRecorder.start();

      toast({
        title: "Recording started",
        description: "Speak your message now...",
      });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(null);
      setRecordingCardId(null);
    }
  };

  const removeAudio = (cardId: string) => {
    const card = box.cards.find(c => c.id === cardId);
    if (card?.audioUrl) {
      URL.revokeObjectURL(card.audioUrl);
    }
    updateCard(cardId, 'audio', undefined);
    updateCard(cardId, 'audioUrl', undefined);
  };

  const handlePreviewAndCheckout = () => {
    // Navigate to checkout with box data
    navigate('/checkout', { state: { box } });
  };

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
    if (price === 9.99) return "Time Capsule";
    if (price === 7.99) return "Deluxe";
    return "Standard";
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="px-6 py-4 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center space-x-2">
            <Gift className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Box Builder</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{getPriceTier()}</p>
            <p className="text-lg font-bold text-primary">${getPrice()}</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Builder Form */}
          <div className="space-y-6">
            {/* Box Title */}
            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-primary" />
                  Gift Box Details
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="title">Box Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., To Maria, Happy Birthday!"
                    value={box.title}
                    onChange={(e) => updateBox('title', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Cards */}
            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Cards ({box.cards.length}/7)
                  </h2>
                  <Button
                    onClick={addCard}
                    disabled={box.cards.length >= 7}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Card
                  </Button>
                </div>

                <div className="space-y-4">
                  {box.cards.map((card, index) => (
                    <div key={card.id} className="p-4 border border-border rounded-lg bg-background">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">Card {index + 1}</h3>
                        {box.cards.length > 1 && (
                          <Button
                            onClick={() => removeCard(card.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label>Message *</Label>
                          <Textarea
                            placeholder="Write your heartfelt message..."
                            value={card.message}
                            onChange={(e) => updateCard(card.id, 'message', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm text-muted-foreground">Image (optional)</Label>
                            <div className="mt-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleImageUpload(card.id)}
                                >
                                  <Image className="w-4 h-4 mr-2" />
                                  Upload
                                </Button>
                                {card.image && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeImage(card.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              {card.imagePreview && (
                                <img 
                                  src={card.imagePreview} 
                                  alt="Preview" 
                                  className="w-16 h-16 object-cover rounded-lg border border-border"
                                />
                              )}
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm text-muted-foreground">Audio (optional)</Label>
                            <div className="mt-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                {isRecording === card.id ? (
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={stopRecording}
                                  >
                                    <Square className="w-4 h-4 mr-2" />
                                    Stop
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => startRecording(card.id)}
                                  >
                                    <Mic className="w-4 h-4 mr-2" />
                                    Record
                                  </Button>
                                )}
                                {card.audio && !isRecording && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAudio(card.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              {card.audioUrl && (
                                <audio controls className="w-full h-8">
                                  <source src={card.audioUrl} type="audio/wav" />
                                </audio>
                              )}
                              {isRecording === card.id && (
                                <div className="flex items-center space-x-2 text-red-500">
                                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                  <span className="text-xs">Recording...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Unlock Delay (optional)
                          </Label>
                          <div className="mt-1 flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="Days"
                              min="0"
                              max="30"
                              className="w-20"
                              value={card.unlockDelay || ''}
                              onChange={(e) => updateCard(card.id, 'unlockDelay', parseInt(e.target.value) || 0)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {card.unlockDelay ? `Unlocks in ${card.unlockDelay} day(s)` : 'Unlocks immediately'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Customization */}
            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Customization</h2>
                
                <div className="space-y-4">
                <div>
                  <Label>Box Icon</Label>
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {['🎁', '🎉', '💝', '🎂', '🎊', '💐', '🌟', '💎', '🏆', '🎈', '🍰', '💌'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => updateBox('emoji', emoji)}
                        className={`h-12 w-12 rounded-lg border-2 transition-all text-2xl hover:scale-110 ${
                          box.emoji === emoji ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Visual Theme</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {['purple-pink', 'blue-teal', 'warm-sunset'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => updateBox('theme', theme)}
                        className={`h-12 rounded-lg border-2 transition-all ${
                          box.theme === theme ? 'border-primary' : 'border-border'
                        }`}
                        style={{
                          background: theme === 'purple-pink' 
                            ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                            : theme === 'blue-teal'
                            ? 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                            : 'linear-gradient(135deg, #f97316, #eab308)'
                        }}
                      />
                    ))}
                  </div>
                </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <Label>Confetti Animation</Label>
                      </div>
                      <Switch
                        checked={box.hasConfetti}
                        onCheckedChange={(checked) => updateBox('hasConfetti', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Music className="w-4 h-4 text-primary" />
                        <Label>Background Music</Label>
                      </div>
                      <Switch
                        checked={box.hasBackgroundMusic}
                        onCheckedChange={(checked) => updateBox('hasBackgroundMusic', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Button
              onClick={handlePreviewAndCheckout}
              variant="hero"
              size="lg"
              className="w-full text-lg py-6"
              disabled={!box.title.trim() || box.cards.some(card => !card.message.trim())}
            >
              <Eye className="w-5 h-5 mr-2" />
              Preview & Checkout (${getPrice()})
            </Button>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-8">
            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <h2 className="text-xl font-semibold mb-4 text-center">Live Preview</h2>
              
              {/* Mobile Mockup */}
              <div className="mx-auto w-64 h-96 bg-gray-900 rounded-3xl p-2 shadow-elegant">
                <div 
                  className="w-full h-full rounded-2xl overflow-hidden relative"
                  style={{
                    background: box.theme === 'purple-pink' 
                      ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                      : box.theme === 'blue-teal'
                      ? 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                      : 'linear-gradient(135deg, #f97316, #eab308)'
                  }}
                >
                  <div className="p-6 text-white text-center">
                    <div className="text-6xl mb-4">{box.emoji}</div>
                    <h3 className="text-lg font-bold mb-2">
                      {box.title || 'Your Gift Box'}
                    </h3>
                    <p className="text-sm opacity-80 mb-6">
                      {box.cards.length} surprise{box.cards.length !== 1 ? 's' : ''} waiting
                    </p>
                    
                    <div className="space-y-2">
                      {box.cards.slice(0, 3).map((card, index) => (
                        <div
                          key={card.id}
                          className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-left"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Card {index + 1}
                            </span>
                            <div className="flex items-center space-x-1">
                              {card.image && (
                                <Image className="w-3 h-3 text-white/80" />
                              )}
                              {card.audio && (
                                <Volume2 className="w-3 h-3 text-white/80" />
                              )}
                              {card.unlockDelay && card.unlockDelay > 0 && (
                                <Clock className="w-3 h-3 text-white/80" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs opacity-80 truncate">
                            {card.message || 'Your message here...'}
                          </p>
                          {card.imagePreview && (
                            <div className="mt-2">
                              <img 
                                src={card.imagePreview} 
                                alt="Card preview" 
                                className="w-full h-16 object-cover rounded opacity-90"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {box.cards.length > 3 && (
                        <div className="text-xs opacity-60 mt-2">
                          +{box.cards.length - 3} more cards
                        </div>
                      )}
                    </div>

                    {(box.hasConfetti || box.hasBackgroundMusic) && (
                      <div className="flex items-center justify-center space-x-3 mt-4 pt-4 border-t border-white/20">
                        {box.hasConfetti && (
                          <div className="flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span className="text-xs">Confetti</span>
                          </div>
                        )}
                        {box.hasBackgroundMusic && (
                          <div className="flex items-center space-x-1">
                            <Music className="w-3 h-3" />
                            <span className="text-xs">Music</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  This is how recipients will see your gift box
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoxBuilder;