import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { motion } from 'motion/react';

export function Landing() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-3xl" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl text-center space-y-12 relative z-10"
      >
        <div className="space-y-6">
          <div className="w-20 h-20 bg-primary rounded-[24px] flex items-center justify-center text-white text-4xl font-black mx-auto shadow-2xl rotate-3">🎲</div>
          <h1 className="text-6xl md:text-7xl font-black text-foreground tracking-tight leading-tight">
            TableTop <span className="text-primary">HQ</span>
          </h1>
          <p className="text-xl text-muted-foreground font-bold leading-relaxed max-w-2xl mx-auto">
            Your home's complete board game ecosystem. Track collections, plan game nights, and get AI-powered rule assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-8 bg-white rounded-[32px] border-4 border-white shadow-vibrant hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-primary rounded-md" />
            </div>
            <h3 className="font-black text-foreground mb-2 text-lg">Inventory</h3>
            <p className="text-sm text-muted-foreground font-medium">Auto-lookup stats, ratings, and box art from BGG.</p>
          </div>
          <div className="p-8 bg-white rounded-[32px] border-4 border-white shadow-vibrant hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-secondary rounded-md" />
            </div>
            <h3 className="font-black text-foreground mb-2 text-lg">Game Nights</h3>
            <p className="text-sm text-muted-foreground font-medium">Vote on games, track scores, and record session notes.</p>
          </div>
          <div className="p-8 bg-white rounded-[32px] border-4 border-white shadow-vibrant hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-accent-foreground rounded-md" />
            </div>
            <h3 className="font-black text-foreground mb-2 text-lg">AI Expert</h3>
            <p className="text-sm text-muted-foreground font-medium">Ask MeepleBot anything about rules or game setup.</p>
          </div>
        </div>

        <Button 
          size="lg" 
          onClick={signIn}
          className="bg-primary text-white hover:bg-primary/90 px-16 h-16 text-xl font-black rounded-full shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
        >
          Get Started with Google
        </Button>
      </motion.div>
    </div>
  );
}
