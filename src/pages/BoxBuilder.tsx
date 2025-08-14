import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Gift, Plus, Trash2, Image, Mic, Clock, Sparkles, Music, ArrowLeft, Eye, X, Play, Square, Volume2, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
interface GiftCard {
  id: string;
  message: string;
  image?: File;
  image_url?: string;
  imagePreview?: string;
  audio?: Blob;
  audio_url?: string;
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
  spotifyEmbed?: string;
}
const BoxBuilder = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [recordingCardId, setRecordingCardId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [uploadErrors, setUploadErrors] = useState<Map<string, string>>(new Map());
  const [box, setBox] = useState<GiftBox>({
    title: "",
    cards: [{
      id: "1",
      message: ""
    }],
    theme: "purple-pink",
    hasConfetti: false,
    hasBackgroundMusic: false,
    emoji: "🎁"
  });
  const addCard = () => {
    if (box.cards.length < 7) {
      const newCard: GiftCard = {
        id: Date.now().toString(),
        message: ""
      };
      setBox({
        ...box,
        cards: [...box.cards, newCard]
      });
    }
  };
  const removeCard = (cardId: string) => {
    if (box.cards.length > 1) {
      setBox({
        ...box,
        cards: box.cards.filter(card => card.id !== cardId)
      });
    }
  };
  const updateCard = (cardId: string, field: keyof GiftCard, value: any) => {
    console.log('updateCard called:', {
      cardId,
      field,
      value
    });
    setBox(prevBox => {
      const updatedBox = {
        ...prevBox,
        cards: prevBox.cards.map(card => card.id === cardId ? {
          ...card,
          [field]: value
        } : card)
      };
      console.log('Updated box after updateCard:', updatedBox);
      return updatedBox;
    });
  };
  const updateBox = (field: keyof GiftBox, value: any) => {
    setBox({
      ...box,
      [field]: value
    });
  };

  // Image Upload Functions
  const handleImageUpload = async (cardId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please select an image smaller than 5MB.",
            variant: "destructive"
          });
          return;
        }

        // Add to uploading set
        setUploadingImages(prev => new Set([...prev, cardId]));
        setUploadErrors(prev => {
          const newErrors = new Map(prev);
          newErrors.delete(cardId);
          return newErrors;
        });
        try {
          // Create a temporary slug for organizing files
          const tempSlug = box.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 40) || 'untitled';
          const fileExt = file.name.split('.').pop();
          const fileName = `${tempSlug}/${cardId}-${Date.now()}.${fileExt}`;
          const {
            data,
            error
          } = await supabase.storage.from('gift-media').upload(fileName, file);
          if (error) {
            throw error;
          }

          // Get public URL
          const {
            data: {
              publicUrl
            }
          } = supabase.storage.from('gift-media').getPublicUrl(fileName);

          // Set preview for immediate display AND upload to Supabase
          const reader = new FileReader();
          reader.onload = e => {
            const imagePreview = e.target?.result as string;
            updateCard(cardId, 'imagePreview', imagePreview);
          };
          reader.readAsDataURL(file);

          // Update card with image URL from Supabase storage
          updateCard(cardId, 'image', file);
          updateCard(cardId, 'image_url', publicUrl);
          console.log('Image uploaded successfully. Card ID:', cardId, 'Public URL:', publicUrl);
          console.log('Updated card should have image_url:', publicUrl);

          // Force a state update check
          setTimeout(() => {
            const updatedCard = box.cards.find(c => c.id === cardId);
            console.log('Card after update:', updatedCard);
          }, 100);
          toast({
            title: "Image uploaded!",
            description: "Your image has been added to the card."
          });
        } catch (error) {
          console.error('Upload error:', error);
          setUploadErrors(prev => new Map([...prev, [cardId, 'Upload failed. Please try again.']]));
          toast({
            title: "Upload failed",
            description: "Please try uploading the image again.",
            variant: "destructive"
          });
        } finally {
          // Remove from uploading set
          setUploadingImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(cardId);
            return newSet;
          });
        }
      }
    };
    input.click();
  };
  const removeImage = (cardId: string) => {
    updateCard(cardId, 'image', undefined);
    updateCard(cardId, 'image_url', undefined);
    updateCard(cardId, 'imagePreview', undefined);
  };

  // Audio Upload Function
  const uploadAudio = async (cardId: string, audioBlob: Blob) => {
    try {
      // Add to uploading set
      setUploadingImages(prev => new Set([...prev, cardId]));
      setUploadErrors(prev => {
        const newMap = new Map(prev);
        newMap.delete(cardId);
        return newMap;
      });

      // Create a temporary slug for organizing files
      const tempSlug = box.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 40) || 'untitled';
      const fileName = `${tempSlug}/${cardId}-${Date.now()}.wav`;
      const {
        data,
        error
      } = await supabase.storage.from('gift-media').upload(fileName, audioBlob);
      if (error) {
        throw error;
      }
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('gift-media').getPublicUrl(fileName);

      // Update card with audio URL from Supabase storage
      updateCard(cardId, 'audio_url', publicUrl);
      console.log('Audio uploaded successfully. Card ID:', cardId, 'Public URL:', publicUrl);
    } catch (error) {
      console.error('Audio upload error:', error);
      setUploadErrors(prev => new Map([...prev, [cardId, 'Audio upload failed. Please try again.']]));
      toast({
        title: "Audio upload failed",
        description: "Please try recording the audio again.",
        variant: "destructive"
      });
    } finally {
      // Remove from uploading set
      setUploadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    }
  };

  // Audio Recording Functions
  const startRecording = async (cardId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, {
          type: 'audio/wav'
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        updateCard(cardId, 'audio', audioBlob);
        updateCard(cardId, 'audioUrl', audioUrl);

        // Automatically upload audio to Supabase
        await uploadAudio(cardId, audioBlob);
        stream.getTracks().forEach(track => track.stop());
        toast({
          title: "Recording saved",
          description: "Your audio message has been recorded and uploaded."
        });
      };
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(cardId);
      setRecordingCardId(cardId);
      mediaRecorder.start();
      toast({
        title: "Recording started",
        description: "Speak your message now..."
      });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
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
    updateCard(cardId, 'audio_url', undefined);
  };
  const handlePreviewAndCheckout = () => {
    // Check if any uploads are still pending
    if (uploadingImages.size > 0) {
      toast({
        title: "Upload in progress",
        description: "Please wait for all images to finish uploading.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to checkout with box data
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
  return <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 relative overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-300/10 to-rose-300/10 rounded-full blur-3xl"></div>
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
              <Gift className="w-6 sm:w-8 h-6 sm:h-8 text-purple-600" />
              <div className="absolute -inset-2 bg-purple-600/20 rounded-full blur-md animate-glow-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">My Hidden Gift</h1>
              <p className="text-xs sm:text-sm text-purple-600/70">Create magical moments</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="px-3 sm:px-4 py-2">
               <p className="text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">{getPriceTier()}</p>
               <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">${getPrice()}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Enhanced Builder Form */}
          <div className="space-y-6 sm:space-y-8 animate-fade-in order-1">
            {/* Box Title Section */}
            <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-400/20 rounded-full"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400/15 rounded-full"></div>
              
              <div className="relative p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Gift className="w-6 h-6 text-purple-600" />
                    <div className="absolute -inset-1 bg-purple-600/20 rounded-full blur-sm"></div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Gift Box Details
                  </h2>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-base sm:text-lg font-medium text-gray-700">Box Title</Label>
                    <Input id="title" placeholder="e.g., To Maria, Happy Birthday! 🎉" value={box.title} onChange={e => updateBox('title', e.target.value)} className="text-base sm:text-lg py-3 border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white/70 backdrop-blur-sm" />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="spotify" className="text-base sm:text-lg font-medium text-gray-700 flex items-center gap-2">
                      <Music className="w-5 h-5 text-green-500" />
                      Spotify Embed Code
                    </Label>
                    <Textarea 
                      id="spotify" 
                      placeholder="Paste your Spotify embed code here (optional)" 
                      value={box.spotifyEmbed || ''} 
                      onChange={e => updateBox('spotifyEmbed', e.target.value)} 
                      className="text-sm border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white/70 backdrop-blur-sm min-h-[80px]" 
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Enhanced Cards Section */}
            <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              
              <div className="relative p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" />
                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Cards ({box.cards.length}/7)
                    </h2>
                  </div>
                  <Button onClick={addCard} disabled={box.cards.length >= 7} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Card
                  </Button>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {box.cards.map((card, index) => <div key={card.id} className="relative">
                      <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-pink-50/50 hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                        
                        <div className="p-4 sm:p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                {index + 1}
                              </div>
                              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Card {index + 1}</h3>
                            </div>
                            {box.cards.length > 1 && <Button onClick={() => removeCard(card.id)} variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
                                <Trash2 className="w-4 h-4" />
                              </Button>}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm sm:text-base font-medium text-gray-700">Message *</Label>
                              <Textarea placeholder="Write your heartfelt message... ✨" value={card.message} onChange={e => updateCard(card.id, 'message', e.target.value)} className="mt-2 min-h-[100px] border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white/70 backdrop-blur-sm" />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              {/* Enhanced Image Upload */}
                              <div className="space-y-3">
                                <Label className="text-sm sm:text-base font-medium text-gray-700 flex items-center">
                                  <Image className="w-4 h-4 mr-2 text-purple-600" />
                                  Image (optional)
                                </Label>
                                <div className="space-y-3">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleImageUpload(card.id)} disabled={uploadingImages.has(card.id)} className="border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 w-full sm:w-auto">
                                      <Image className="w-4 h-4 mr-2" />
                                      {uploadingImages.has(card.id) ? 'Uploading...' : 'Upload'}
                                    </Button>
                                    {(card.image || card.image_url) && !uploadingImages.has(card.id) && <Button variant="ghost" size="sm" onClick={() => removeImage(card.id)} className="text-red-500 hover:bg-red-50">
                                        <X className="w-4 h-4" />
                                      </Button>}
                                  </div>
                                  
                                  {uploadingImages.has(card.id) && <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                      <div className="animate-spin w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                                      <span className="text-sm font-medium text-purple-700">Uploading image...</span>
                                    </div>}
                                  
                                  {uploadErrors.has(card.id) && <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                      <p className="text-sm text-red-600">{uploadErrors.get(card.id)}</p>
                                      <Button variant="outline" size="sm" className="mt-2 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleImageUpload(card.id)}>
                                        Retry Upload
                                      </Button>
                                    </div>}
                                  
                                  {card.imagePreview && !uploadingImages.has(card.id) && <div className="relative group">
                                      <img src={card.imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg shadow-md border-2 border-purple-200 group-hover:shadow-lg transition-all duration-200" />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-200"></div>
                                    </div>}
                                </div>
                              </div>

                              {/* Enhanced Audio Recording */}
                              <div className="space-y-3">
                                <Label className="text-sm sm:text-base font-medium text-gray-700 flex items-center">
                                  <Volume2 className="w-4 h-4 mr-2 text-purple-600" />
                                  Audio (optional)
                                </Label>
                                <div className="space-y-3">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                    {isRecording === card.id ? <Button variant="destructive" size="sm" onClick={stopRecording} className="bg-red-500 hover:bg-red-600 animate-pulse w-full sm:w-auto">
                                        <Square className="w-4 h-4 mr-2" />
                                        Stop
                                      </Button> : <Button variant="outline" size="sm" onClick={() => startRecording(card.id)} className="border-purple-200 hover:bg-purple-50 hover:border-purple-300 w-full sm:w-auto">
                                        <Mic className="w-4 h-4 mr-2" />
                                        Record
                                      </Button>}
                                     {(card.audio || card.audio_url) && !isRecording && <Button variant="ghost" size="sm" onClick={() => removeAudio(card.id)} className="text-red-500 hover:bg-red-50">
                                         <X className="w-4 h-4" />
                                       </Button>}
                                  </div>
                                  
                                  {card.audioUrl && <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                      <audio controls className="w-full h-8">
                                        <source src={card.audioUrl} type="audio/wav" />
                                      </audio>
                                    </div>}
                                  
                                  {isRecording === card.id && <div className="flex items-center space-x-3 text-red-500 p-3 bg-red-50 rounded-lg border border-red-200">
                                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                      <span className="text-sm font-medium">Recording in progress...</span>
                                    </div>}
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Unlock Delay */}
                            <div className="space-y-3">
                              <Label className="text-sm sm:text-base font-medium text-gray-700 flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-purple-600" />
                                Unlock Delay (optional)
                              </Label>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <Input type="number" placeholder="0" min="0" max="30" className="w-20 border-purple-200 focus:border-purple-400" value={card.unlockDelay || ''} onChange={e => updateCard(card.id, 'unlockDelay', parseInt(e.target.value) || 0)} />
                                <span className="text-xs sm:text-sm font-medium text-purple-700">
                                  {card.unlockDelay ? `Unlocks in ${card.unlockDelay} day(s)` : 'Unlocks immediately'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>)}
                </div>
              </div>
            </Card>

            {/* Enhanced Customization Section */}
            <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              
              <div className="relative p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" />
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Customization
                  </h2>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  {/* Enhanced Emoji Selection */}
                  <div className="space-y-3">
                    <Label className="text-base sm:text-lg font-medium text-gray-700">Box Icon</Label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
                      {['🎁', '🎉', '💝', '🎂', '🎊', '💐', '🌟', '💎', '🏆', '🎈', '🍰', '💌'].map(emoji => <button key={emoji} onClick={() => updateBox('emoji', emoji)} className={`h-12 sm:h-14 w-12 sm:w-14 rounded-xl border-2 transition-all duration-300 text-2xl sm:text-3xl hover:scale-110 hover:shadow-lg ${box.emoji === emoji ? 'border-purple-500 bg-purple-100 shadow-lg scale-105' : 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'}`}>
                          {emoji}
                        </button>)}
                    </div>
                  </div>

                  {/* Enhanced Theme Selection */}
                  <div className="space-y-3">
                    <Label className="text-base sm:text-lg font-medium text-gray-700">Visual Theme</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      {[{
                      name: 'purple-pink',
                      gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
                      label: 'Magical Purple'
                    }, {
                      name: 'blue-teal',
                      gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                      label: 'Ocean Blue'
                    }, {
                      name: 'warm-sunset',
                      gradient: 'linear-gradient(135deg, #f97316, #eab308)',
                      label: 'Warm Sunset'
                    }].map(theme => <button key={theme.name} onClick={() => updateBox('theme', theme.name)} className={`relative h-12 sm:h-16 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden ${box.theme === theme.name ? 'border-purple-500 shadow-lg scale-105' : 'border-purple-200'}`} style={{
                      background: theme.gradient
                    }}>
                          <div className="absolute inset-0 bg-white/10 hover:bg-white/20 transition-all duration-300"></div>
                          <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 right-1 sm:right-2 text-white text-xs font-medium text-center">
                            {theme.label}
                          </div>
                        </button>)}
                    </div>
                  </div>

                  <Separator className="bg-purple-200" />

                  {/* Enhanced Features */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <Label className="text-sm sm:text-base font-medium text-gray-800">Confetti Animation</Label>
                          <p className="text-xs sm:text-sm text-gray-600">Add magical sparkles when opened</p>
                        </div>
                      </div>
                      <Switch checked={box.hasConfetti} onCheckedChange={checked => updateBox('hasConfetti', checked)} className="data-[state=checked]:bg-purple-500" />
                    </div>

                    
                  </div>
                </div>
              </div>
            </Card>

            {/* Enhanced Preview & Checkout Button */}
            <Button onClick={handlePreviewAndCheckout} size="lg" className="w-full text-base sm:text-lg py-4 sm:py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105" disabled={uploadingImages.size > 0 || !box.title.trim() || !box.cards.some(card => card.message.trim())}>
              <Eye className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3" />
              {uploadingImages.size > 0 ? `Uploading ${uploadingImages.size} image${uploadingImages.size > 1 ? 's' : ''}...` : `Preview & Checkout ($${getPrice()})`}
            </Button>

            {/* Live Preview for Mobile - Below payment button */}
            <div className="xl:hidden">
              <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm animate-scale-in">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              
              <div className="relative p-6 sm:p-8">
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    Live Preview
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">See how recipients will experience your gift</p>
                </div>
                
                {/* iPhone Mockup */}
                <div className="flex justify-center items-center">
                  {/* iPhone Frame */}
                  <div className="w-72 h-[580px] bg-black rounded-[3rem] p-3 shadow-2xl relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
                    
                    {/* Screen */}
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 rounded-[2.3rem] overflow-hidden relative">
                      {/* Status Bar */}
                       <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-6 text-black text-sm font-medium z-10">
                         <span>9:41</span>
                         <div className="flex items-center space-x-1">
                           {/* Battery */}
                           <div className="w-6 h-3 border border-black rounded-sm relative">
                             <div className="w-4 h-1.5 bg-black rounded-sm absolute top-0.5 left-0.5"></div>
                             <div className="w-0.5 h-1 bg-black rounded-r absolute top-1 -right-1"></div>
                           </div>
                         </div>
                       </div>
                      
                      {/* Gift Page Content */}
                       <div className="p-6 flex flex-col overflow-y-auto h-full relative">
                         {/* Confetti Animation */}
                         {box.hasConfetti && <div className="absolute inset-0 pointer-events-none overflow-hidden">
                             {[...Array(20)].map((_, i) => <div key={i} className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                            transform: `translateY(-100px)`,
                            animation: `confetti-fall ${2 + Math.random() * 2}s ${Math.random() * 2}s infinite linear`
                          }} />)}
                             <style>{`
                               @keyframes confetti-fall {
                                 0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
                                 100% { transform: translateY(600px) rotate(360deg); opacity: 0; }
                               }
                             `}</style>
                           </div>}
                        {/* Header Section - matching ViewBox structure */}
                        <div className="text-center mb-6">
                          {/* Large emoji */}
                          <div className="text-6xl mb-3 filter drop-shadow-lg">{box.emoji}</div>
                          
                          {/* Title */}
                          <h1 className="text-xl font-bold text-purple-600 mb-3 leading-tight">
                            {box.title || 'Your Gift Box'}
                          </h1>
                          
                          {/* Badges - matching ViewBox */}
                           <div className="flex justify-center space-x-2 mb-6">
                             <div className="bg-purple-500 text-white px-2 py-1 rounded-full text-[10px] font-medium flex items-center space-x-1">
                               <Gift className="w-2 h-2" />
                               <span>{box.cards.length} Special Card{box.cards.length !== 1 ? "s" : ""}</span>
                             </div>
                             <div className="bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-600 px-2 py-1 rounded-full text-[10px] font-medium flex items-center space-x-1">
                               <Sparkles className="w-2 h-2" />
                               <span>Gift Box</span>
                             </div>
                           </div>
                        </div>
                        
                         {/* Cards Section - showing all cards */}
                         <div className="flex-1 mb-6 space-y-4">
                           {box.cards.map((card, index) => <div key={card.id} className="w-full min-h-48 rounded-2xl overflow-hidden shadow-xl" style={{
                            background: box.theme === 'purple-pink' ? 'linear-gradient(135deg, #a855f7, #ec4899)' : box.theme === 'blue-teal' ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'linear-gradient(135deg, #f97316, #eab308)'
                          }}>
                               <div className="p-4 flex flex-col text-white relative min-h-48">
                                 {/* Decorative elements */}
                                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                                 <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/20 rounded-full"></div>
                                 <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white/15 rounded-full"></div>
                                 
                                 <div className="relative space-y-3">
                                   <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 self-start">
                                     <span className="text-xs font-medium">Card {index + 1} of {box.cards.length}</span>
                                   </div>
                                   
                                   {/* Image if available */}
                                   {(card.imagePreview || card.image_url) && <div className="rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm p-1">
                                       <img src={card.image_url || card.imagePreview} alt="Card preview" className="w-full object-contain rounded" />
                                     </div>}
                                   
                                   {/* Message */}
                                   <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex-1">
                                     <p className="text-sm leading-relaxed text-white/95">
                                       {card.message || 'Your heartfelt message here...'}
                                     </p>
                                   </div>
                                   
                                    {/* Audio indicator */}
                                    {(card.audio || card.audio_url) && <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-lg p-2">
                                        <Volume2 className="w-3 h-3" />
                                        <span className="text-xs">Audio Message</span>
                                      </div>}
                                   
                                   {/* Unlock delay indicator */}
                                   {card.unlockDelay && card.unlockDelay > 0 && <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-lg p-2">
                                       <Clock className="w-3 h-3" />
                                       <span className="text-xs">Unlocks in {card.unlockDelay} day(s)</span>
                                     </div>}
                                 </div>
                               </div>
                             </div>)}
                         </div>
                        
                        {/* Action Buttons - matching ViewBox */}
                        <div className="space-y-2">
                          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-2xl font-medium text-sm shadow-lg">
                            Share This Magical Experience
                          </button>
                          
                          <button className="w-full bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-600 py-2 rounded-2xl font-medium text-sm">
                            Create Your Own Gift Box
                          </button>
                        </div>
                        
                        {/* Footer - matching ViewBox */}
                        <div className="text-center mt-3">
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 text-center">
                  <p className="text-xs sm:text-sm text-gray-600 bg-purple-50 rounded-lg p-2 sm:p-3 border border-purple-200">
                    ✨ This is how recipients will see your magical gift box
                  </p>
                </div>
              </div>
              </Card>
            </div>
          </div>

          {/* Enhanced Live Preview for Desktop - Right side */}
          <div className="hidden xl:block xl:sticky xl:top-8 animate-scale-in order-2">
            <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              
              <div className="relative p-6 sm:p-8">
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    Live Preview
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">See how recipients will experience your gift</p>
                </div>
                
                 <div className="flex justify-center items-start">
                   {/* iPhone Frame */}
                  <div className="w-72 h-[580px] bg-black rounded-[3rem] p-3 shadow-2xl relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
                    
                    {/* Screen */}
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 rounded-[2.3rem] overflow-hidden relative">
                      {/* Status Bar */}
                       <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-6 text-black text-sm font-medium z-10">
                         <span>9:41</span>
                         <div className="flex items-center space-x-1">
                           {/* Battery */}
                           <div className="w-6 h-3 border border-black rounded-sm relative">
                             <div className="w-4 h-1.5 bg-black rounded-sm absolute top-0.5 left-0.5"></div>
                             <div className="w-0.5 h-1 bg-black rounded-r absolute top-1 -right-1"></div>
                           </div>
                         </div>
                       </div>
                      
                      {/* Gift Page Content */}
                       <div className="p-6 flex flex-col overflow-y-auto h-full relative">
                         {/* Confetti Animation */}
                         {box.hasConfetti && <div className="absolute inset-0 pointer-events-none overflow-hidden">
                             {[...Array(20)].map((_, i) => <div key={i} className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" style={{
                          left: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${2 + Math.random() * 2}s`,
                          transform: `translateY(-100px)`,
                          animation: `confetti-fall ${2 + Math.random() * 2}s ${Math.random() * 2}s infinite linear`
                        }} />)}
                             <style>{`
                               @keyframes confetti-fall {
                                 0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
                                 100% { transform: translateY(600px) rotate(360deg); opacity: 0; }
                               }
                             `}</style>
                           </div>}
                        {/* Header Section - matching ViewBox structure */}
                        <div className="text-center mb-6">
                          {/* Large emoji */}
                          <div className="text-6xl mb-3 filter drop-shadow-lg">{box.emoji}</div>
                          
                          {/* Title */}
                          <h1 className="text-xl font-bold text-purple-600 mb-3 leading-tight">
                            {box.title || 'Your Gift Box'}
                          </h1>
                          
                          {/* Badges - matching ViewBox */}
                           <div className="flex justify-center space-x-2 mb-6">
                             <div className="bg-purple-500 text-white px-2 py-1 rounded-full text-[10px] font-medium flex items-center space-x-1">
                               <Gift className="w-2 h-2" />
                               <span>{box.cards.length} Special Card{box.cards.length !== 1 ? "s" : ""}</span>
                             </div>
                             <div className="bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-600 px-2 py-1 rounded-full text-[10px] font-medium flex items-center space-x-1">
                               <Sparkles className="w-2 h-2" />
                               <span>Gift Box</span>
                             </div>
                           </div>
                        </div>
                        
                         {/* Cards Section - showing all cards */}
                         <div className="flex-1 mb-6 space-y-4">
                           {box.cards.map((card, index) => <div key={card.id} className="w-full min-h-48 rounded-2xl overflow-hidden shadow-xl" style={{
                          background: box.theme === 'purple-pink' ? 'linear-gradient(135deg, #a855f7, #ec4899)' : box.theme === 'blue-teal' ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'linear-gradient(135deg, #f97316, #eab308)'
                        }}>
                               <div className="p-4 flex flex-col text-white relative min-h-48">
                                 {/* Decorative elements */}
                                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                                 <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/20 rounded-full"></div>
                                 <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white/15 rounded-full"></div>
                                 
                                 <div className="relative space-y-3">
                                   <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 self-start">
                                     <span className="text-xs font-medium">Card {index + 1} of {box.cards.length}</span>
                                   </div>
                                   
                                   {/* Image if available */}
                                   {(card.imagePreview || card.image_url) && <div className="rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm p-1">
                                       <img src={card.image_url || card.imagePreview} alt="Card preview" className="w-full object-contain rounded" />
                                     </div>}
                                   
                                   {/* Message */}
                                   <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex-1">
                                     <p className="text-sm leading-relaxed text-white/95">
                                       {card.message || 'Your heartfelt message here...'}
                                     </p>
                                   </div>
                                   
                                    {/* Audio indicator */}
                                    {(card.audio || card.audio_url) && <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-lg p-2">
                                        <Volume2 className="w-3 h-3" />
                                        <span className="text-xs">Audio Message</span>
                                      </div>}
                                   
                                   {/* Unlock delay indicator */}
                                   {card.unlockDelay && card.unlockDelay > 0 && <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-lg p-2">
                                       <Clock className="w-3 h-3" />
                                       <span className="text-xs">Unlocks in {card.unlockDelay} day(s)</span>
                                     </div>}
                                 </div>
                               </div>
                             </div>)}
                         </div>
                        
                        {/* Action Buttons - matching ViewBox */}
                        <div className="space-y-2">
                          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-2xl font-medium text-sm shadow-lg">
                            Share This Magical Experience
                          </button>
                          
                          <button className="w-full bg-white/80 backdrop-blur-sm border border-purple-200 text-purple-600 py-2 rounded-2xl font-medium text-sm">
                            Create Your Own Gift Box
                          </button>
                        </div>
                        
                        {/* Footer - matching ViewBox */}
                        <div className="text-center mt-3">
                          <div className="inline-flex items-center space-x-1 bg-white/60 backdrop-blur-sm rounded-full px-3 py-1">
                            <Heart className="w-3 h-3 text-red-500" />
                            <span className="text-xs text-gray-700">Made with love using My Hidden Gift</span>
                            <Sparkles className="w-3 h-3 text-purple-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 text-center">
                  <p className="text-xs sm:text-sm text-gray-600 bg-purple-50 rounded-lg p-2 sm:p-3 border border-purple-200">
                    ✨ This is how recipients will see your magical gift box
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};
export default BoxBuilder;