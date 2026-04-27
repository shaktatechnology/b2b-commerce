'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/src/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Spinner } from '@/src/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { 
  Plus, 
  Trash2, 
  ExternalLink,
  Globe,
  X,
  CheckCircle2,
  Link as LinkIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  FaFacebook, 
  FaInstagram, 
  FaLinkedin, 
  FaXTwitter, 
  FaThreads, 
  FaTiktok 
} from 'react-icons/fa6';
import { toast } from 'sonner';
import { Switch } from '@/src/components/ui/switch';
import { cn } from '@/src/lib/utils';
import { getAuthToken } from '@/src/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const PLATFORMS = [
  { id: 'Facebook', name: 'Facebook', icon: FaFacebook, color: 'text-blue-600' },
  { id: 'Instagram', name: 'Instagram', icon: FaInstagram, color: 'text-pink-600' },
  { id: 'X', name: 'X', icon: FaXTwitter, color: 'text-foreground' },
  { id: 'LinkedIn', name: 'LinkedIn', icon: FaLinkedin, color: 'text-blue-700' },
  { id: 'Threads', name: 'Threads', icon: FaThreads, color: 'text-foreground' },
  { id: 'TikTok', name: 'TikTok', icon: FaTiktok, color: 'text-foreground' },
];

function FieldLabel({ label, icon: Icon, required }: { label: string, icon?: any, required?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2 ml-0.5">
      {Icon && <Icon className="size-3.5 text-primary/60" />}
      <span className="text-sm font-semibold text-foreground/80">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </span>
    </div>
  );
}

export interface SocialLink {
  id: number;
  platform: string;
  label: string | null;
  url: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

export function SocialLinksManager({ initialData = [] }: { initialData?: SocialLink[] }) {
  const [links, setLinks] = React.useState<SocialLink[]>(initialData);
  const [isLoading, setIsLoading] = React.useState(initialData.length === 0);
  const [isSaving, setIsSaving] = React.useState<number | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);

  // New Link State
  const [newLink, setNewLink] = React.useState({
    platform: 'Facebook',
    url: '',
    is_active: true
  });

  const fetchLinks = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/social-links`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const res = await response.json();
      setLinks(res.data || []);
    } catch (error) {
      toast.error('Failed to load social links');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (initialData.length === 0) fetchLinks();
  }, []);

  const handleUpdate = async (id: number, data: Partial<SocialLink>) => {
    setIsSaving(id);
    try {
      const response = await fetch(`${API_URL}/admin/social-links/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      toast.success('Settings synced');
      fetchLinks();
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setIsSaving(null);
    }
  };

  const handleCreate = async () => {
    if (!newLink.url || !newLink.url.startsWith('http')) {
      toast.error('Please enter a valid URL (starting with http)');
      return;
    }

    setIsSaving(0);
    try {
      const response = await fetch(`${API_URL}/admin/social-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          ...newLink,
          label: newLink.platform,
          icon: newLink.platform.toLowerCase(),
          sort_order: links.length ? Math.max(...links.map(l => l.sort_order)) + 1 : 0
        })
      });

      if (!response.ok) throw new Error('Creation failed');

      toast.success('Social link added');
      setNewLink({ platform: 'Facebook', url: '', is_active: true });
      setShowAddForm(false);
      fetchLinks();
    } catch (error) {
      toast.error('Failed to add network');
    } finally {
      setIsSaving(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently remove this social link?')) return;
    try {
      const response = await fetch(`${API_URL}/admin/social-links/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) throw new Error('Deletion failed');

      toast.success('Link deleted');
      fetchLinks();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getPlatformIcon = (platformName: string) => {
    const platform = PLATFORMS.find(p => p.id.toLowerCase() === platformName.toLowerCase());
    if (platform) return <platform.icon className={cn("size-4", platform.color)} />;
    return <Globe className="size-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Social Presence</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your official network handles and brand visibility.</p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} className="gap-2 h-11 px-6 rounded-xl shadow-lg shadow-primary/10 cursor-pointer font-bold transition-all hover:scale-[1.02]">
            <Plus className="size-4" /> Add New Link
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden px-2"
          >
            <Card className="border-border/50 shadow-[0_10px_30px_rgba(0,0,0,0.04)] bg-card/50 backdrop-blur-3xl rounded-[2rem] overflow-hidden border border-white/10 mb-8">
              <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><LinkIcon className="size-5" /></div>
                  <div>
                    <CardTitle className="text-lg font-bold">New Social Connection</CardTitle>
                    <CardDescription className="text-xs">Configure the platform and destination URL.</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="rounded-full hover:bg-muted cursor-pointer size-10">
                  <X className="size-5" />
                </Button>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <FieldLabel label="Select Platform" icon={Globe} required />
                    <Select 
                      value={newLink.platform} 
                      onValueChange={(val) => setNewLink(prev => ({ ...prev, platform: val }))}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border font-semibold px-4">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-2xl border-border/50 z-[9999] !bg-white !opacity-100 shadow-black/20 !text-slate-900">
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="rounded-lg py-2.5">
                            <div className="flex items-center gap-3">
                              <p.icon className={cn("size-4", p.color)} />
                              <span className="font-medium">{p.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <FieldLabel label="Redirect URL" icon={LinkIcon} required />
                    <Input 
                      placeholder="e.g. https://instagram.com/yourbrand"
                      value={newLink.url}
                      onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                      className="h-11 rounded-xl bg-background/50 border-border text-sm font-medium px-4 focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-border/10">
                  <div className="flex items-center gap-4 bg-muted/30 px-6 py-3 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-2">
                      {newLink.is_active ? <Eye className="size-4 text-primary" /> : <EyeOff className="size-4 text-muted-foreground" />}
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Public Visibility</span>
                    </div>
                    <Switch 
                      checked={newLink.is_active} 
                      onCheckedChange={(checked) => setNewLink(prev => ({ ...prev, is_active: checked }))}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="ghost" onClick={() => setShowAddForm(false)} className="h-11 px-8 rounded-xl font-bold cursor-pointer">
                      Discard
                    </Button>
                    <Button 
                      onClick={handleCreate} 
                      disabled={isSaving === 0} 
                      className="h-11 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 flex-1 md:flex-none cursor-pointer transition-all active:scale-95"
                    >
                      {isSaving === 0 ? <Spinner size="sm" className="mr-2" /> : <Plus className="size-4 mr-2" />}
                      Establish Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-2">
        <div className="rounded-2xl border border-border/50 bg-background/30 backdrop-blur-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-border/50 h-12">
                <TableHead className="pl-8 font-bold text-foreground/70">Platform</TableHead>
                <TableHead className="font-bold text-foreground/70">Redirect URL</TableHead>
                <TableHead className="w-[100px] text-center font-bold text-foreground/70">Status</TableHead>
                <TableHead className="w-[120px] text-right pr-8 font-bold text-foreground/70">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Spinner size="lg" className="text-primary/20" />
                      <span className="text-xs text-muted-foreground font-medium animate-pulse">Syncing network state...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : links.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-muted-foreground text-xs italic">
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                      <div className="p-4 bg-muted/30 rounded-full"><LinkIcon className="size-8 opacity-20" /></div>
                      <p className="text-sm font-medium italic">No social links connected. Use the form above to add your first network.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                links.map((link) => (
                  <TableRow key={link.id} className="group border-border/40 hover:bg-muted/20 transition-colors h-20">
                    <TableCell className="pl-8">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-muted/50 rounded-xl group-hover:bg-background transition-colors">
                          {getPlatformIcon(link.platform)}
                        </div>
                        <span className="font-bold text-sm text-foreground/80">{link.platform}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Input 
                          defaultValue={link.url}
                          onBlur={(e) => {
                            if (e.target.value !== link.url) handleUpdate(link.id, { url: e.target.value });
                          }}
                          className="h-11 border-none bg-muted/20 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/10 transition-all text-xs font-medium px-4"
                          placeholder="https://..."
                        />
                        <Link 
                          href={link.url} 
                          target="_blank" 
                          className="size-10 flex items-center justify-center bg-primary/5 text-primary rounded-xl hover:bg-primary/10 transition-all shadow-sm border border-primary/10"
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={link.is_active} 
                        onCheckedChange={(checked) => handleUpdate(link.id, { is_active: checked })}
                        className="data-[state=checked]:bg-primary scale-90"
                      />
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end items-center gap-2">
                        {isSaving === link.id ? (
                          <div className="p-2"><Spinner size="sm" /></div>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-11 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
                            onClick={() => handleDelete(link.id)}
                          >
                            <Trash2 className="size-5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
