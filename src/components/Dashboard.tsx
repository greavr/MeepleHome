import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Plus, Calendar, Trophy, Library, User } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  setView: (view: string) => void;
}

export function Dashboard({ setView }: DashboardProps) {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ games: 0, nights: 0, members: 0 });
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [upcomingNight, setUpcomingNight] = useState<any>(null);

  useEffect(() => {
    if (!profile?.activeHomeId) return;

    const gamesRef = collection(db, 'homes', profile.activeHomeId, 'games');
    const nightsRef = collection(db, 'homes', profile.activeHomeId, 'gameNights');

    const unsubGames = onSnapshot(gamesRef, (snap) => {
      setStats(prev => ({ ...prev, games: snap.size }));
      const games = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentGames(games.slice(0, 4));
    });

    const unsubNights = onSnapshot(query(nightsRef, where('status', '==', 'planned'), orderBy('date', 'asc'), limit(1)), (snap) => {
      setStats(prev => ({ ...prev, nights: snap.size }));
      if (!snap.empty) setUpcomingNight({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });

    return () => {
      unsubGames();
      unsubNights();
    };
  }, [profile?.activeHomeId]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-black text-foreground tracking-tight">Dashboard</h1>
            <div className="h-px flex-1 bg-border hidden md:block" />
          </div>
          <p className="text-muted-foreground font-medium">Welcome back to TableTop HQ.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-muted px-4 py-2 rounded-full border border-border shadow-sm">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold overflow-hidden">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                profile?.displayName?.[0] || 'U'
              )}
            </div>
            <span className="font-bold text-sm">{profile?.displayName?.split(' ')[0]}</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setView('collection')} className="bg-primary text-white shadow-lg shadow-primary/20 rounded-xl h-11 px-6 font-bold">
              <Plus className="w-5 h-5 mr-2" /> Add Game
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-none shadow-vibrant rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Library className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Collection</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-foreground">{stats.games}</span>
              <span className="text-muted-foreground font-bold">Games</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4 font-medium">In your shared home library</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-vibrant rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-secondary/10 rounded-2xl">
                <Calendar className="w-6 h-6 text-secondary" />
              </div>
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Upcoming</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {upcomingNight ? new Date(upcomingNight.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-4 font-medium">
              {upcomingNight ? 'Next game night scheduled' : 'Time to plan a session!'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-vibrant rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-accent/20 rounded-2xl">
                <Trophy className="w-6 h-6 text-accent-foreground" />
              </div>
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Sessions</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-foreground">12</span>
              <span className="text-muted-foreground font-bold">Plays</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4 font-medium">Recorded this year</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-foreground tracking-tight">Recently Added</h2>
            <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5" onClick={() => setView('collection')}>View All</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentGames.map((game, i) => (
              <motion.div 
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted border-4 border-white shadow-vibrant"
              >
                <img 
                  src={game.image || game.thumbnail} 
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-white font-bold text-xs line-clamp-2">{game.name}</h3>
                </div>
              </motion.div>
            ))}
            {recentGames.length === 0 && (
              <div className="col-span-4 py-16 text-center border-4 border-dashed border-muted rounded-3xl text-muted-foreground font-bold">
                No games added yet.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-foreground tracking-tight">Home Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border-l-4 border-secondary shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">New session recorded</p>
                  <p className="text-xs text-muted-foreground font-medium">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
