import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, Mic, MicOff, Play, Pause, ArrowLeft, Gift, Heart, Sparkles, Volume2, Clock, Lock, ArrowRight, Loader2 } from "lucide-react";
interface GiftCard {
  id: string;
  message: string;
  image?: File;
  imagePreview?: string;
  image_url?: string;
  audio?: Blob;
  audioPreview?: string;
  audio_url?: string;
  unlockDelay: number;
}
interface GiftBox {
  title: string;
  cards: GiftCard[];
  theme: string;
  hasConfetti: boolean;
  hasBackgroundMusic: boolean;
  emoji: string;
  spotifyEmbed?: string;
}
const BoxBuilder = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [box, setBox] = useState<GiftBox>({
    title: "",
    cards: [],
    theme: "purple-pink",
    hasConfetti: false,
    hasBackgroundMusic: false,
    emoji: "🎁",
    spotifyEmbed: ""
  });
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [uploadingAudio, setUploadingAudio] = useState<Set<string>>(new Set());
  const addCard = () => {
    const newCard: GiftCard = {
      id: Date.now().toString(),
      message: "",
      unlockDelay: 0
    };
    setBox(prev => ({
      ...prev,
      cards: [...prev.cards, newCard]
    }));
  };
  const removeCard = (id: string) => {
    setBox(prev => ({
      ...prev,
      cards: prev.cards.filter(card => card.id !== id)
    }));
  };
  const updateCard = (id: string, field: keyof GiftCard, value: any) => {
    setBox(prev => ({
      ...prev,
      cards: prev.cards.map(card => card.id === id ? {
        ...card,
        [field]: value
      } : card)
    }));
  };
  const updateBox = (field: keyof GiftBox, value: any) => {
    setBox(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleImageUpload = async (cardId: string, file: File) => {
    if (!file) return;
    setUploadingImages(prev => new Set([...prev, cardId]));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${cardId}-${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;
      const {
        data,
        error
      } = await supabase.storage.from('gift-media').upload(filePath, file);
      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('gift-media').getPublicUrl(filePath);
      updateCard(cardId, 'image_url', publicUrl);
      updateCard(cardId, 'imagePreview', URL.createObjectURL(file));
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully!"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Something went wrong while uploading your image.",
        variant: "destructive"
      });
    } finally {
      setUploadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    }
  };
  const removeImage = (cardId: string) => {
    updateCard(cardId, 'image', undefined);
    updateCard(cardId, 'imagePreview', undefined);
    updateCard(cardId, 'image_url', undefined);
  };
  const startRecording = async (cardId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, {
          type: 'audio/wav'
        });
        updateCard(cardId, 'audio', audioBlob);
        updateCard(cardId, 'audioPreview', URL.createObjectURL(audioBlob));
        setAudioChunks([]);

        // Upload audio to Supabase
        uploadAudio(cardId, audioBlob);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(cardId);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setMediaRecorder(null);
      setIsRecording(null);
    }
  };
  const uploadAudio = async (cardId: string, audioBlob: Blob) => {
    setUploadingAudio(prev => new Set([...prev, cardId]));
    try {
      const fileName = `${cardId}-${Date.now()}.wav`;
      const filePath = `audio/${fileName}`;
      const {
        data,
        error
      } = await supabase.storage.from('gift-media').upload(filePath, audioBlob);
      if (error) {
        console.error('Audio upload error:', error);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('gift-media').getPublicUrl(filePath);
      updateCard(cardId, 'audio_url', publicUrl);
      toast({
        title: "Audio uploaded",
        description: "Your audio message has been uploaded successfully!"
      });
    } catch (error) {
      console.error('Audio upload error:', error);
      toast({
        title: "Upload failed",
        description: "Something went wrong while uploading your audio.",
        variant: "destructive"
      });
    } finally {
      setUploadingAudio(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    }
  };
  const removeAudio = (cardId: string) => {
    updateCard(cardId, 'audio', undefined);
    updateCard(cardId, 'audioPreview', undefined);
    updateCard(cardId, 'audio_url', undefined);
  };
  const uploadsPending = uploadingImages.size > 0 || uploadingAudio.size > 0;
  const handlePreviewAndCheckout = () => {
    if (uploadsPending) {
      toast({
        title: "Upload in progress",
        description: "Please wait for all uploads to finish.",
        variant: "destructive"
      });
      return;
    }
    navigate('/checkout', {
      state: {
        box
      }
    });
  };
  const getPrice = () => {
    const cardCount = box.cards.length;
    const hasAudio = box.cards.some(card => card.audio || card.audio_url);
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

  // Get theme colors function (matching ViewBox exactly)
  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'purple-pink':
        return {
          primary: 'from-purple-500 via-pink-500 to-rose-400',
          secondary: 'from-purple-100 to-pink-100',
          accent: 'bg-purple-500',
          glow: 'shadow-purple-500/30',
          ambient: {
            primary: 'from-purple-400/20 to-pink-400/20',
            secondary: 'from-blue-400/20 to-purple-400/20',
            tertiary: 'from-pink-300/10 to-rose-300/10'
          },
          text: 'from-purple-600 to-pink-600',
          button: 'text-purple-600 hover:bg-purple-100',
          dots: 'bg-purple-600',
          dotsInactive: 'bg-purple-200 hover:bg-purple-300',
          shareButton: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
          outlineButton: 'border-purple-200'
        };
      case 'blue-teal':
        return {
          primary: 'from-blue-500 via-cyan-500 to-teal-400',
          secondary: 'from-blue-100 to-teal-100',
          accent: 'bg-blue-500',
          glow: 'shadow-blue-500/30',
          ambient: {
            primary: 'from-blue-400/20 to-cyan-400/20',
            secondary: 'from-teal-400/20 to-blue-400/20',
            tertiary: 'from-cyan-300/10 to-teal-300/10'
          },
          text: 'from-blue-600 to-teal-600',
          button: 'text-blue-600 hover:bg-blue-100',
          dots: 'bg-blue-600',
          dotsInactive: 'bg-blue-200 hover:bg-blue-300',
          shareButton: 'from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700',
          outlineButton: 'border-blue-200'
        };
      case 'warm-sunset':
        return {
          primary: 'from-orange-500 via-amber-500 to-yellow-400',
          secondary: 'from-orange-100 to-yellow-100',
          accent: 'bg-orange-500',
          glow: 'shadow-orange-500/30',
          ambient: {
            primary: 'from-orange-400/20 to-amber-400/20',
            secondary: 'from-yellow-400/20 to-orange-400/20',
            tertiary: 'from-amber-300/10 to-yellow-300/10'
          },
          text: 'from-orange-600 to-amber-600',
          button: 'text-orange-600 hover:bg-orange-100',
          dots: 'bg-orange-600',
          dotsInactive: 'bg-orange-200 hover:bg-orange-300',
          shareButton: 'from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700',
          outlineButton: 'border-orange-200'
        };
      case 'emerald-green':
        return {
          primary: 'from-emerald-500 via-green-500 to-teal-400',
          secondary: 'from-emerald-100 to-green-100',
          accent: 'bg-emerald-500',
          glow: 'shadow-emerald-500/30',
          ambient: {
            primary: 'from-emerald-400/20 to-green-400/20',
            secondary: 'from-teal-400/20 to-emerald-400/20',
            tertiary: 'from-green-300/10 to-teal-300/10'
          },
          text: 'from-emerald-600 to-green-600',
          button: 'text-emerald-600 hover:bg-emerald-100',
          dots: 'bg-emerald-600',
          dotsInactive: 'bg-emerald-200 hover:bg-emerald-300',
          shareButton: 'from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700',
          outlineButton: 'border-emerald-200'
        };
      case 'elegant-black':
        return {
          primary: 'from-gray-800 via-gray-700 to-gray-600',
          secondary: 'from-gray-100 to-gray-200',
          accent: 'bg-gray-800',
          glow: 'shadow-gray-800/30',
          ambient: {
            primary: 'from-gray-600/20 to-gray-700/20',
            secondary: 'from-gray-500/20 to-gray-600/20',
            tertiary: 'from-gray-400/10 to-gray-500/10'
          },
          text: 'from-gray-800 to-gray-700',
          button: 'text-gray-800 hover:bg-gray-100',
          dots: 'bg-gray-800',
          dotsInactive: 'bg-gray-200 hover:bg-gray-300',
          shareButton: 'from-gray-800 to-gray-700 hover:from-gray-900 hover:to-gray-800',
          outlineButton: 'border-gray-200'
        };
      case 'romantic-red':
        return {
          primary: 'from-red-500 via-rose-500 to-pink-400',
          secondary: 'from-red-100 to-rose-100',
          accent: 'bg-red-500',
          glow: 'shadow-red-500/30',
          ambient: {
            primary: 'from-red-400/20 to-rose-400/20',
            secondary: 'from-pink-400/20 to-red-400/20',
            tertiary: 'from-rose-300/10 to-pink-300/10'
          },
          text: 'from-red-600 to-rose-600',
          button: 'text-red-600 hover:bg-red-100',
          dots: 'bg-red-600',
          dotsInactive: 'bg-red-200 hover:bg-red-300',
          shareButton: 'from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700',
          outlineButton: 'border-red-200'
        };
      default:
        return {
          primary: 'from-purple-500 via-pink-500 to-rose-400',
          secondary: 'from-purple-100 to-pink-100',
          accent: 'bg-purple-500',
          glow: 'shadow-purple-500/30',
          ambient: {
            primary: 'from-purple-400/20 to-pink-400/20',
            secondary: 'from-blue-400/20 to-purple-400/20',
            tertiary: 'from-pink-300/10 to-rose-300/10'
          },
          text: 'from-purple-600 to-pink-600',
          button: 'text-purple-600 hover:bg-purple-100',
          dots: 'bg-purple-600',
          dotsInactive: 'bg-purple-200 hover:bg-purple-300',
          shareButton: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
          outlineButton: 'border-purple-200'
        };
    }
  };
  const themeColors = getThemeColors(box.theme);
  const [currentPreviewCard, setCurrentPreviewCard] = useState(0);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  return <div className={`min-h-screen bg-gradient-to-br ${themeColors.secondary} relative overflow-hidden`}>
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br ${themeColors.ambient.primary} rounded-full blur-3xl`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br ${themeColors.ambient.secondary} rounded-full blur-3xl`}></div>
        <div className={`absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br ${themeColors.ambient.tertiary} rounded-full blur-3xl`}></div>
      </div>

      {/* Enhanced Header */}
      <header className="relative z-10 px-4 sm:px-6 py-4 sm:py-6 bg-white/80 backdrop-blur-lg border-b border-purple-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center hover:bg-purple-100/50 transition-all duration-300 self-start sm:self-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
          
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="relative">
              
            </div>
            
            <div className="flex flex-col items-center sm:items-end">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ${getPrice()}
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                {getPriceTier()}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6">
        {/* Responsive Grid Layout */}
        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Content */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Mobile Preview Toggle */}
            <div className="lg:hidden">
              <Button onClick={() => setShowMobilePreview(!showMobilePreview)} variant="outline" className="w-full mb-4 bg-white/80 backdrop-blur-sm">
                {showMobilePreview ? "Hide Preview" : "Show Preview"}
              </Button>
            </div>

            {/* Mobile Preview */}
            {showMobilePreview && <div className="lg:hidden mb-6">
                <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-purple-50/50 backdrop-blur-sm">
                  <div className="relative p-3 sm:p-4">
                    <div className="text-center mb-3">
                      <h2 className={`text-base sm:text-lg font-bold bg-gradient-to-r ${themeColors.text} bg-clip-text text-transparent mb-2`}>
                        Live Preview
                      </h2>
                      <p className="text-xs text-gray-600">See how recipients will experience your gift</p>
                    </div>
                    
                    {/* Mobile Preview Content */}
                    <div className={`rounded-xl overflow-hidden bg-gradient-to-br ${themeColors.secondary} p-3 sm:p-4 relative min-h-[350px] sm:min-h-[400px]`}>
                      {/* Ambient Background Elements */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className={`absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br ${themeColors.ambient.primary} rounded-full blur-xl opacity-60`}></div>
                        <div className={`absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-br ${themeColors.ambient.secondary} rounded-full blur-xl opacity-60`}></div>
                      </div>

                      {/* Confetti Animation */}
                      {box.hasConfetti && <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {[...Array(15)].map((_, i) => <div key={i} className={`absolute w-1 h-1 bg-gradient-to-r ${themeColors.primary} rounded-full opacity-80`} style={{
                      left: `${Math.random() * 100}%`,
                      animation: `confetti-fall ${2 + Math.random() * 2}s ${Math.random() * 2}s infinite linear`
                    }} />)}
                          <style>{`
                            @keyframes confetti-fall {
                              0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
                              100% { transform: translateY(400px) rotate(360deg); opacity: 0; }
                            }
                          `}</style>
                        </div>}

                      <div className="relative z-10">
                        {/* Header Section */}
                        <div className="text-center mb-4">
                          <div className="text-4xl mb-2 filter drop-shadow-lg">{box.emoji}</div>
                          <h1 className={`text-lg font-bold mb-2 leading-tight bg-gradient-to-r ${themeColors.text} bg-clip-text text-transparent`}>
                            {box.title || 'Your Gift Box'}
                          </h1>
                          <div className="flex justify-center">
                            <div className={`${themeColors.accent} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 shadow-lg`}>
                              <Gift className="w-3 h-3" />
                              <span>You Have {box.cards.length} Special Card{box.cards.length !== 1 ? "s" : ""}</span>
                            </div>
                          </div>
                        </div>

                        {/* Spotify Embed */}
                        {box.spotifyEmbed && <div className="mb-4">
                            <div dangerouslySetInnerHTML={{
                        __html: box.spotifyEmbed.replace(/utm_source=generator/g, 'utm_source=generator&autoplay=1&auto_play=true')
                      }} className="spotify-embed [&>iframe]:!h-[80px] [&>iframe]:!w-full [&>iframe]:rounded-lg" />
                          </div>}

                        {/* Card Navigation */}
                        {box.cards.length > 0 && <>
                            <div className="flex items-center justify-between mb-3">
                              <button onClick={() => setCurrentPreviewCard(Math.max(0, currentPreviewCard - 1))} disabled={currentPreviewCard === 0} className={`${themeColors.button} disabled:opacity-50 text-xs px-2 py-1 rounded-lg transition-all duration-200`}>
                                <ArrowLeft className="w-3 h-3 mr-1" />
                                Prev
                              </button>
                              
                              <div className="flex space-x-1">
                                {box.cards.map((_, index) => <button key={index} onClick={() => setCurrentPreviewCard(index)} className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentPreviewCard ? `${themeColors.dots} scale-110` : `${themeColors.dotsInactive}`}`} />)}
                              </div>
                              
                              <button onClick={() => setCurrentPreviewCard(Math.min(box.cards.length - 1, currentPreviewCard + 1))} disabled={currentPreviewCard === box.cards.length - 1} className={`${themeColors.button} disabled:opacity-50 text-xs px-2 py-1 rounded-lg transition-all duration-200`}>
                                Next
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </button>
                            </div>

                            {/* Single Card Display */}
                            <div className="mb-4">
                              {(() => {
                          const card = box.cards[currentPreviewCard];
                          if (!card) return null;
                          return <div className={`w-full rounded-xl overflow-hidden shadow-xl bg-gradient-to-br ${themeColors.primary} ${themeColors.glow} relative`}>
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/20 rounded-full"></div>
                                    <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-white/15 rounded-full"></div>
                                    
                                    <div className="p-3 flex flex-col text-white relative">
                                      {card.unlockDelay > 0 ? <div className="text-center py-4">
                                          <div className="mb-2">
                                            <div className="relative inline-block">
                                              <Lock className="w-6 h-6 mx-auto mb-1 opacity-60" />
                                              <div className="absolute -inset-1 bg-white/10 rounded-full blur-lg"></div>
                                            </div>
                                          </div>
                                          <h3 className="text-sm font-bold mb-1">Locked...</h3>
                                          <p className="text-white/80 text-xs">
                                            This card unlocks in {card.unlockDelay} day{card.unlockDelay > 1 ? 's' : ''}
                                          </p>
                                        </div> : <div className="relative space-y-2">
                                          <div className="flex items-center justify-between">
                                            <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                                              <span className="text-xs font-medium">Card {currentPreviewCard + 1} of {box.cards.length}</span>
                                            </div>
                                            {(card.audio || card.audio_url) && <div className="text-white/80 p-1">
                                                <Play className="w-3 h-3" />
                                              </div>}
                                          </div>
                                          
                                          {/* Image if available */}
                                           {(card.imagePreview || card.image_url) && <div className="rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm p-1">
                                               <img src={card.image_url || card.imagePreview} alt="Card preview" className="w-full rounded" />
                                             </div>}
                                          
                                          {/* Message */}
                                          {card.message && card.message.trim() && <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 flex-1">
                                              <p className="text-xs leading-relaxed text-white/95">
                                                {card.message}
                                              </p>
                                            </div>}
                                          
                                          {/* Audio indicator */}
                                          {(card.audio || card.audio_url) && <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-lg p-2">
                                              <Volume2 className="w-3 h-3" />
                                              <div>
                                                <p className="text-xs font-medium">Audio Message</p>
                                                <p className="text-xs text-white/80">Tap play to listen</p>
                                              </div>
                                            </div>}
                                        </div>}
                                    </div>
                                  </div>;
                        })()}
                            </div>
                          </>}

                        {/* Empty state when no cards */}
                        {box.cards.length === 0 && <div className="mb-4 text-center py-6">
                            <Gift className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500">Add your first card to see the preview</p>
                          </div>}

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <button className={`w-full bg-gradient-to-r ${themeColors.shareButton} text-white py-2 rounded-xl font-medium text-xs shadow-lg`}>
                            Share This Magical Experience
                          </button>
                          
                          <button className={`w-full bg-white/80 backdrop-blur-sm border ${themeColors.outlineButton} ${themeColors.button} py-2 rounded-xl font-medium text-xs`}>
                            Create Your Own Gift Box
                          </button>
                        </div>
                        
                        {/* Footer */}
                        <div className="text-center mt-3">
                          <div className="inline-flex items-center space-x-1 text-gray-600">
                            <Heart className="w-3 h-3 text-red-500 fill-current" />
                            <span className="text-xs">Made with love using My Hidden Gift</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>}

            {/* Box Configuration Card */}
            <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              
              <div className="relative p-4 sm:p-6 lg:p-8">
                <div className="text-center mb-4 sm:mb-6 lg:mb-8">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-3 lg:mb-4">
                    Create Your Gift Box
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
                    Design a magical experience with personalized cards, messages, and memories
                  </p>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium mb-3 block">Box Title</Label>
                    <Input id="title" placeholder="e.g., Happy Birthday Sarah!" value={box.title} onChange={e => updateBox('title', e.target.value)} className="bg-white/80 backdrop-blur-sm border-purple-200 focus:border-purple-400 transition-colors text-sm sm:text-base" />
                  </div>


                  <div>
                    <Label htmlFor="spotify" className="text-sm font-medium mb-3 block">Spotify Music (Optional)</Label>
                    <Textarea id="spotify" placeholder="Paste your Spotify link or embed code here..." value={box.spotifyEmbed || ''} onChange={e => {
                    const value = e.target.value;
                    // Check if it's a Spotify link and convert to embed
                    const spotifyLinkRegex = /https:\/\/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;
                    const match = value.match(spotifyLinkRegex);
                    if (match) {
                      const [, type, id] = match;
                      const embedCode = `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/${type}/${id}?utm_source=generator" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
                      updateBox('spotifyEmbed', embedCode);
                    } else {
                      updateBox('spotifyEmbed', value);
                    }
                  }} className="bg-white/80 backdrop-blur-sm border-purple-200 focus:border-purple-400 transition-colors h-16 sm:h-20 text-sm" />
                    <p className="text-xs text-gray-500 mt-2">Paste a Spotify track link </p>
                  </div>
                </div>
              </div>
            </Card>
            {/* Gift Box Details */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              
            </Card>

            {/* Cards Section */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Cards ({box.cards.length})
                  </h2>
                  <Button onClick={addCard} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Card
                  </Button>
                </div>

                <div className="space-y-6">
                  {box.cards.map((card, index) => <Card key={card.id} className="border border-purple-100 bg-gradient-to-br from-white to-purple-50/30">
                      <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-purple-800">Card {index + 1}</h3>
                          <Button variant="ghost" size="sm" onClick={() => removeCard(card.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`message-${card.id}`} className="text-sm font-medium mb-2 block">
                              Message
                            </Label>
                            <Textarea id={`message-${card.id}`} placeholder="Write your heartfelt message here..." value={card.message} onChange={e => updateCard(card.id, 'message', e.target.value)} className="min-h-[100px] resize-none" />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Image</Label>
                              <div className="space-y-2">
                                {card.imagePreview || card.image_url ? <div className="relative">
                                    <img src={card.image_url || card.imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-purple-200" />
                                    <Button variant="ghost" size="sm" onClick={() => removeImage(card.id)} className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 hover:text-red-700">
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div> : <div className="border-2 border-dashed border-purple-200 rounded-lg p-4 text-center">
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(card.id, file);
                              }} className="hidden" />
                                    <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages.has(card.id)} className="w-full">
                                      {uploadingImages.has(card.id) ? <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Uploading...
                                        </> : <>
                                          <Upload className="w-4 h-4 mr-2" />
                                          Upload Image
                                        </>}
                                    </Button>
                                  </div>}
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium mb-2 block">Audio Message</Label>
                              <div className="space-y-2">
                                {card.audioPreview || card.audio_url ? <div className="space-y-2">
                                    <audio controls preload="metadata" className="w-full">
                                      <source src={card.audio_url || card.audioPreview} type="audio/wav" />
                                    </audio>
                                    <Button variant="ghost" size="sm" onClick={() => removeAudio(card.id)} className="w-full text-red-500 hover:text-red-700 hover:bg-red-50">
                                      <Trash2 className="w-3 h-3 mr-2" />
                                      Remove Audio
                                    </Button>
                                  </div> : <div className="space-y-2">
                                    <Button variant="outline" onClick={() => isRecording === card.id ? stopRecording() : startRecording(card.id)} disabled={uploadingAudio.has(card.id)} className="w-full">
                                      {uploadingAudio.has(card.id) ? <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Uploading...
                                        </> : isRecording === card.id ? <>
                                          <MicOff className="w-4 h-4 mr-2" />
                                          Stop Recording
                                        </> : <>
                                          <Mic className="w-4 h-4 mr-2" />
                                          Record Audio
                                        </>}
                                    </Button>
                                  </div>}
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor={`unlock-delay-${card.id}`} className="text-sm font-medium mb-2 block">
                              Unlock Delay (Days)
                            </Label>
                            <Input id={`unlock-delay-${card.id}`} type="number" min="0" max="365" value={card.unlockDelay} onChange={e => updateCard(card.id, 'unlockDelay', parseInt(e.target.value) || 0)} className="w-full" />
                            <p className="text-xs text-gray-500 mt-1">
                              Set to 0 for immediate unlock, or specify days to wait
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>)}

                  {box.cards.length === 0 && <div className="text-center py-12 border-2 border-dashed border-purple-200 rounded-xl">
                      <Gift className="w-12 h-12 mx-auto mb-4 text-purple-300" />
                      <p className="text-gray-500 mb-4">No cards added yet</p>
                      <Button onClick={addCard} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Card
                      </Button>
                    </div>}
                </div>
              </div>
            </Card>

            {/* Customization Section */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <div className="p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Customization
                </h2>

                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Emoji</Label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                      {['🎁', '💝', '🎉', '💖', '✨', '🌟', '💫', '🎊', '🌈', '💕', '🌸', '🦋'].map(emoji => <button key={emoji} onClick={() => updateBox('emoji', emoji)} className={`p-3 text-2xl rounded-lg border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center ${box.emoji === emoji ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}>
                          {emoji}
                        </button>)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Theme</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[{
                      name: 'purple-pink',
                      gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
                      label: 'Purple Pink'
                    }, {
                      name: 'blue-teal',
                      gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                      label: 'Blue Teal'
                    }, {
                      name: 'warm-sunset',
                      gradient: 'linear-gradient(135deg, #f97316, #eab308)',
                      label: 'Warm Sunset'
                    }, {
                      name: 'emerald-green',
                      gradient: 'linear-gradient(135deg, #10b981, #22c55e)',
                      label: 'Emerald Green'
                    }, {
                      name: 'elegant-black',
                      gradient: 'linear-gradient(135deg, #374151, #1f2937)',
                      label: 'Elegant Black'
                    }, {
                      name: 'romantic-red',
                      gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
                      label: 'Romantic Red'
                    }].map(theme => <button key={theme.name} onClick={() => updateBox('theme', theme.name)} className={`relative h-12 sm:h-16 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden ${box.theme === theme.name ? 'border-purple-500 shadow-lg scale-105' : 'border-gray-200'}`} style={{
                      background: theme.gradient
                    }}>
                          <div className="absolute inset-0 bg-black/20"></div>
                          <div className="relative h-full flex items-center justify-center">
                            <span className="text-white text-xs sm:text-sm font-medium text-center px-2">
                              {theme.label}
                            </span>
                          </div>
                        </button>)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Effects</Label>
                    <div className="space-y-3">
                      <div 
                        onClick={() => updateBox('hasConfetti', !box.hasConfetti)}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                          box.hasConfetti 
                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg' 
                            : 'border-gray-200 bg-white hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${box.hasConfetti ? 'bg-purple-100' : 'bg-gray-100'}`}>
                              <Sparkles className={`w-5 h-5 ${box.hasConfetti ? 'text-purple-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <div className="font-medium text-sm">Confetti Animation</div>
                              <div className="text-xs text-gray-500">Add magical falling confetti</div>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            box.hasConfetti 
                              ? 'border-purple-500 bg-purple-500' 
                              : 'border-gray-300'
                          }`}>
                            {box.hasConfetti && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                        {box.hasConfetti && (
                          <div className="absolute top-2 right-2 flex space-x-1">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"
                                style={{
                                  animationDelay: `${i * 0.2}s`
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Checkout Button */}
            <div className="xl:hidden">
              <Button onClick={handlePreviewAndCheckout} disabled={!box.title.trim() || box.cards.length === 0 || uploadsPending} className={`w-full bg-gradient-to-r ${themeColors.shareButton} text-white font-medium py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}>
                {uploadsPending ? <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing uploads...
                  </> : <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Preview & Checkout • ${getPrice()}
                  </>}
              </Button>
            </div>
          </div>

          {/* Live Preview for Desktop */}
          <div className="hidden lg:block lg:sticky lg:top-8 animate-scale-in order-1 lg:order-2">
            <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              
              <div className="relative p-6 sm:p-8">
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    Live Preview
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">See how recipients will experience your gift</p>
                </div>
                
                {/* iPhone Preview Container */}
                <div className="flex-1 min-h-0">
                  <div className="relative max-w-sm mx-auto">
                    {/* iPhone Frame */}
                    <div className="relative bg-black rounded-[3.5rem] p-2 shadow-2xl">
                      <div className="bg-white rounded-[2.8rem] overflow-hidden relative">
                        {/* Status Bar */}
                        
                        
                        {/* Content Area */}
                        <div className={`h-[600px] overflow-y-auto bg-gradient-to-br ${themeColors.secondary} p-4 relative`}>
                          {/* Ambient Background Elements (scaled for mobile) */}
                          <div className="absolute inset-0 overflow-hidden">
                            <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${themeColors.ambient.primary} rounded-full blur-2xl`}></div>
                            <div className={`absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br ${themeColors.ambient.secondary} rounded-full blur-2xl`}></div>
                          </div>

                          {/* Confetti Animation */}
                          {box.hasConfetti && <div className="absolute inset-0 pointer-events-none overflow-hidden">
                              {[...Array(20)].map((_, i) => <div key={i} className={`absolute w-1 h-1 bg-gradient-to-r ${themeColors.primary} rounded-full opacity-80`} style={{
                            left: `${Math.random() * 100}%`,
                            animation: `confetti-fall ${2 + Math.random() * 2}s ${Math.random() * 2}s infinite linear`
                          }} />)}
                              <style>{`
                                @keyframes confetti-fall {
                                  0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
                                  100% { transform: translateY(600px) rotate(360deg); opacity: 0; }
                                }
                              `}</style>
                            </div>}

                          <div className="relative z-10">
                            {/* Header Section - matching ViewBox structure */}
                            <div className="text-center mb-6">
                              {/* Large emoji */}
                              <div className="text-6xl mb-3 filter drop-shadow-lg animate-[scale_2s_ease-in-out_infinite]">{box.emoji}</div>
                              
                              {/* Title */}
                              <h1 className={`text-xl font-bold mb-3 leading-tight bg-gradient-to-r ${themeColors.text} bg-clip-text text-transparent`}>
                                {box.title || 'Your Gift Box'}
                              </h1>
                              
                              {/* Badges - matching ViewBox */}
                              <div className="flex justify-center">
                                <div className={`${themeColors.accent} text-white px-2 py-1 rounded-full text-[10px] font-medium flex items-center space-x-1 shadow-lg`}>
                                  <Gift className="w-2 h-2" />
                                  <span>You Have {box.cards.length} Special Card{box.cards.length !== 1 ? "s" : ""}</span>
                                </div>
                              </div>
                            </div>

                            {/* Spotify Embed */}
                            {box.spotifyEmbed && <div className="mb-4">
                                <div dangerouslySetInnerHTML={{
                              __html: box.spotifyEmbed.replace(/utm_source=generator/g, 'utm_source=generator&autoplay=1&auto_play=true')
                            }} className="spotify-embed [&>iframe]:!h-[80px] [&>iframe]:!w-full [&>iframe]:rounded-lg" />
                              </div>}

                            {/* Card Navigation */}
                            {box.cards.length > 0 && <>
                                <div className="flex items-center justify-between mb-3">
                                  <button onClick={() => setCurrentPreviewCard(Math.max(0, currentPreviewCard - 1))} disabled={currentPreviewCard === 0} className={`${themeColors.button} disabled:opacity-50 text-xs px-2 py-1 rounded-lg transition-all duration-200`}>
                                    <ArrowLeft className="w-3 h-3 mr-1" />
                                    Prev
                                  </button>
                                  
                                  <div className="flex space-x-1">
                                    {box.cards.map((_, index) => <button key={index} onClick={() => setCurrentPreviewCard(index)} className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentPreviewCard ? `${themeColors.dots} scale-110` : `${themeColors.dotsInactive}`}`} />)}
                                  </div>
                                  
                                  <button onClick={() => setCurrentPreviewCard(Math.min(box.cards.length - 1, currentPreviewCard + 1))} disabled={currentPreviewCard === box.cards.length - 1} className={`${themeColors.button} disabled:opacity-50 text-xs px-2 py-1 rounded-lg transition-all duration-200`}>
                                    Next
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                  </button>
                                </div>

                                {/* Single Card Display */}
                                <div className="mb-4">
                                  {(() => {
                                const card = box.cards[currentPreviewCard];
                                if (!card) return null;
                                return <div className={`w-full rounded-xl overflow-hidden shadow-xl bg-gradient-to-br ${themeColors.primary} ${themeColors.glow} relative`}>
                                        {/* Decorative elements */}
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                                        <div className="absolute -top-2 -right-2 w-3 h-3 bg-white/20 rounded-full"></div>
                                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white/15 rounded-full"></div>
                                        
                                        <div className="p-3 flex flex-col text-white relative">
                                          {card.unlockDelay > 0 ? <div className="text-center py-6">
                                              <div className="mb-3">
                                                <div className="relative inline-block">
                                                  <Lock className="w-8 h-8 mx-auto mb-2 opacity-60" />
                                                  <div className="absolute -inset-1 bg-white/10 rounded-full blur-lg"></div>
                                                </div>
                                              </div>
                                              <h3 className="text-sm font-bold mb-1">Locked...</h3>
                                              <p className="text-white/80 text-xs">
                                                This card unlocks in {card.unlockDelay} day{card.unlockDelay > 1 ? 's' : ''}
                                              </p>
                                            </div> : <div className="relative space-y-2">
                                              <div className="flex items-center justify-between">
                                                <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                                                  <span className="text-xs font-medium">Card {currentPreviewCard + 1} of {box.cards.length}</span>
                                                </div>
                                                {(card.audio || card.audio_url) && <div className="text-white/80 p-1">
                                                    <Play className="w-3 h-3" />
                                                  </div>}
                                              </div>
                                              
                                              {/* Image if available */}
                                               {(card.imagePreview || card.image_url) && <div className="rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm p-1">
                                                   <img src={card.image_url || card.imagePreview} alt="Card preview" className="w-full rounded" />
                                                 </div>}
                                              
                                              {/* Message */}
                                              {card.message && card.message.trim() && <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 flex-1">
                                                  <p className="text-xs leading-relaxed text-white/95">
                                                    {card.message}
                                                  </p>
                                                </div>}
                                              
                                              {/* Audio indicator */}
                                              {(card.audio || card.audio_url) && <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-lg p-2">
                                                  <Volume2 className="w-3 h-3" />
                                                  <div>
                                                    <p className="text-xs font-medium">Audio Message</p>
                                                    <p className="text-xs text-white/80">Tap play to listen</p>
                                                  </div>
                                                </div>}
                                            </div>}
                                        </div>
                                      </div>;
                              })()}
                                </div>
                              </>}

                            {/* Empty state when no cards */}
                            {box.cards.length === 0 && <div className="mb-4 text-center py-8">
                                <Gift className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p className="text-sm text-gray-500">Add your first card to see the preview</p>
                              </div>}

                            {/* Action Buttons - matching ViewBox */}
                            <div className="space-y-2">
                              <button className={`w-full bg-gradient-to-r ${themeColors.shareButton} text-white py-2 rounded-xl font-medium text-xs shadow-lg`}>
                                Share This Magical Experience
                              </button>
                              
                              <button className={`w-full bg-white/80 backdrop-blur-sm border ${themeColors.outlineButton} ${themeColors.button} py-2 rounded-xl font-medium text-xs`}>
                                Create Your Own Gift Box
                              </button>
                            </div>
                            
                            {/* Footer - matching ViewBox */}
                            <div className="text-center mt-3">
                              <div className="inline-flex items-center space-x-1 text-gray-600">
                                <Heart className="w-3 h-3 text-red-500 fill-current" />
                                <span className="text-xs">Made with love using My Hidden Gift</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <Button onClick={handlePreviewAndCheckout} disabled={!box.title.trim() || box.cards.length === 0 || uploadsPending} className={`w-full bg-gradient-to-r ${themeColors.shareButton} text-white font-medium py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {uploadsPending ? <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing uploads...
                    </> : <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Preview & Checkout • ${getPrice()}
                    </>}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};
export default BoxBuilder;