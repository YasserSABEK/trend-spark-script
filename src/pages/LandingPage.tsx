import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { VideoModal } from "@/components/VideoModal";
import { 
  TrendingUp, 
  Brain, 
  BarChart3, 
  Play,
  Check,
  Star,
  Rocket,
  Clock,
  Users,
  ArrowRight,
  Zap,
  Heart,
  MessageSquare,
  Share,
  Timer,
  Shield,
  Globe
} from "lucide-react";

export const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { toast } = useToast();

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  
  const stats = [
    { label: "creators trust us", value: "thousands of" },
    { label: "views generated", value: "500M+" },
    { label: "hours saved weekly", value: "15+" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      handle: "@sarahfitslife", 
      followers: "287K",
      quote: "Viraltify helped me go from 12K to 287K followers. The AI scripts sound exactly like me!",
      result: "+380% engagement"
    },
    {
      name: "Mike Rodriguez", 
      handle: "@mikecoachingfit",
      followers: "156K", 
      quote: "I was spending 4 hours daily looking for content ideas. Now I spend 15 minutes.",
      result: "15h saved weekly"
    },
    {
      name: "Emma Thompson",
      handle: "@emmacooks",
      followers: "94K",
      quote: "I've caught 3 viral food trends before they exploded. My reach went through the roof!",
      result: "+420% reach"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-inter">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-200 rounded-full px-4 py-2">
                <span className="text-purple-800 text-sm font-medium">#1 Instagram Viral Content Tool</span>
              </div>
              
              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Turn Viral Instagram Reels Into Your{" "}
                  <span className="bg-gradient-to-r from-purple-800 to-pink-500 bg-clip-text text-transparent">
                    Next Hit
                  </span>
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  AI-powered Instagram viral content discovery + personalized script generation for content creators who want to go viral consistently.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="bg-gradient-to-r from-purple-800 to-pink-500 text-white px-8 py-3 hover:opacity-90 shadow-md rounded-lg text-base font-medium"
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? "Signing up..." : "Start Free Trial"}
                </Button>
                
                <VideoModal 
                  videoUrl="https://youtu.be/Y0GlJnaxv48"
                  buttonText="Watch Demo"
                  buttonVariant="outline"
                />
              </div>

              {/* Social Proof Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">50K+</div>
                  <div className="text-sm text-gray-600">Viral Scripts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">10M+</div>
                  <div className="text-sm text-gray-600">Views Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">2K+</div>
                  <div className="text-sm text-gray-600">Creators</div>
                </div>
              </div>
            </div>

            {/* Right Column - Hero Image/Dashboard */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl p-8 shadow-2xl">
                {/* Mock Dashboard Content */}
                <div className="bg-white rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">lokatan.any</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">90% Viral Rate</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-800 to-pink-500 bg-clip-text text-transparent">
                      Viral Content Discovery
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700">2M+ Analyzed Reels</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                        <span className="text-gray-700">Hot or Ghjz</span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-900 mb-1">Generate Scripts in 30s</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Mock Phone Interface */}
                <div className="absolute -right-4 -top-4 w-32 h-56 bg-white rounded-2xl shadow-lg p-2">
                  <div className="w-full h-full bg-gray-100 rounded-xl flex flex-col">
                    <div className="h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-xl"></div>
                    <div className="flex-1 p-2 space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                          <div className="flex-1 h-2 bg-gray-300 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Analytics Chart Mock */}
                <div className="absolute -left-6 bottom-4 w-24 h-16 bg-white rounded-lg shadow-lg p-2">
                  <div className="flex items-end justify-between h-full">
                    {[40, 70, 30, 90, 60].map((height, i) => (
                      <div key={i} className="w-2 bg-gradient-to-t from-purple-500 to-pink-500 rounded-sm" style={{height: `${height}%`}}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-800/10 border border-purple-800/20 rounded-lg px-4 py-2 mb-6">
                <Play className="w-4 h-4 text-purple-800" />
                <span className="text-sm text-gray-600">See it in action</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Daily{" "}
                <span className="bg-gradient-to-r from-purple-800 to-pink-500 bg-clip-text text-transparent">
                  viral ideas
                </span>{" "}
                delivered
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Get fresh content ideas every day based on what's trending in your niche. Our AI analyzes millions of posts to find the best opportunities.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-900">Real-time trending analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-800 rounded-full"></div>
                  <span className="text-gray-900">Personalized to your niche</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <span className="text-gray-900">Script generation included</span>
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-purple-800 to-pink-500 text-white px-8 py-4 h-auto hover:opacity-90 shadow-md rounded-lg"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? "Signing up..." : "See today's ideas"}
              </Button>
            </div>
            
            <div className="relative">
              <div className="bg-white border border-gray-200 rounded-lg p-8 relative overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-800/5 to-pink-500/5"></div>
                <div className="relative">
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden border border-gray-200">
                    <iframe
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/Y0GlJnaxv48"
                      title="Viraltify Demo Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">How to Find Viral Content in 2 Minutes</h4>
                      <p className="text-sm text-gray-600">Watch how creators use our platform</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      12K views
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - The Ultimate Viral Content Toolkit */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              The Ultimate{" "}
              <span className="bg-gradient-to-r from-purple-800 to-pink-500 bg-clip-text text-transparent">
                Viral Content
              </span>{" "}
              Toolkit
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to consistently create viral content that your audience loves
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <TrendingUp className="w-6 h-6 text-white" />,
                title: "Trend Radar",
                description: "Real-time discovery of viral sounds & formats with niche filters"
              },
              {
                icon: <Brain className="w-6 h-6 text-white" />,
                title: "AI Script Generator", 
                description: "Generates hooks, bodies and CTAs tailored to your voice"
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-white" />,
                title: "Performance Analytics",
                description: "Engagement tracking, viral score predictions and ROI insights"
              },
              {
                icon: <Clock className="w-6 h-6 text-white" />,
                title: "Daily Ideas",
                description: "New content ideas every day based on what's working"
              },
              {
                icon: <Users className="w-6 h-6 text-white" />,
                title: "Hashtag & Sound Explorer",
                description: "Discover high-impact hashtags and trending audio"
              },
              {
                icon: <Rocket className="w-6 h-6 text-white" />,
                title: "Team Collaboration",
                description: "Shared workspaces, roles and comments"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-purple-800/50 transition-all duration-300 shadow-md"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-800 to-pink-500 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <a href="#" className="text-purple-800 hover:text-purple-600 underline">
              See all features
            </a>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-purple-800 to-pink-500 bg-clip-text text-transparent">
                thousands of creators
              </span>{" "}
              worldwide
            </h2>
            <div className="flex justify-center items-center gap-2 mb-8">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xl font-semibold ml-2">4.9/5</span>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-md">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-800 to-pink-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {testimonials[currentTestimonial].name.split(' ').map(n => n[0]).join('')}
                </div>
                <h4 className="text-xl font-semibold text-gray-900">{testimonials[currentTestimonial].name}</h4>
                <p className="text-gray-600">{testimonials[currentTestimonial].handle} • {testimonials[currentTestimonial].followers} followers</p>
              </div>
              
              <blockquote className="text-lg italic mb-6 text-gray-900">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>
              
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <span className="text-green-700 font-semibold">{testimonials[currentTestimonial].result}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep-Dive Sections */}
      <section className="py-20">
        <div className="container mx-auto px-4 space-y-20">
          {/* Trend Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-card border rounded-2xl p-8 shadow-lg">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border overflow-hidden">
                <img 
                  src="/lovable-uploads/47c5bd0e-29f3-492c-b67f-acc0636e6c17.png" 
                  alt="Trending Hashtags Dashboard" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-3xl font-bold mb-6">
                Never miss a{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  trending moment
                </span>
              </h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <span className="text-foreground">Trending Hashtags</span>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Viral Scores</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-secondary" />
                  <span className="text-foreground">Niche Filters</span>
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-purple-800 to-pink-500 text-white px-8 py-4 h-auto hover:opacity-90 shadow-md rounded-lg"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? "Signing up..." : "Explore trending reels"}
              </Button>
            </div>
          </div>

          {/* Personalized Scripts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-2xl font-bold mb-6">
                Personalized{" "}
                <span className="bg-gradient-to-r from-purple-800 to-pink-500 bg-clip-text text-transparent">
                  scripts & ideas
                </span>
              </h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-purple-800" />
                  <span className="text-gray-900">Tailored Hooks & CTAs</span>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  <span className="text-gray-900">Predict Views & Outcomes</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-pink-500" />
                  <span className="text-gray-900">Find Untapped Opportunities</span>
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-purple-800 to-pink-500 text-white px-8 py-4 h-auto hover:opacity-90 shadow-md rounded-lg"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? "Signing up..." : "See today's ideas"}
              </Button>
            </div>
            
            <div className="order-1 lg:order-2 bg-white border border-gray-200 rounded-lg p-8 shadow-md">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden">
                <img 
                  src="/lovable-uploads/5d06cf83-124d-4fdf-a843-4736467edf4a.png" 
                  alt="Script Generator Dashboard" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about Viraltify
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "How is this different from just browsing Instagram?",
                answer: "While browsing shows you random content, Viraltify uses AI to analyze millions of posts, identify trending patterns before they explode, and finds content specifically relevant to your niche. We also provide viral scores, engagement analytics, and generate personalized scripts."
              },
              {
                question: "Will the AI scripts sound like me?",
                answer: "Absolutely! Our AI learns your brand voice, tone, and style preferences. You can train it with your existing content, and it will generate scripts that match your personality while incorporating proven viral formulas."
              },
              {
                question: "What if I don't go viral using your platform?",
                answer: "We offer a 30-day money-back guarantee. While we can't guarantee virality, we can guarantee you'll save 15+ hours per week and create higher-quality content. Our users see an average 200% increase in engagement within their first month."
              },
              {
                question: "Can I cancel anytime?",
                answer: "Yes, absolutely. Cancel anytime with one click in your account settings. No contracts, no cancellation fees. If you cancel, you'll retain access until your current billing period ends."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to create{" "}
            <span className="bg-gradient-to-r from-purple-800 to-pink-500 bg-clip-text text-transparent">
              viral content
            </span>{" "}
            faster?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Stop wasting hours researching. Start creating content that actually converts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              className="bg-gradient-to-r from-purple-800 to-pink-500 text-white text-lg px-8 py-4 h-auto hover:opacity-90 shadow-md rounded-lg"
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? "Signing up..." : "Sign up with Google"}
            </Button>
            <Button 
              variant="outline" 
              className="text-gray-900 border-gray-300 hover:bg-gray-50 text-lg px-8 py-4 h-auto rounded-lg"
            >
              Contact sales
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Free forever
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Thousands of creators trust us
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-800 to-pink-500 bg-clip-text text-transparent">
                Viraltify
              </h3>
              <p className="text-gray-600 mb-4">
                Our mission is to empower creators with AI‑powered tools to save time and go viral.
              </p>
              <div className="flex gap-3">
                <Button size="sm" variant="outline" className="border-gray-300 hover:border-purple-800 rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-gray-300 hover:border-purple-800 rounded-lg">
                  <Share className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-gray-300 hover:border-purple-800 rounded-lg">
                  <Users className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-gray-300 hover:border-purple-800 rounded-lg">
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Product</h4>
              <div className="space-y-2 text-gray-600">
                <p>Trend Radar</p>
                <p>Script Generator</p>
                <p>Analytics</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Company</h4>
              <div className="space-y-2 text-gray-600">
                <p>About</p>
                <p>Careers</p>
                <p>Blog</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Support</h4>
              <div className="space-y-2 text-gray-600">
                <p>Help Center</p>
                <p>Terms</p>
                <p>Privacy</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-600">
            <p>&copy; 2025 Viraltify. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};