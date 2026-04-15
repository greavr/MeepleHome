import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { createHome, joinHome, leaveHome, updateHome, deleteHome } from '../services/dbService';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Home, LogOut, Settings, Trash2, Users, Check, Plus, ArrowRight } from 'lucide-react';

export function HomeSetup() {
  const { user, profile, updateProfile } = useAuth();
  const [homeName, setHomeName] = useState('');
  const [homeIdToJoin, setHomeIdToJoin] = useState('');
  const [loading, setLoading] = useState(false);
  const [homesData, setHomesData] = useState<any[]>([]);
  const [editingHomeId, setEditingHomeId] = useState<string | null>(null);
  const [newHomeName, setNewHomeName] = useState('');

  useEffect(() => {
    const fetchHomes = async () => {
      if (!profile?.homeIds) return;
      const data = await Promise.all(
        profile.homeIds.map(async (id) => {
          const snap = await getDoc(doc(db, 'homes', id));
          return snap.exists() ? { id, ...snap.data() } : null;
        })
      );
      setHomesData(data.filter(h => h !== null));
    };
    fetchHomes();
  }, [profile?.homeIds]);

  const handleCreate = async () => {
    if (!homeName || !user) return;
    setLoading(true);
    try {
      const homeId = await createHome(homeName, user.uid);
      const newHomeIds = [...(profile?.homeIds || []), homeId];
      await updateProfile({ homeIds: newHomeIds, activeHomeId: homeId });
      setHomeName('');
      toast.success("Home created successfully!");
    } catch (error) {
      console.error("Create Home Error:", error);
      toast.error("Failed to create home.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!homeIdToJoin || !user) return;
    setLoading(true);
    try {
      await joinHome(homeIdToJoin, user.uid);
      const newHomeIds = Array.from(new Set([...(profile?.homeIds || []), homeIdToJoin]));
      await updateProfile({ homeIds: newHomeIds, activeHomeId: homeIdToJoin });
      setHomeIdToJoin('');
      toast.success("Joined home successfully!");
    } catch (error) {
      console.error("Join Home Error:", error);
      toast.error("Failed to join home. Check the ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (homeId: string) => {
    try {
      await updateProfile({ activeHomeId: homeId });
      toast.success("Switched home!");
    } catch (error) {
      toast.error("Failed to switch home.");
    }
  };

  const [confirmingAction, setConfirmingAction] = useState<{ type: 'leave' | 'delete', id: string } | null>(null);

  const handleLeave = async (homeId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await leaveHome(homeId, user.uid);
      const newHomeIds = profile?.homeIds?.filter(id => id !== homeId) || [];
      const newActiveId = profile?.activeHomeId === homeId ? (newHomeIds[0] || undefined) : profile?.activeHomeId;
      await updateProfile({ homeIds: newHomeIds, activeHomeId: newActiveId });
      toast.success("Left home.");
      setConfirmingAction(null);
    } catch (error) {
      toast.error("Failed to leave home.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (homeId: string) => {
    setLoading(true);
    try {
      await deleteHome(homeId);
      const newHomeIds = profile?.homeIds?.filter(id => id !== homeId) || [];
      const newActiveId = profile?.activeHomeId === homeId ? (newHomeIds[0] || undefined) : profile?.activeHomeId;
      await updateProfile({ homeIds: newHomeIds, activeHomeId: newActiveId });
      toast.success("Home deleted.");
      setConfirmingAction(null);
    } catch (error) {
      toast.error("Failed to delete home.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (homeId: string) => {
    if (!newHomeName) return;
    try {
      await updateHome(homeId, { name: newHomeName });
      setEditingHomeId(null);
      setNewHomeName('');
      toast.success("Home name updated!");
      // Refresh local data
      setHomesData(prev => prev.map(h => h.id === homeId ? { ...h, name: newHomeName } : h));
    } catch (error) {
      toast.error("Failed to update name.");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-black tracking-tighter text-foreground">Your Households</h1>
          <p className="text-muted-foreground text-lg font-medium">Manage your board game homes and switch between them.</p>
        </header>

        {/* Active Home Display */}
        {profile?.activeHomeId && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Check className="text-primary" /> Active Household
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {homesData.filter(h => h.id === profile.activeHomeId).map(home => (
                <Card key={home.id} className="bg-primary/5 border-primary/20 shadow-xl rounded-[32px] overflow-hidden">
                  <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                      {editingHomeId === home.id ? (
                        <div className="flex gap-2">
                          <Input 
                            value={newHomeName} 
                            onChange={(e) => setNewHomeName(e.target.value)}
                            placeholder="New Name"
                            className="bg-white border-primary/20"
                          />
                          <Button onClick={() => handleUpdateName(home.id)}>Save</Button>
                          <Button variant="ghost" onClick={() => setEditingHomeId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <h3 className="text-3xl font-black text-foreground">{home.name}</h3>
                      )}
                      <p className="text-muted-foreground font-mono text-sm">ID: {home.id}</p>
                      <div className="flex items-center gap-4 text-sm font-bold text-primary">
                        <span className="flex items-center gap-1"><Users size={16} /> {home.members?.length} Members</span>
                        {home.ownerId === user?.uid && <span className="bg-primary/10 px-2 py-0.5 rounded">Owner</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {confirmingAction?.id === home.id ? (
                        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-inner border border-border">
                          <span className="text-xs font-bold px-2">Confirm {confirmingAction.type}?</span>
                          <Button 
                            variant={confirmingAction.type === 'delete' ? 'destructive' : 'secondary'} 
                            size="sm" 
                            onClick={() => confirmingAction.type === 'delete' ? handleDelete(home.id) : handleLeave(home.id)}
                            disabled={loading}
                          >
                            Yes
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setConfirmingAction(null)}>No</Button>
                        </div>
                      ) : (
                        <>
                          {home.ownerId === user?.uid && (
                            <>
                              <Button variant="outline" size="icon" onClick={() => { setEditingHomeId(home.id); setNewHomeName(home.name); }}>
                                <Settings size={20} />
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => setConfirmingAction({ type: 'delete', id: home.id })}>
                                <Trash2 size={20} />
                              </Button>
                            </>
                          )}
                          <Button variant="secondary" onClick={() => setConfirmingAction({ type: 'leave', id: home.id })}>
                            <LogOut className="mr-2 h-4 w-4" /> Leave
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Other Homes */}
        {homesData.length > 1 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Other Households</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {homesData.filter(h => h.id !== profile?.activeHomeId).map(home => (
                <Card key={home.id} className="bg-white border-none shadow-vibrant rounded-[32px] hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => handleSwitch(home.id)}>
                  <CardHeader>
                    <CardTitle className="font-black text-xl">{home.name}</CardTitle>
                    <CardDescription>{home.members?.length} members</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="ghost" className="w-full group">
                      Switch to Home <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Creation/Joining */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white border-none shadow-vibrant rounded-[40px] overflow-hidden">
            <CardHeader className="p-10 pb-4">
              <CardTitle className="font-black text-3xl tracking-tight text-foreground flex items-center gap-2">
                <Plus className="text-primary" /> Create New
              </CardTitle>
              <CardDescription className="font-medium text-muted-foreground">Start another shared collection.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-4">
              <Input 
                placeholder="Home Name" 
                value={homeName}
                onChange={(e) => setHomeName(e.target.value)}
                className="bg-muted border-none h-14 rounded-2xl px-6 font-bold focus-visible:ring-2 focus-visible:ring-primary shadow-inner"
              />
            </CardContent>
            <CardFooter className="p-10 pt-0">
              <Button 
                onClick={handleCreate} 
                disabled={loading || !homeName}
                className="w-full h-14 bg-primary text-white font-black text-lg rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
              >
                Create Home
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white border-none shadow-vibrant rounded-[40px] overflow-hidden">
            <CardHeader className="p-10 pb-4">
              <CardTitle className="font-black text-3xl tracking-tight text-foreground flex items-center gap-2">
                <Users className="text-secondary" /> Join Existing
              </CardTitle>
              <CardDescription className="font-medium text-muted-foreground">Enter a Home ID to join.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-4">
              <Input 
                placeholder="Home ID" 
                value={homeIdToJoin}
                onChange={(e) => setHomeIdToJoin(e.target.value)}
                className="bg-muted border-none h-14 rounded-2xl px-6 font-bold focus-visible:ring-2 focus-visible:ring-secondary shadow-inner"
              />
            </CardContent>
            <CardFooter className="p-10 pt-0">
              <Button 
                onClick={handleJoin} 
                disabled={loading || !homeIdToJoin}
                variant="outline"
                className="w-full h-14 border-secondary text-secondary font-black text-lg rounded-2xl hover:bg-secondary/5 transition-colors"
              >
                Join Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
