import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Search, Plus, Filter, Loader2, ExternalLink, MessageSquare, Youtube, BookOpen, Save } from 'lucide-react';
import { searchBGG, getBGGGameDetails } from '../services/bggService';
import { addGameToHome } from '../services/dbService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { ChatBot } from './ChatBot';
import { motion } from 'motion/react';
import { updateDoc, doc } from 'firebase/firestore';

export function Collection() {
  const { profile, user } = useAuth();
  const [games, setGames] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bggResults, setBggResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Link editing state
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [editLinks, setEditLinks] = useState({
    howToPlay: '',
    review: '',
    setup: '',
    rules: ''
  });

  useEffect(() => {
    if (!profile?.activeHomeId) return;
    const gamesRef = collection(db, 'homes', profile.activeHomeId, 'games');
    const q = query(gamesRef, orderBy('name', 'asc'));
    return onSnapshot(q, (snap) => {
      setGames(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [profile?.activeHomeId]);

  const handleBGGSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const results = await searchBGG(searchQuery);
      setBggResults(results);
    } catch (error) {
      toast.error("BGG search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleAddGame = async (bggId: string) => {
    if (!profile?.activeHomeId || !user) return;
    setSearching(true);
    try {
      const details = await getBGGGameDetails(bggId);
      if (details) {
        await addGameToHome(profile.activeHomeId, details, user.uid);
        toast.success(`${details.name} added to collection!`);
        setBggResults([]);
        setSearchQuery('');
      }
    } catch (error) {
      toast.error("Failed to add game");
    } finally {
      setSearching(false);
    }
  };

  const handleSaveLinks = async () => {
    if (!profile?.activeHomeId || !selectedGame) return;
    try {
      const gameRef = doc(db, 'homes', profile.activeHomeId, 'games', selectedGame.id);
      await updateDoc(gameRef, { links: editLinks });
      toast.success("Links updated!");
      setIsEditingLinks(false);
      setSelectedGame({ ...selectedGame, links: editLinks });
    } catch (error) {
      toast.error("Failed to update links");
    }
  };

  const startEditingLinks = () => {
    setEditLinks(selectedGame.links || {
      howToPlay: '',
      review: '',
      setup: '',
      rules: ''
    });
    setIsEditingLinks(true);
  };

  const filteredGames = games.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.publisher?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-black text-foreground tracking-tight">My Library</h1>
            <div className="h-px flex-1 bg-border hidden md:block" />
          </div>
          <p className="text-muted-foreground font-medium">Manage your home board game collection.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search your library or BGG..." 
            className="pl-12 h-12 bg-muted border-none rounded-full text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBGGSearch()}
          />
          {searchQuery && (
            <Button 
              size="sm" 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white rounded-full h-8 px-4 font-bold"
              onClick={handleBGGSearch}
              disabled={searching}
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'BGG Search'}
            </Button>
          )}
        </div>
      </header>

      {bggResults.length > 0 && (
        <section className="bg-muted/30 p-8 rounded-[40px] border-4 border-white shadow-vibrant space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-foreground text-xl">BGG Search Results</h2>
            <Button variant="ghost" size="sm" onClick={() => setBggResults([])} className="font-bold text-muted-foreground">Clear</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bggResults.map(result => (
              <Card key={result.id} className="bg-white border-none shadow-sm rounded-2xl overflow-hidden flex items-center p-4 gap-4">
                <div className="flex-1">
                  <h3 className="font-black text-foreground text-sm line-clamp-1">{result.name}</h3>
                  <p className="text-xs text-muted-foreground font-bold">{result.year}</p>
                </div>
                <Button size="sm" onClick={() => handleAddGame(result.id)} className="bg-primary text-white rounded-xl h-10 w-10 p-0 shadow-lg shadow-primary/20">
                  <Plus className="w-5 h-5" />
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {filteredGames.map(game => (
          <Dialog key={game.id}>
            <DialogTrigger
              render={
                <motion.div 
                  whileHover={{ y: -8 }}
                  className="group cursor-pointer space-y-4"
                  onClick={() => setSelectedGame(game)}
                />
              }
            >
              <div className="aspect-[3/4] rounded-[32px] overflow-hidden bg-muted border-4 border-white shadow-vibrant transition-shadow group-hover:shadow-xl">
                <img 
                  src={game.image || game.thumbnail} 
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="px-2">
                <h3 className="font-black text-foreground line-clamp-1 text-lg leading-tight">{game.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold mt-1">
                  <span className="bg-muted px-2 py-0.5 rounded-md">{game.minPlayers}-{game.maxPlayers}P</span>
                  <span className="bg-muted px-2 py-0.5 rounded-md">{game.playingTime}m</span>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none rounded-[40px] shadow-2xl">
              {selectedGame && (
                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                  <div className="w-full md:w-2/5 bg-muted flex items-center justify-center p-10 relative">
                    <div className="absolute inset-0 bg-primary/5" />
                    <img 
                      src={selectedGame.image} 
                      alt={selectedGame.name}
                      className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl relative z-10 border-4 border-white"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    <DialogHeader className="p-10 pb-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="space-y-1">
                          <DialogTitle className="text-4xl font-black text-foreground tracking-tight leading-none">{selectedGame.name}</DialogTitle>
                          <div className="flex items-center gap-2">
                            <p className="text-muted-foreground font-bold">{selectedGame.publisher} • {selectedGame.yearpublished}</p>
                            {selectedGame.publisherUrl && (
                              <a href={selectedGame.publisherUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="bg-[#EBF7F6] text-[#00A896] px-4 py-2 rounded-2xl font-black text-xl shadow-sm border border-[#00A896]/10">
                          {selectedGame.rating?.toFixed(1)}
                        </div>
                      </div>
                    </DialogHeader>
                    
                    <ScrollArea className="flex-1 p-10 pt-0">
                      <div className="space-y-8">
                        <div className="flex flex-wrap gap-2">
                          {selectedGame.categories?.map((c: string) => (
                            <Badge key={c} variant="outline" className="border-border bg-muted/50 text-muted-foreground font-bold px-3 py-1 rounded-lg">{c}</Badge>
                          ))}
                        </div>

                        <div className="grid grid-cols-3 gap-6 py-6 border-y border-border">
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Players</p>
                            <p className="font-black text-foreground text-lg">{selectedGame.minPlayers}-{selectedGame.maxPlayers}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Time</p>
                            <p className="font-black text-foreground text-lg">{selectedGame.playingTime}m</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Complexity</p>
                            <p className="font-black text-foreground text-lg">Medium</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-black text-foreground uppercase tracking-widest text-xs">Description</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: selectedGame.description }} />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-foreground uppercase tracking-widest text-xs">Resources & Links</h4>
                            {!isEditingLinks && (
                              <Button variant="ghost" size="sm" onClick={startEditingLinks} className="text-primary font-black text-xs">
                                Edit Links
                              </Button>
                            )}
                          </div>
                          
                          {isEditingLinks ? (
                            <div className="space-y-3 bg-muted/30 p-6 rounded-2xl border border-border">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase">How to Play (YouTube)</label>
                                <Input 
                                  value={editLinks.howToPlay} 
                                  onChange={(e) => setEditLinks({...editLinks, howToPlay: e.target.value})}
                                  className="h-10 rounded-xl bg-white border-border"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase">Review (YouTube)</label>
                                <Input 
                                  value={editLinks.review} 
                                  onChange={(e) => setEditLinks({...editLinks, review: e.target.value})}
                                  className="h-10 rounded-xl bg-white border-border"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase">Setup (YouTube)</label>
                                <Input 
                                  value={editLinks.setup} 
                                  onChange={(e) => setEditLinks({...editLinks, setup: e.target.value})}
                                  className="h-10 rounded-xl bg-white border-border"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase">Rules (PDF/Web)</label>
                                <Input 
                                  value={editLinks.rules} 
                                  onChange={(e) => setEditLinks({...editLinks, rules: e.target.value})}
                                  className="h-10 rounded-xl bg-white border-border"
                                />
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button size="sm" onClick={handleSaveLinks} className="bg-primary text-white font-black rounded-xl">
                                  <Save className="w-4 h-4 mr-2" /> Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsEditingLinks(false)} className="font-bold">Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <a 
                                href={selectedGame.links?.howToPlay || `https://www.youtube.com/results?search_query=how+to+play+${encodeURIComponent(selectedGame.name)}`} 
                                target="_blank" rel="noreferrer"
                                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors border border-border/50"
                              >
                                <Youtube className="w-5 h-5 text-red-500" />
                                <span className="text-xs font-bold text-foreground">How to Play</span>
                              </a>
                              <a 
                                href={selectedGame.links?.review || `https://www.youtube.com/results?search_query=${encodeURIComponent(selectedGame.name)}+review`} 
                                target="_blank" rel="noreferrer"
                                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors border border-border/50"
                              >
                                <Youtube className="w-5 h-5 text-red-500" />
                                <span className="text-xs font-bold text-foreground">Review</span>
                              </a>
                              <a 
                                href={selectedGame.links?.setup || `https://www.youtube.com/results?search_query=${encodeURIComponent(selectedGame.name)}+setup`} 
                                target="_blank" rel="noreferrer"
                                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors border border-border/50"
                              >
                                <Youtube className="w-5 h-5 text-red-500" />
                                <span className="text-xs font-bold text-foreground">Setup</span>
                              </a>
                              <a 
                                href={selectedGame.links?.rules || `https://www.google.com/search?q=${encodeURIComponent(selectedGame.name)}+board+game+rules+pdf`} 
                                target="_blank" rel="noreferrer"
                                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors border border-border/50"
                              >
                                <BookOpen className="w-5 h-5 text-secondary" />
                                <span className="text-xs font-bold text-foreground">Rules</span>
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 pt-6">
                          <Button variant="outline" className="h-12 px-6 rounded-2xl border-border font-bold hover:bg-muted transition-colors">
                            <a href={`https://boardgamegeek.com/boardgame/${selectedGame.bggId}`} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                              <ExternalLink className="w-5 h-5" /> BGG Profile
                            </a>
                          </Button>
                          <Button 
                            className="h-12 px-6 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                            onClick={() => setIsChatOpen(true)}
                          >
                            <MessageSquare className="w-5 h-5 mr-2" /> Ask MeepleBot
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        ))}
      </div>

      {isChatOpen && selectedGame && (
        <ChatBot 
          game={selectedGame} 
          onClose={() => setIsChatOpen(false)} 
        />
      )}
    </div>
  );
}
