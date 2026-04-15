import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Calendar, Users, Trophy, Vote, CheckCircle2, Plus, Trash2, MessageSquare, Save } from 'lucide-react';
import { createGameNight, voteForGame, recordScoresAndNotes } from '../services/dbService';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function GameNight() {
  const { profile, user } = useAuth();
  const [nights, setNights] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [newNightDate, setNewNightDate] = useState('');
  
  // Scoring state
  const [activeNightId, setActiveNightId] = useState<string | null>(null);
  const [scores, setScores] = useState<{ name: string, score: number }[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedGameId, setSelectedGameId] = useState('');

  useEffect(() => {
    if (!profile?.activeHomeId) return;
    
    const nightsRef = collection(db, 'homes', profile.activeHomeId, 'gameNights');
    const q = query(nightsRef, orderBy('date', 'desc'));
    const unsubNights = onSnapshot(q, (snap) => {
      setNights(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const gamesRef = collection(db, 'homes', profile.activeHomeId, 'games');
    const unsubGames = onSnapshot(gamesRef, (snap) => {
      setGames(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubNights();
      unsubGames();
    };
  }, [profile?.activeHomeId]);

  const handleCreateNight = async () => {
    if (!newNightDate || !profile?.activeHomeId) return;
    try {
      await createGameNight(profile.activeHomeId, newNightDate);
      setNewNightDate('');
      toast.success("Game night scheduled!");
    } catch (error) {
      toast.error("Failed to schedule");
    }
  };

  const handleVote = async (nightId: string, gameId: string) => {
    if (!profile?.activeHomeId || !user) return;
    try {
      await voteForGame(profile.activeHomeId, nightId, gameId, user.uid);
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  const updateNightStatus = async (nightId: string, status: string) => {
    if (!profile?.activeHomeId) return;
    const nightRef = doc(db, 'homes', profile.activeHomeId, 'gameNights', nightId);
    await updateDoc(nightRef, { status });
    
    if (status === 'active') {
      setActiveNightId(nightId);
      setScores([{ name: '', score: 0 }]);
      setNotes('');
      // Auto-select game with most votes
      const night = nights.find(n => n.id === nightId);
      if (night?.votes) {
        const winner = Object.entries(night.votes).reduce((a: any, b: any) => (a[1].length > b[1].length ? a : b))[0];
        setSelectedGameId(winner);
      }
    }
  };

  const handleAddScoreRow = () => {
    setScores([...scores, { name: '', score: 0 }]);
  };

  const handleScoreChange = (index: number, field: 'name' | 'score', value: string | number) => {
    const newScores = [...scores];
    newScores[index] = { ...newScores[index], [field]: value };
    setScores(newScores);
  };

  const handleFinishNight = async (nightId: string) => {
    if (!profile?.activeHomeId || !selectedGameId) {
      toast.error("Please select a game and add scores");
      return;
    }
    try {
      await recordScoresAndNotes(profile.activeHomeId, nightId, scores.filter(s => s.name), notes, selectedGameId);
      toast.success("Game night recorded!");
      setActiveNightId(null);
    } catch (error) {
      toast.error("Failed to record results");
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-black text-foreground tracking-tight">Game Nights</h1>
            <div className="h-px flex-1 bg-border hidden md:block" />
          </div>
          <p className="text-muted-foreground font-medium">Plan, vote, and record your sessions.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-[32px] shadow-vibrant border-4 border-white">
          <Input 
            type="datetime-local" 
            value={newNightDate}
            onChange={(e) => setNewNightDate(e.target.value)}
            className="border-none bg-muted h-12 rounded-2xl px-6 font-bold focus-visible:ring-0"
          />
          <Button onClick={handleCreateNight} disabled={!newNightDate} className="bg-primary text-white h-12 rounded-2xl px-8 font-black shadow-lg shadow-primary/20 shrink-0">
            <Plus className="w-5 h-5 mr-2" /> Schedule
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {nights.map(night => (
          <Card key={night.id} className="bg-white border-none shadow-vibrant rounded-[40px] overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="bg-foreground text-white p-10 md:w-72 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-white/60 text-xs font-black uppercase tracking-widest mb-3">
                    <Calendar className="w-4 h-4" /> {new Date(night.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h3 className="text-4xl font-black tracking-tight">{new Date(night.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h3>
                </div>
                <Badge className={cn(
                  "mt-8 w-fit px-4 py-2 rounded-xl font-black text-xs tracking-widest relative z-10",
                  night.status === 'planned' && "bg-blue-500 text-white",
                  night.status === 'voting' && "bg-secondary text-white",
                  night.status === 'active' && "bg-primary text-white",
                  night.status === 'completed' && "bg-muted text-muted-foreground"
                )}>
                  {night.status.toUpperCase()}
                </Badge>
              </div>

              <div className="flex-1 p-10 space-y-8">
                {night.status === 'planned' && (
                  <div className="flex items-center justify-between bg-muted/30 p-8 rounded-3xl border-2 border-dashed border-border">
                    <p className="text-muted-foreground font-bold italic">Waiting to start voting...</p>
                    <Button onClick={() => updateNightStatus(night.id, 'voting')} className="bg-primary text-white h-12 px-8 rounded-2xl font-black shadow-lg shadow-primary/20">
                      Start Voting
                    </Button>
                  </div>
                )}

                {night.status === 'voting' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-foreground flex items-center gap-2 text-xl">
                        <Vote className="w-6 h-6 text-primary" /> Current Votes
                      </h4>
                      <Button onClick={() => updateNightStatus(night.id, 'active')} className="bg-foreground text-white h-12 px-8 rounded-2xl font-black">
                        Lock Votes & Start
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {games.map(game => {
                        const voteCount = night.votes?.[game.id]?.length || 0;
                        const hasVoted = night.votes?.[game.id]?.includes(user?.uid);
                        return (
                          <motion.div 
                            key={game.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleVote(night.id, game.id)}
                            className={cn(
                              "p-4 rounded-2xl border-4 cursor-pointer transition-all flex items-center gap-4",
                              hasVoted 
                                ? "border-primary bg-primary/5 shadow-md" 
                                : "border-muted bg-muted/20 hover:border-border"
                            )}
                          >
                            <img src={game.thumbnail} className="w-12 h-12 rounded-xl object-cover shadow-sm" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-foreground truncate">{game.name}</p>
                              <p className="text-xs text-muted-foreground font-bold">{voteCount} votes</p>
                            </div>
                            {hasVoted && <CheckCircle2 className="w-5 h-5 text-primary" />}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {night.status === 'active' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between bg-secondary/5 p-8 rounded-3xl border-4 border-white shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary">
                          <Trophy className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="font-black text-foreground text-xl">Session in Progress</h4>
                          <p className="text-muted-foreground font-bold">Recording scores and notes...</p>
                        </div>
                      </div>
                      <Button onClick={() => handleFinishNight(night.id)} className="bg-primary text-white h-12 px-8 rounded-2xl font-black shadow-lg shadow-primary/20">
                        Finish & Save Results
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-black text-foreground flex items-center gap-2">
                            <Users className="w-5 h-5 text-secondary" /> Player Scores
                          </h5>
                          <Button variant="ghost" size="sm" onClick={handleAddScoreRow} className="text-primary font-black">
                            <Plus className="w-4 h-4 mr-1" /> Add Player
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {scores.map((s, i) => (
                            <div key={i} className="flex gap-3">
                              <Input 
                                placeholder="Player Name" 
                                value={s.name}
                                onChange={(e) => handleScoreChange(i, 'name', e.target.value)}
                                className="bg-muted border-none rounded-xl font-bold"
                              />
                              <Input 
                                type="number" 
                                placeholder="Score" 
                                value={s.score}
                                onChange={(e) => handleScoreChange(i, 'score', parseInt(e.target.value) || 0)}
                                className="w-24 bg-muted border-none rounded-xl font-bold"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h5 className="font-black text-foreground flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-accent-foreground" /> Session Notes
                        </h5>
                        <textarea 
                          className="w-full h-32 bg-muted border-none rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none"
                          placeholder="What happened? Epic wins, funny moments..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                        <div className="space-y-2">
                          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Game Played</label>
                          <select 
                            className="w-full bg-muted border-none rounded-xl h-12 px-4 font-bold outline-none"
                            value={selectedGameId}
                            onChange={(e) => setSelectedGameId(e.target.value)}
                          >
                            <option value="">Select a game...</option>
                            {games.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {night.status === 'completed' && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 text-muted-foreground font-bold bg-muted/20 p-8 rounded-3xl border-2 border-dashed border-border">
                      <CheckCircle2 className="w-6 h-6 text-secondary" />
                      <span>This session has ended. Here are the results:</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {night.scores && night.scores.length > 0 && (
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-border">
                          <h5 className="font-black text-foreground mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-primary" /> Final Scores
                          </h5>
                          <div className="space-y-3">
                            {night.scores.sort((a: any, b: any) => b.score - a.score).map((s: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                <span className="font-bold text-foreground flex items-center gap-3">
                                  {i === 0 && <span className="text-xl">👑</span>}
                                  {s.name}
                                </span>
                                <span className="font-black text-primary text-lg">{s.score}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {night.notes && (
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-border">
                          <h5 className="font-black text-foreground mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-secondary" /> Notes
                          </h5>
                          <p className="text-muted-foreground font-medium leading-relaxed italic">"{night.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
        {nights.length === 0 && (
          <div className="py-24 text-center border-4 border-dashed border-muted rounded-[40px] bg-muted/5">
            <Calendar className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
            <p className="text-muted-foreground font-black text-2xl tracking-tight">No game nights scheduled yet.</p>
            <p className="text-muted-foreground/60 font-bold mt-2">Pick a date above to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
