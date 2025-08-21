import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, 
  Heart, 
  Sparkles, 
  Clock, 
  Share2, 
  Star,
  Music,
  Image,
  Mic,
  Timer,
  Download,
  Zap,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-gift-boxes.jpg";

const Index = () => {
  const navigate = useNavigate();

  const handleCreateBox = () => {
    navigate('/builder');
  };

  const features = [
    {
      icon: Image,
      title: "Rich Media Cards",
      description: "Photos, videos, and custom messages in every card"
    },
    {
      icon: Mic,
      title: "Voice Messages",
      description: "Record personal audio messages for a deeper connection"
    },
    {
      icon: Timer,
      title: "Timed Reveals",
      description: "Set delays for surprise reveals over days or weeks"
    },
    {
      icon: Music,
      title: "Ambient Sounds",
      description: "Background music and sound effects for the perfect mood"
    },
    {
      icon: Sparkles,
      title: "Interactive Effects",
      description: "Confetti, animations, and delightful micro-interactions"
    },
    {
      icon: Download,
      title: "Share Anywhere",
      description: "QR codes, links, and embeddable gift experiences"
    }
  ];

  const testimonials = [
    {
      text: "Made my anniversary unforgettable. The time-delayed cards were pure magic!",
      author: "Sarah M.",
      occasion: "Anniversary"
    },
    {
      text: "My mom cried happy tears when she opened each card. Worth every penny.",
      author: "David L.",
      occasion: "Mother's Day"
    },
    {
      text: "The perfect way to surprise someone special from miles away.",
      author: "Emma K.",
      occasion: "Long Distance"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <img 
          src={heroImage} 
          alt="Digital gift boxes" 
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-soft-light" 
        />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="mb-12 animate-bounce-in">
            <div className="flex items-center justify-center mb-6">
              <Gift className="w-20 h-20 text-primary" />
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-8 leading-tight">
              Gifts That
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform ordinary moments into extraordinary memories with digital gift boxes that reveal surprises over time, creating lasting emotional connections.
            </p>
          </div>
          
          <div className="animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg px-10 py-7 group" 
                onClick={handleCreateBox}
              >
                <Gift className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                Create Your First Gift Box
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-7"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                No account required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Share instantly
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Starting at $4.99
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="px-6 py-20 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-gradient-primary text-white px-4 py-2">
              ✨ Crafted with Love
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Every Detail Matters
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We've thoughtfully designed every feature to create meaningful moments that last forever.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="p-8 bg-gradient-card border-0 shadow-card hover:shadow-elegant transition-all duration-500 group cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-20 bg-gradient-subtle">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center bg-gradient-card border-0 shadow-card hover:shadow-elegant transition-all duration-300 animate-scale-in group">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Create Your Cards</h3>
              <p className="text-muted-foreground">
                Add up to 7 surprise cards with messages, photos, and audio recordings
              </p>
            </Card>

            <Card className="p-8 text-center bg-gradient-card border-0 shadow-card hover:shadow-elegant transition-all duration-300 animate-scale-in group">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Customize & Preview</h3>
              <p className="text-muted-foreground">
                Choose themes, add confetti, set unlock delays, and see a live preview
              </p>
            </Card>

            <Card className="p-8 text-center bg-gradient-card border-0 shadow-card hover:shadow-elegant transition-all duration-300 animate-scale-in group">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
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

      {/* Social Proof */}
      <section className="px-6 py-20 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Loved by Thousands
            </h2>
            <p className="text-xl text-muted-foreground">
              Join the community creating unforgettable digital experiences
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className="p-8 bg-gradient-card border-0 shadow-card hover:shadow-elegant transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-accent fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{testimonial.author}</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {testimonial.occasion}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 bg-gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <Gift className="w-16 h-16 mx-auto mb-8 animate-glow-pulse" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Create Something Beautiful?
          </h2>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
            Start building your first digital gift box today and watch as your loved ones discover each carefully crafted surprise.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg" 
              className="text-lg px-10 py-7 bg-white text-primary hover:bg-white/90 group" 
              onClick={handleCreateBox}
            >
              <Zap className="w-6 h-6 mr-3 group-hover:animate-pulse" />
              Start Creating Now
            </Button>
          </div>
          
          <p className="text-sm mt-6 opacity-75">
            Join 10,000+ people who've shared magical moments
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Gift className="w-10 h-10 text-primary mr-3" />
              <span className="text-2xl font-bold">My Hidden Gift</span>
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">
              Creating meaningful digital experiences that bring people closer together, one gift box at a time.
            </p>
          </div>
          
          <div className="border-t border-border pt-8 text-center">
            <p className="text-muted-foreground text-sm">
              Made with ❤️ for creating unforgettable moments
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;