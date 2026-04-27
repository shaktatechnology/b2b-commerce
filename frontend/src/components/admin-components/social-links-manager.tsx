'use client';

import * as React from 'react';
import { 
  getAdminSocialLinks, 
  updateSocialLink, 
  createSocialLink, 
  deleteSocialLink,
  SocialLink 
} from '@/src/lib/social-links';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { 
  Card, 
  CardContent 
} from '@/src/components/ui/card';
import { Spinner } from '@/src/components/ui/spinner';
import { Plus, Trash2, Globe, Link as LinkIcon, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/src/components/ui/switch';
import { cn } from '@/src/lib/utils';

export function SocialLinksManager() {
  const [links, setLinks] = React.useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState<number | null>(null);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminSocialLinks();
      setLinks(res.data);
    } catch (error) {
      console.error('Failed to fetch social links:', error);
      toast.error('Failed to load social links');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLinks();
  }, []);

  const handleUpdate = async (id: number, data: Partial<SocialLink>) => {
    setIsSaving(id);
    try {
      await updateSocialLink(id, data);
      toast.success('Social link updated');
      fetchLinks();
    } catch (error) {
      console.error('Failed to update social link:', error);
      toast.error('Failed to update social link');
    } finally {
      setIsSaving(null);
    }
  };

  const handleCreate = async () => {
    try {
      await createSocialLink({
        platform: 'New Platform',
        url: 'https://',
        label: 'New Link',
        icon: 'website',
        is_active: true,
        sort_order: links.length ? Math.max(...links.map(l => l.sort_order)) + 1 : 0
      });
      toast.success('New social link added');
      fetchLinks();
    } catch (error) {
      console.error('Failed to create social link:', error);
      toast.error('Failed to add social link');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this social link?')) return;
    try {
      await deleteSocialLink(id);
      toast.success('Social link deleted');
      fetchLinks();
    } catch (error) {
      console.error('Failed to delete social link:', error);
      toast.error('Failed to delete social link');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Manage each platform's URL and visibility status.</p>
        <Button onClick={handleCreate} className="gap-2 h-11 px-6 rounded-xl shadow-md">
          <Plus className="size-4" /> Add New Platform
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {links.map((link) => (
          <Card key={link.id} className="border-none shadow-lg bg-background/50 backdrop-blur-sm group hover:ring-2 hover:ring-primary/20 transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x border-b lg:border-none">
                
                <div className="p-6 flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
                        <Globe className="size-3" /> Platform <span className="text-destructive">*</span>
                      </label>
                      <Input 
                        defaultValue={link.platform} 
                        placeholder="e.g. Facebook, Twitter..."
                        className="h-11 rounded-lg"
                        onBlur={(e) => {
                          if (e.target.value !== link.platform) 
                            handleUpdate(link.id, { platform: e.target.value });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
                        <Hash className="size-3" /> Icon Class
                      </label>
                      <Input 
                        defaultValue={link.icon || ''} 
                        placeholder="e.g. facebook, twitter..."
                        className="h-11 rounded-lg"
                        onBlur={(e) => {
                          if (e.target.value !== link.icon) 
                            handleUpdate(link.id, { icon: e.target.value });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 leading-none">
                      <LinkIcon className="size-3" /> Redirect URL <span className="text-destructive">*</span>
                    </label>
                    <Input 
                      defaultValue={link.url} 
                      placeholder="https://example.com/username"
                      className="h-11 rounded-lg"
                      onBlur={(e) => {
                        if (e.target.value !== link.url) 
                          handleUpdate(link.id, { url: e.target.value });
                      }}
                    />
                  </div>
                </div>

                <div className="lg:w-48 p-6 bg-muted/20 flex lg:flex-col items-center justify-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-medium", !link.is_active && "text-muted-foreground")}>Off</span>
                      <Switch 
                        checked={link.is_active} 
                        onCheckedChange={(checked) => handleUpdate(link.id, { is_active: checked })}
                      />
                      <span className={cn("text-xs font-medium text-primary", !link.is_active && "text-muted-foreground")}>On</span>
                    </div>
                  </div>
                  
                  <div className="lg:w-full lg:mt-auto">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full h-10 rounded-lg gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  </div>
                </div>

              </div>
              {isSaving === link.id && (
                <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                  <Spinner size="sm" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
