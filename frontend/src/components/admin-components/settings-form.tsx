'use client';

import * as React from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Spinner } from '@/src/components/ui/spinner';
import { getSettings, updateSettings } from '@/src/lib/settings';
import { SocialLinksManager } from './social-links-manager';
import { toast } from 'sonner';
import { Globe, Settings as SettingsIcon, Info, ShieldCheck, Palette, Share2 } from 'lucide-react';

const groupIcons: Record<string, any> = {
  general: SettingsIcon,
  contact: Info,
  seo: ShieldCheck,
  appearance: Palette,
  social: Share2,
};

export function SettingsForm() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [settings, setSettings] = React.useState<Record<string, Record<string, string | null>>>({});

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await getSettings();
      setSettings(res.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (group: string, data: Record<string, string | null>) => {
    setIsSaving(true);
    try {
      await updateSettings(data);
      toast.success(`${group.charAt(0).toUpperCase() + group.slice(1)} settings updated successfully`);
      fetchSettings();
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const groups = Object.keys(settings);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex flex-wrap h-auto p-1 bg-muted/50 backdrop-blur-sm rounded-xl mb-8 gap-1">
          {groups.map((group) => {
            const Icon = groupIcons[group.toLowerCase()] || Globe;
            return (
              <TabsTrigger 
                key={group} 
                value={group}
                className="flex items-center gap-2 px-6 py-3 rounded-lg capitalize data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all flex-1 min-w-[140px]"
              >
                <Icon className="size-4" />
                {group}
              </TabsTrigger>
            );
          })}
          <TabsTrigger 
            value="social-links"
            className="flex items-center gap-2 px-6 py-3 rounded-lg capitalize data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all flex-1 min-w-[140px]"
          >
            <Share2 className="size-4" />
            Social Links
          </TabsTrigger>
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group} value={group}>
            <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardHeader className="pb-8">
                <CardTitle className="text-3xl font-bold capitalize flex items-center gap-3">
                  {group} Configuration
                </CardTitle>
                <CardDescription className="text-base">
                  Customize and manage your website's {group} parameters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form 
                  id={`form-${group}`}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data: Record<string, string | null> = {};
                    formData.forEach((value, key) => {
                      data[key] = value as string;
                    });
                    handleSave(group, data);
                  }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {Object.entries(settings[group]).map(([key, value]) => (
                      <div key={key} className="space-y-2.5 group">
                        <label className="text-sm font-semibold flex items-center gap-1 text-foreground/80 group-focus-within:text-primary transition-colors">
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-destructive">*</span>
                        </label>
                        <Input
                          name={key}
                          defaultValue={value || ''}
                          placeholder={`Enter ${key.replace(/_/g, ' ')}...`}
                          className="h-12 bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
                </form>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 py-6 px-8 flex justify-between items-center">
                <p className="text-sm text-muted-foreground italic">
                  Fields marked with <span className="text-destructive font-bold">*</span> are required.
                </p>
                <Button 
                  form={`form-${group}`} 
                  type="submit" 
                  disabled={isSaving}
                  className="min-w-[160px] h-12 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold text-base"
                >
                  {isSaving ? <Spinner size="sm" className="mr-2" /> : 'Save Parameters'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="social-links">
          <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader className="pb-8">
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                Social Media Presence
              </CardTitle>
              <CardDescription className="text-base">
                Manage your external social media links and platforms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SocialLinksManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
