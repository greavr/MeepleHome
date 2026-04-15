import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Heart, Bookmark, Settings, Copy, Check, Library } from 'lucide-react';
import { toast } from 'sonner';
import { importBGGCollection } from '../services/bggService';

export function Profile() {
  const { profile, updateProfile } = useAuth();
  const [bggUsername, setBggUsername] = useState(profile?.bggUsername || '');
  const [copied, setCopied] = useState(false);

  const handleSaveBGG = async () => {
    await updateProfile({ bggUsername });
    toast.success("BGG username updated!");
  };

  const copyHomeId = () => {
    if (profile?.activeHomeId) {
      navigator.clipboard.writeText(profile.activeHomeId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Home ID copied to clipboard!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="flex items-center gap-8 bg-white p-10 rounded-[40px] shadow-vibrant border-4 border-white">
        <Avatar className="w-28 h-28 border-4 border-primary shadow-2xl">
          <AvatarImage src={profile?.photoURL || ''} />
          <AvatarFallback className="text-3xl bg-primary text-white font-black">
            {profile?.displayName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-5xl font-black text-foreground tracking-tight leading-none mb-2">{profile?.displayName}</h1>
          <p className="text-muted-foreground font-bold text-lg">{profile?.email}</p>
          <div className="flex gap-2 mt-4">
            <Badge className="bg-secondary text-white px-3 py-1 rounded-lg font-bold">Member of {profile?.homeIds?.length || 0} Homes</Badge>
            {profile?.bggUsername && <Badge className="bg-accent text-accent-foreground px-3 py-1 rounded-lg font-bold">BGG Linked</Badge>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-white border-none shadow-vibrant rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-black text-foreground">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              Active Home
            </CardTitle>
            <CardDescription className="font-medium">Quick access to your active home ID.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Active Home ID</label>
              <div className="flex gap-3">
                <Input value={profile?.activeHomeId || ''} readOnly className="bg-muted border-none font-mono text-sm h-12 rounded-2xl px-6 shadow-inner" />
                <Button variant="outline" size="icon" onClick={copyHomeId} className="h-12 w-12 rounded-2xl border-border hover:bg-muted">
                  {copied ? <Check className="w-5 h-5 text-secondary" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Share this ID with others to have them join your active home.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-vibrant rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-black text-foreground">
              <div className="p-2 bg-secondary/10 rounded-xl">
                <Library className="w-6 h-6 text-secondary" />
              </div>
              BGG Integration
            </CardTitle>
            <CardDescription className="font-medium">Link your BoardGameGeek account.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">BGG Username</label>
              <div className="flex gap-3">
                <Input 
                  placeholder="Username" 
                  value={bggUsername}
                  onChange={(e) => setBggUsername(e.target.value)}
                  className="bg-white border-border h-12 rounded-2xl px-6 font-bold"
                />
                <Button onClick={handleSaveBGG} className="bg-primary text-white h-12 px-6 rounded-2xl font-black shadow-lg shadow-primary/20">Save</Button>
              </div>
            </div>
            {profile?.bggUsername && (
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-2xl border-border text-foreground font-black gap-3 hover:bg-muted"
                onClick={async () => {
                  try {
                    toast.promise(importBGGCollection(profile.bggUsername!), {
                      loading: 'Fetching BGG collection...',
                      success: (ids) => `Found ${ids.length} games. You can now add them individually.`,
                      error: (err) => err.message
                    });
                  } catch (e) {}
                }}
              >
                <Library className="w-5 h-5 text-secondary" /> Import Collection
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-vibrant rounded-[32px] overflow-hidden md:col-span-2">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-black text-foreground">
              <div className="p-2 bg-accent/20 rounded-xl">
                <Heart className="w-6 h-6 text-accent-foreground" />
              </div>
              Favorites & Wishlist
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="font-black text-foreground flex items-center gap-3 text-lg">
                  <Heart className="w-5 h-5 text-primary" /> Favorites
                </h4>
                <div className="flex flex-wrap gap-3">
                  {profile?.favoriteGames?.length ? profile.favoriteGames.map(g => (
                    <Badge key={g} className="bg-muted text-foreground px-4 py-2 rounded-xl font-bold border border-border">{g}</Badge>
                  )) : (
                    <p className="text-sm text-muted-foreground font-medium italic">No favorites yet.</p>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="font-black text-foreground flex items-center gap-3 text-lg">
                  <Bookmark className="w-5 h-5 text-secondary" /> Wishlist
                </h4>
                <div className="flex flex-wrap gap-3">
                  {profile?.wishlist?.length ? profile.wishlist.map(g => (
                    <Badge key={g} className="bg-muted text-foreground px-4 py-2 rounded-xl font-bold border border-border">{g}</Badge>
                  )) : (
                    <p className="text-sm text-muted-foreground font-medium italic">Wishlist is empty.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
