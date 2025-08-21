import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gift, Heart, Sparkles, Clock, Share2, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-gift-boxes.jpg";
import phoneMockup from "@/assets/phone-mockup.jpg";
const Index = () => {
  const navigate = useNavigate();
  const handleCreateBox = () => {
    navigate('/builder');
  };
  return <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-20" />
        <img src={heroImage} alt="Digital gift boxes" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-soft-light" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="mb-8 animate-bounce-in">
            <Gift className="w-16 h-16 mx-auto mb-6 text-primary animate-glow-pulse" />
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-6">My Hidden Gift</h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create magical digital gift boxes filled with surprise cards, messages, and memories
            </p>
          </div>
          
          <div className="animate-fade-in">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6 mb-4" onClick={handleCreateBox}>
              <Gift className="w-6 h-6 mr-2" />
              Build Your Box
            </Button>
            <p className="text-sm text-muted-foreground">
              No account needed • Share instantly • Starting at $4.99
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center bg-gradient-card border-0 shadow-card hover:shadow-elegant transition-all duration-300 animate-scale-in">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Create Your Cards</h3>
              <p className="text-muted-foreground">
                Add up to 7 surprise cards with messages, photos, and audio recordings
              </p>
            </Card>

            <Card className="p-8 text-center bg-gradient-card border-0 shadow-card hover:shadow-elegant transition-all duration-300 animate-scale-in">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Customize & Preview</h3>
              <p className="text-muted-foreground">
                Choose themes, add confetti, set unlock delays, and see a live preview
              </p>
            </Card>

            <Card className="p-8 text-center bg-gradient-card border-0 shadow-card hover:shadow-elegant transition-all duration-300 animate-scale-in">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Share the Magic</h3>
              <p className="text-muted-foreground">
                Get a unique link and QR code to share your gift box with anyone
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Perfect for Every Occasion
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="flex items-center space-x-4 p-6 bg-card rounded-lg shadow-card">
              <Clock className="w-8 h-8 text-primary flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold mb-2">Time Capsule Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Set unlock delays for daily surprises
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-6 bg-card rounded-lg shadow-card">
              <Star className="w-8 h-8 text-accent flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold mb-2">Premium Effects</h3>
                <p className="text-sm text-muted-foreground">
                  Confetti animations and background music
                </p>
              </div>
            </div>
          </div>

          <Button variant="hero" size="lg" className="text-lg px-8 py-6" onClick={handleCreateBox}>
            <Gift className="w-6 h-6 mr-2" />
            Start Creating
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Gift className="w-8 h-8 text-primary mr-2" />
            <span className="text-xl font-bold">Unbox Me</span>
          </div>
          <p className="text-muted-foreground">
            Made with ❤️ for sharing special moments
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;