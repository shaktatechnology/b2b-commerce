'use client';

import * as React from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
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
import { getAuthToken } from '@/src/lib/auth';
import { SocialLinksManager } from './social-links-manager';
import { toast } from 'sonner';
import { 
  Globe, 
  Settings as SettingsIcon, 
  Info, 
  Search, 
  Share2, 
  Plus, 
  Trash2, 
  Upload, 
  X,
  Mail,
  Phone,
  MapPin,
  Copyright,
  AlertCircle,
  Layout,
  Layers,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/src/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL;

// --- Sub-components ---

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, y: -5 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex items-center gap-1.5 text-destructive text-[11px] font-medium mt-1 ml-1"
    >
      <AlertCircle className="size-3" />
      {message}
    </motion.div>
  );
}

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

function MultiInput({ 
  label, 
  values, 
  onChange, 
  icon: Icon, 
  placeholder,
  error,
  required
}: { 
  label: string; 
  values: string[]; 
  onChange: (vals: string[]) => void; 
  icon: any;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  // Ensure we have at least one slot if we want to show it in input
  const mainValue = values[0] || '';
  const tags = values.slice(1);

  const handleInputChange = (val: string) => {
    const newValues = [...values];
    if (newValues.length === 0) {
      newValues.push(val);
    } else {
      newValues[0] = val;
    }
    onChange(newValues);
  };

  const addSlot = () => {
    // Push a new empty string to the front and shift others
    onChange(['', ...values.filter(v => v !== '')]);
  };

  const removeTag = (tagIndex: number) => {
    // tagIndex is relative to the tags array (index 1 in original)
    const newValues = values.filter((_, i) => i !== tagIndex + 1);
    onChange(newValues);
  };

  const swapToMain = (tagIndex: number) => {
    const newValues = [...values];
    const targetIndex = tagIndex + 1;
    const temp = newValues[0];
    newValues[0] = newValues[targetIndex];
    newValues[targetIndex] = temp;
    onChange(newValues);
  };

  return (
    <div className="space-y-1">
      <FieldLabel label={label} icon={Icon} required={required} />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input 
            value={mainValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "rounded-xl h-11 bg-background/50 border-border text-sm px-4 focus:ring-4 focus:ring-primary/5 transition-all pr-10",
              error && "border-destructive/40 focus:border-destructive"
            )}
          />
          {mainValue && (
            <button 
              onClick={() => handleInputChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-destructive transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button 
          type="button" 
          onClick={addSlot} 
          size="icon" 
          className="shrink-0 rounded-xl h-11 w-11 shadow-lg shadow-primary/10 transition-transform active:scale-90 cursor-pointer"
          title="Add another"
        >
          <Plus className="size-5" />
        </Button>
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-300">
          <AnimatePresence>
            {tags.map((tag, i) => (
              <motion.div 
                key={`${tag}-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 bg-muted/30 hover:bg-muted/60 text-foreground/60 px-3 py-1.5 rounded-lg text-xs font-medium border border-border group transition-all cursor-pointer"
                onClick={() => swapToMain(i)}
              >
                <span className="max-w-[150px] truncate">{tag}</span>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(i);
                  }} 
                  className="text-muted-foreground/40 hover:text-destructive transition-colors"
                >
                  <X className="size-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <ErrorMessage message={error} />
    </div>
  );
}

function ImageUpload({ 
  label, 
  value, 
  onChange,
  icon: Icon
}: { 
  label: string; 
  value: string | null; 
  onChange: (file: File | null) => void;
  icon?: any;
}) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getImageUrl = (val: string | null) => {
    if (!val) return null;
    if (val.startsWith('data:') || val.startsWith('blob:')) return val;
    if (val.startsWith('http')) return val;
    return `${STORAGE_URL}${val.replace('/storage', '')}`;
  };

  const displayImage = preview || getImageUrl(value);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-1">
      <FieldLabel label={label} icon={Icon} />
      <div 
        className="relative group cursor-pointer border-2 border-dashed border-muted-foreground/10 rounded-2xl overflow-hidden hover:border-primary/30 hover:bg-muted/30 transition-all aspect-video flex items-center justify-center bg-muted/10"
        onClick={() => fileInputRef.current?.click()}
      >
        {displayImage ? (
          <img src={displayImage} alt={label} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground/40 transition-colors group-hover:text-primary/60">
            <Upload className="size-6" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Select {label}</span>
          </div>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        {displayImage && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <div className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold shadow-2xl">Change Image</div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Form ---

export function SettingsForm({ 
  initialSettings = {}, 
  initialSocialLinks = [] 
}: { 
  initialSettings?: Record<string, any>, 
  initialSocialLinks?: any[] 
}) {
  const [isLoading, setIsLoading] = React.useState(!Object.keys(initialSettings).length);
  const [isSaving, setIsSaving] = React.useState(false);
  const [settings, setSettings] = React.useState<Record<string, any>>(initialSettings);
  const [uploadedFiles, setUploadedFiles] = React.useState<Record<string, File>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = React.useState('general');

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/settings`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const res = await response.json();
      const flat: Record<string, any> = {};
      if (res.data) {
        Object.values(res.data).forEach((group: any) => {
          if (group && typeof group === 'object') {
            Object.entries(group).forEach(([key, val]) => { flat[key] = val; });
          }
        });
      }
      setSettings(flat);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  React.useEffect(() => { fetchSettings(); }, []);

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleFileChange = (key: string, file: File | null) => {
    if (file) setUploadedFiles(prev => ({ ...prev, [key]: file }));
  };

  const validate = (group: string) => {
    const newErrors: Record<string, string> = {};
    const values = settings;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Phone validation: 
    // - If starts with 98, must be 10 digits total (98XXXXXXXX)
    // - If starts with +, allow 10-15 digits after +
    // - Otherwise allow 7-15 digits
    const validatePhone = (phone: string) => {
      const cleanPhone = phone.replace(/\s+/g, '');
      if (cleanPhone.startsWith('98')) {
        return /^98\d{8}$/.test(cleanPhone);
      }
      if (cleanPhone.startsWith('+')) {
        return /^\+\d{10,15}$/.test(cleanPhone);
      }
      return /^\d{7,15}$/.test(cleanPhone);
    };

    if (group === 'general') {
      if (!values.site_name) newErrors.site_name = 'Website name is required';
      if (!values.site_tagline) newErrors.site_tagline = 'Tagline is required';
      
      const emails = parseJSON(values.official_emails);
      if (!emails.length) {
        newErrors.official_emails = 'Add at least one email';
      } else {
        const invalidEmails = emails.filter((email: string) => !emailRegex.test(email));
        if (invalidEmails.length > 0) {
          newErrors.official_emails = 'One or more emails are invalid';
        }
      }

      const phones = parseJSON(values.phone_numbers);
      if (phones.length > 0) {
        const invalidPhones = phones.filter((phone: string) => !validatePhone(phone));
        if (invalidPhones.length > 0) {
          newErrors.phone_numbers = 'One or more phone numbers are invalid (e.g. 98XXXXXXXX)';
        }
      }
    } else if (group === 'seo') {
      if (!values.meta_title) newErrors.meta_title = 'Title template is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (group: string) => {
    if (!validate(group)) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('_method', 'PUT');

      const groupKeys: Record<string, string[]> = {
        general: ['site_name', 'site_tagline', 'site_logo', 'site_favicon', 'official_emails', 'phone_numbers', 'office_address', 'copyright_text'],
        about: ['about_title', 'about_description', 'mission_statement', 'vision_statement', 'company_history', 'about_image'],
        seo: ['meta_title', 'meta_description', 'meta_keywords'],
      };

      const keysToSave = groupKeys[group] || [];
      keysToSave.forEach(key => {
        if (uploadedFiles[key]) {
          formData.append(key, uploadedFiles[key]);
        } else if (settings[key] !== undefined) {
          const val = settings[key];
          formData.append(key, Array.isArray(val) ? JSON.stringify(val) : (val || ''));
        }
      });

      const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update failed');
      }

      toast.success(`${group.charAt(0).toUpperCase() + group.slice(1)} settings saved`);
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const parseJSON = (val: any) => {
    if (Array.isArray(val)) return val;
    if (!val) return [];
    try { 
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <Spinner size="lg" className="text-primary/10" />
          <Spinner size="md" className="absolute text-primary border-t-transparent" />
        </div>
        <span className="text-xs font-medium text-muted-foreground animate-pulse">Loading system settings...</span>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Layout },
    { id: 'about', label: 'About Us', icon: Info },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'social-links', label: 'Social Media', icon: Share2 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Website Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your website's identity, contact information, and search optimization.</p>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="h-11 bg-muted/40 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="h-9 rounded-lg px-6 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all gap-2"
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="w-full">
        <AnimatePresence mode="wait">
          {tabs.map((tab) => activeTab === tab.id && (
            <motion.div 
              key={tab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-border/50 shadow-sm bg-card/30 backdrop-blur-3xl rounded-[2rem] overflow-hidden">
                <CardHeader className={cn("p-10 pb-6 border-b border-border/10 bg-muted/5", tab.id === 'social-links' && "hidden")}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner"><tab.icon className="size-6" /></div>
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight">{tab.label} Configuration</CardTitle>
                      <CardDescription className="text-sm opacity-60">Update your {tab.label.toLowerCase()} details below.</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-10 space-y-10">
                  {tab.id === 'general' && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                          <div className="space-y-1">
                            <FieldLabel label="Website Name" icon={Globe} required />
                            <Input 
                              value={settings.site_name || ''} 
                              onChange={e => handleInputChange('site_name', e.target.value)}
                              placeholder="e.g. My Commerce Store"
                              className={cn("h-11 rounded-xl bg-background/50 border-border text-sm px-4", errors.site_name && "border-destructive/40")}
                            />
                            <ErrorMessage message={errors.site_name} />
                          </div>
                          <div className="space-y-1">
                            <FieldLabel label="Site Tagline" icon={Layout} required />
                            <Input 
                              value={settings.site_tagline || ''} 
                              onChange={e => handleInputChange('site_tagline', e.target.value)}
                              placeholder="e.g. Best products at best prices"
                              className={cn("h-11 rounded-xl bg-background/50 border-border text-sm px-4", errors.site_tagline && "border-destructive/40")}
                            />
                            <ErrorMessage message={errors.site_tagline} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <ImageUpload label="Website Logo" value={settings.site_logo} onChange={file => handleFileChange('site_logo', file)} icon={Upload} />
                          <ImageUpload label="Browser Favicon" value={settings.site_favicon} onChange={file => handleFileChange('site_favicon', file)} icon={Globe} />
                        </div>
                      </div>

                      <div className="h-px bg-border/40" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <MultiInput label="Official Emails" values={parseJSON(settings.official_emails)} onChange={vals => handleInputChange('official_emails', vals)} icon={Mail} placeholder="e.g. hello@site.com" error={errors.official_emails} required />
                        <MultiInput label="Phone Numbers" values={parseJSON(settings.phone_numbers)} onChange={vals => handleInputChange('phone_numbers', vals)} icon={Phone} placeholder="e.g. +1 000 000 000" error={errors.phone_numbers} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-1">
                          <FieldLabel label="Office Address" icon={MapPin} />
                          <Textarea 
                            value={settings.office_address || ''} 
                            onChange={e => handleInputChange('office_address', e.target.value)}
                            placeholder="Full physical address..."
                            className="min-h-[100px] rounded-xl bg-background/50 border-border p-4 text-sm resize-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <FieldLabel label="Copyright Text" icon={Copyright} />
                          <Input 
                            value={settings.copyright_text || ''} 
                            onChange={e => handleInputChange('copyright_text', e.target.value)}
                            placeholder="e.g. © 2026 Your Brand"
                            className="h-11 rounded-xl bg-background/50 border-border text-sm px-4"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {tab.id === 'about' && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-6">
                          <div className="space-y-1">
                            <FieldLabel label="About Page Title" icon={Info} />
                            <Input 
                              value={settings.about_title || ''} 
                              onChange={e => handleInputChange('about_title', e.target.value)}
                              placeholder="Headline for your company story..."
                              className="h-11 rounded-xl bg-background/50 border-border text-sm px-4"
                            />
                          </div>
                          <div className="space-y-1">
                            <FieldLabel label="Main Description" icon={Layout} />
                            <Textarea 
                              value={settings.about_description || ''} 
                              onChange={e => handleInputChange('about_description', e.target.value)}
                              placeholder="Tell your brand story..."
                              className="min-h-[180px] rounded-xl bg-background/50 border-border p-4 text-sm resize-none"
                            />
                          </div>
                        </div>
                        <ImageUpload label="Featured Image" value={settings.about_image} onChange={file => handleFileChange('about_image', file)} icon={Upload} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-1">
                          <FieldLabel label="Mission Statement" icon={Layers} />
                          <Textarea 
                            value={settings.mission_statement || ''} 
                            onChange={e => handleInputChange('mission_statement', e.target.value)}
                            placeholder="Our mission is to..."
                            className="min-h-[100px] rounded-xl bg-background/50 border-border p-4 text-sm resize-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <FieldLabel label="Vision Statement" icon={Search} />
                          <Textarea 
                            value={settings.vision_statement || ''} 
                            onChange={e => handleInputChange('vision_statement', e.target.value)}
                            placeholder="Our vision is to..."
                            className="min-h-[100px] rounded-xl bg-background/50 border-border p-4 text-sm resize-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <FieldLabel label="Company History" icon={History} />
                        <Textarea 
                          value={settings.company_history || ''} 
                          onChange={e => handleInputChange('company_history', e.target.value)}
                          placeholder="Our journey since the beginning..."
                          className="min-h-[200px] rounded-xl bg-background/50 border-border p-4 text-sm resize-none"
                        />
                      </div>
                    </>
                  )}

                  {tab.id === 'seo' && (
                    <div className="space-y-8 max-w-3xl">
                      <div className="space-y-1">
                        <FieldLabel label="Meta Title Template" icon={Search} required />
                        <Input 
                          value={settings.meta_title || ''} 
                          onChange={handleInputChange.bind(null, 'meta_title')}
                          placeholder="e.g. [Title] | My Brand"
                          className={cn("h-11 rounded-xl bg-background/50 border-border text-sm px-4", errors.meta_title && "border-destructive/40")}
                        />
                        <ErrorMessage message={errors.meta_title} />
                      </div>
                      <div className="space-y-1">
                        <FieldLabel label="Meta Description" icon={Layout} />
                        <Textarea 
                          value={settings.meta_description || ''} 
                          onChange={e => handleInputChange('meta_description', e.target.value)}
                          placeholder="Brief summary for search results..."
                          className="min-h-[120px] rounded-xl bg-background/50 border-border p-4 text-sm resize-none"
                        />
                      </div>
                      <MultiInput label="Search Keywords" values={parseJSON(settings.meta_keywords)} onChange={vals => handleInputChange('meta_keywords', vals)} icon={Search} placeholder="e.g. ecommerce, wholesale" />
                    </div>
                  )}

                  {tab.id === 'social-links' && (
                    <SocialLinksManager initialData={initialSocialLinks} />
                  )}
                </CardContent>

                {tab.id !== 'social-links' && (
                  <CardFooter className="p-10 pt-4 border-t border-border/10 bg-muted/5 flex justify-end">
                    <Button 
                      onClick={() => handleSave(tab.id)} 
                      disabled={isSaving} 
                      className="px-10 h-12 rounded-2xl shadow-xl shadow-primary/10 font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                      {isSaving ? <Spinner size="sm" className="mr-3" /> : `Save ${tab.label} Settings`}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
