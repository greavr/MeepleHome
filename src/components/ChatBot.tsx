import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { askGeminiAboutGame } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface ChatBotProps {
  game: any;
  onClose: () => void;
}

export function ChatBot({ game, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([
    { role: 'bot', content: `Hi! I'm MeepleBot. I'm an expert on **${game.name}**. How can I help you with the rules or setup today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await askGeminiAboutGame(game.name, game.description, userMsg);
      setMessages(prev => [...prev, { role: 'bot', content: response || "I'm not sure about that." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I hit a snag. Try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        className="fixed bottom-6 right-6 w-full max-w-md h-[600px] bg-white rounded-[40px] shadow-2xl border-4 border-white z-[100] flex flex-col overflow-hidden shadow-vibrant"
      >
        <header className="p-6 bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-none">MeepleBot</h3>
              <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold mt-1">Expert on {game.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </Button>
        </header>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[24px] text-sm font-medium shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-muted text-foreground rounded-tl-none border border-border'
                }`}>
                  <div className="prose prose-sm prose-stone dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted p-4 rounded-[24px] rounded-tl-none border border-border">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <footer className="p-6 bg-muted/30 border-t border-border">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-3"
          >
            <Input 
              placeholder="Ask about rules or setup..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-white border-none shadow-inner h-12 rounded-2xl px-6 font-medium focus-visible:ring-2 focus-visible:ring-primary"
            />
            <Button type="submit" size="icon" disabled={loading} className="bg-primary text-white rounded-2xl shrink-0 h-12 w-12 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
