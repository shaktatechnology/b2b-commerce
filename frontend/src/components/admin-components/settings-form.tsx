'use client';

import * as React from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardFooter
} from '@/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Spinner } from '@/src/components/ui/spinner';
import { Switch } from '@/src/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/src/components/ui/select';
import { getSettings, updateSettings } from '@/src/lib/settings';
import { toast } from 'sonner';
import { 
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaTiktok,
  FaWhatsapp
} from 'react-icons/fa';
import { 
  Globe, 
  Building2, 
  CreditCard, 
  Share2, 
  Mail, 
  Phone, 
  MapPin, 
  Search, 
  Monitor, 
  Briefcase, 
  Layers, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  MessageSquare,
  Eye,
  EyeOff,
  Upload,
  X,
  HandCoins
} from 'lucide-react';

export function SettingsForm() {
  const labelStyle: React.CSSProperties = {
    fontStyle: 'normal',
    fontWeight: 500,
    color: 'lab(15.204 0 -0.00000596046)',
    fontSize: '14px',
    lineHeight: '14px'
  };

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showEsewaSecret, setShowEsewaSecret] = React.useState(false);
  const [showPaypalSecret, setShowPaypalSecret] = React.useState(false);
  const [settings, setSettings] = React.useState<Record<string, string | null>>({});

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await getSettings();
      // Flatten settings groups into a single key-value dictionary
      const flatSettings: Record<string, string | null> = {};
      Object.keys(res.data).forEach(group => {
        Object.keys(res.data[group]).forEach(key => {
          flatSettings[key] = res.data[group][key];
        });
      });
      setSettings(flatSettings);
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

  const handleChange = (key: string, value: string | null) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleChange(key, base64String);
      toast.success(`${key === 'site_logo' ? 'Logo' : 'Favicon'} selected!`);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent, groupKeys: string[], groupName: string) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Prepare only settings belonging to this tab's group to save
    const payload: Record<string, string | null> = {};
    groupKeys.forEach(key => {
      payload[key] = settings[key] !== undefined ? settings[key] : null;
    });

    try {
      await updateSettings(payload);
      toast.success(`${groupName} settings updated successfully`);
      fetchSettings();
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error(`Failed to update ${groupName.toLowerCase()} settings`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center bg-white rounded-2xl border border-border/40">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" className="text-primary" />
          <p className="text-sm text-gray-700 animate-pulse font-medium">Loading settings panel...</p>
        </div>
      </div>
    );
  }

  // Define exact key groupings
  const generalKeys = [
    'site_name', 'site_tagline', 'site_logo', 'site_favicon',
    'contact_email', 'contact_phone', 'contact_address',
    'google_analytics', 'meta_description'
  ];

  const businessKeys = [
    'business_name', 'business_email', 'business_phone', 'business_address',
    'business_website', 'business_pan', 'business_vat', 'business_reg_number',
    'business_currency', 'business_timezone'
  ];

  const paymentKeys = [
    'payment_gateway', 'esewa_active', 'esewa_merchant_code', 'esewa_secret_key', 'esewa_mode',
    'paypal_active', 'paypal_client_id', 'paypal_client_secret', 'paypal_mode', 'cod_active'
  ];

  const socialKeys = [
    'facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url',
    'youtube_url', 'tiktok_url', 'whatsapp_number'
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Tabs defaultValue="general" className="w-full">
        {/* Flat Tab list with white and light gray borders, absolutely NO shadow */}
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-gray-50 border border-gray-200/80 rounded-xl mb-6 shadow-none gap-1">
          <TabsTrigger 
            value="general"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg capitalize border border-transparent data-[state=active]:bg-white data-[state=active]:border-gray-200 data-[state=active]:text-primary transition-all font-semibold text-xs shadow-none"
          >
            <Globe className="size-4" />
            General Settings
          </TabsTrigger>
          <TabsTrigger 
            value="business"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg capitalize border border-transparent data-[state=active]:bg-white data-[state=active]:border-gray-200 data-[state=active]:text-primary transition-all font-semibold text-xs shadow-none"
          >
            <Building2 className="size-4" />
            Business Details
          </TabsTrigger>
          <TabsTrigger 
            value="payment"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg capitalize border border-transparent data-[state=active]:bg-white data-[state=active]:border-gray-200 data-[state=active]:text-primary transition-all font-semibold text-xs shadow-none"
          >
            <CreditCard className="size-4" />
            Payment Gateway
          </TabsTrigger>
          <TabsTrigger 
            value="social"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg capitalize border border-transparent data-[state=active]:bg-white data-[state=active]:border-gray-200 data-[state=active]:text-primary transition-all font-semibold text-xs shadow-none"
          >
            <Share2 className="size-4" />
            Social Presence
          </TabsTrigger>
        </TabsList>

        {/* ── GENERAL SETTINGS TAB ── */}
        <TabsContent value="general" className="outline-none">
          <form onSubmit={(e) => handleSave(e, generalKeys, 'General')}>
            {/* Pure white background card with no shadow */}
            <Card className="border border-gray-200/80 bg-white rounded-xl shadow-none overflow-hidden">
              <CardContent className="p-6 space-y-6">
                {/* Site Branding Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                    <Briefcase className="size-4 text-primary" /> Branding & Title
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label style={labelStyle}>Site Name</label>
                      <Input
                        value={settings.site_name || ''}
                        onChange={(e) => handleChange('site_name', e.target.value)}
                        placeholder="e.g. Shakta B2B Commerce"
                        className="h-10 rounded-lg bg-white border-gray-200 focus:border-primary/50 focus:ring-0 shadow-none text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label style={labelStyle}>Site Tagline</label>
                      <Input
                        value={settings.site_tagline || ''}
                        onChange={(e) => handleChange('site_tagline', e.target.value)}
                        placeholder="e.g. Premium Wholesale Partner"
                        className="h-10 rounded-lg bg-white border-gray-200 focus:border-primary/50 focus:ring-0 shadow-none text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Upload Card */}
                    <div className="space-y-2">
                      <label style={labelStyle}>Website Logo</label>
                      <div className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center min-h-[140px] text-center gap-3">
                        {settings.site_logo ? (
                          <div className="flex flex-col items-center gap-2.5 w-full">
                            <div className="h-16 w-full max-w-[200px] rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center p-2 overflow-hidden">
                              <img src={settings.site_logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                            </div>
                            <div className="flex gap-2">
                              <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors">
                                <Upload className="size-3.5 text-gray-500" /> Change
                              </label>
                              <button
                                type="button"
                                onClick={() => handleChange('site_logo', null)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-red-600 transition-colors"
                              >
                                <X className="size-3.5 text-red-500" /> Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center gap-2 group w-full py-4">
                            <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 group-hover:text-primary transition-colors">
                              <Upload className="size-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">Upload site logo</span>
                              <p className="text-[10px] text-gray-500">Supports PNG, JPG, SVG up to 10MB</p>
                            </div>
                          </label>
                        )}
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'site_logo')}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Favicon Upload Card */}
                    <div className="space-y-2">
                      <label style={labelStyle}>Website Favicon</label>
                      <div className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center min-h-[140px] text-center gap-3">
                        {settings.site_favicon ? (
                          <div className="flex flex-col items-center gap-2.5 w-full">
                            <div className="size-16 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center p-2 overflow-hidden">
                              <img src={settings.site_favicon} alt="Favicon" className="max-h-full max-w-full object-contain" />
                            </div>
                            <div className="flex gap-2">
                              <label htmlFor="favicon-upload" className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors">
                                <Upload className="size-3.5 text-gray-500" /> Change
                              </label>
                              <button
                                type="button"
                                onClick={() => handleChange('site_favicon', null)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-red-600 transition-colors"
                              >
                                <X className="size-3.5 text-red-500" /> Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="favicon-upload" className="cursor-pointer flex flex-col items-center gap-2 group w-full py-4">
                            <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 group-hover:text-primary transition-colors">
                              <Upload className="size-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">Upload site favicon</span>
                              <p className="text-[10px] text-gray-500">Supports ICO, PNG, GIF up to 10MB</p>
                            </div>
                          </label>
                        )}
                        <input
                          id="favicon-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'site_favicon')}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Contact & Support Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                    <Mail className="size-4 text-primary" /> Contact Channels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1" style={labelStyle}>
                        <Mail className="size-3 text-gray-500" /> Contact Email
                      </label>
                      <Input
                        type="email"
                        value={settings.contact_email || ''}
                        onChange={(e) => handleChange('contact_email', e.target.value)}
                        placeholder="support@shaktatech.com"
                        className="h-10 rounded-lg bg-white border-gray-200 text-sm shadow-none text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1" style={labelStyle}>
                        <Phone className="size-3 text-gray-500" /> Contact Phone
                      </label>
                      <Input
                        value={settings.contact_phone || ''}
                        onChange={(e) => handleChange('contact_phone', e.target.value)}
                        placeholder="+977-1-234567"
                        className="h-10 rounded-lg bg-white border-gray-200 text-sm shadow-none text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1" style={labelStyle}>
                      <MapPin className="size-3 text-gray-500" /> Contact Address
                    </label>
                    <textarea
                      value={settings.contact_address || ''}
                      onChange={(e) => handleChange('contact_address', e.target.value)}
                      placeholder="Maitighar, Kathmandu, Nepal"
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* SEO & Engine parameters */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                    <Search className="size-4 text-primary" /> SEO & Analytics
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label style={labelStyle}>Google Analytics Tracking ID</label>
                      <Input
                        value={settings.google_analytics || ''}
                        onChange={(e) => handleChange('google_analytics', e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                        className="h-10 rounded-lg bg-white border-gray-200 text-sm shadow-none text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label style={labelStyle}>Meta Description</label>
                      <textarea
                        value={settings.meta_description || ''}
                        onChange={(e) => handleChange('meta_description', e.target.value)}
                        placeholder="A modern, high-speed B2B e-commerce platform facilitating simple bulk procurement..."
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-100 bg-gray-50/50 py-4 px-6 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="h-10 rounded-lg font-semibold transition-all px-6 shadow-none text-xs text-white"
                >
                  {isSaving ? <Spinner size="sm" className="mr-2" /> : 'Save General Details'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* ── BUSINESS DETAILS TAB ── */}
        <TabsContent value="business" className="outline-none">
          <form onSubmit={(e) => handleSave(e, businessKeys, 'Business')}>
            <Card className="border border-gray-200/80 bg-white rounded-xl shadow-none overflow-hidden">
              <CardContent className="p-6 space-y-6">
                {/* Legal Entities */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                    <Briefcase className="size-4 text-primary" /> Company Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label style={labelStyle}>Business Name</label>
                      <Input
                        value={settings.business_name || ''}
                        onChange={(e) => handleChange('business_name', e.target.value)}
                        placeholder="Legal Entity Name"
                        className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label style={labelStyle}>Business Website</label>
                      <Input
                        type="url"
                        value={settings.business_website || ''}
                        onChange={(e) => handleChange('business_website', e.target.value)}
                        placeholder="https://mybusiness.com"
                        className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label style={labelStyle}>PAN Number</label>
                      <Input
                        value={settings.business_pan || ''}
                        onChange={(e) => handleChange('business_pan', e.target.value)}
                        placeholder="e.g. 609827361"
                        className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label style={labelStyle}>VAT Number</label>
                      <Input
                        value={settings.business_vat || ''}
                        onChange={(e) => handleChange('business_vat', e.target.value)}
                        placeholder="e.g. VAT-923847"
                        className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label style={labelStyle}>Registration Number</label>
                      <Input
                        value={settings.business_reg_number || ''}
                        onChange={(e) => handleChange('business_reg_number', e.target.value)}
                        placeholder="Reg. 82374/082"
                        className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Support Communications */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                    <Mail className="size-4 text-primary" /> Corporate Communication
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label style={labelStyle}>Corporate Email</label>
                      <Input
                        type="email"
                        value={settings.business_email || ''}
                        onChange={(e) => handleChange('business_email', e.target.value)}
                        placeholder="business@example.com"
                        className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label style={labelStyle}>Corporate Phone</label>
                      <Input
                        value={settings.business_phone || ''}
                        onChange={(e) => handleChange('business_phone', e.target.value)}
                        placeholder="+977-9800000000"
                        className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label style={labelStyle}>Corporate HQ Address</label>
                    <textarea
                      value={settings.business_address || ''}
                      onChange={(e) => handleChange('business_address', e.target.value)}
                      placeholder="Corporate HQ Suite, Kathmandu"
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Localized config */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                    <Layers className="size-4 text-primary" /> Localizations & Standards
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1" style={labelStyle}>
                        <DollarSign className="size-3 text-gray-500" /> Base Currency
                      </label>
                      <Select
                        value={settings.business_currency || 'USD'}
                        onValueChange={(val) => handleChange('business_currency', val)}
                      >
                        <SelectTrigger className="h-10 rounded-lg bg-white border-gray-200 text-sm shadow-none text-gray-900">
                          <SelectValue placeholder="Select Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                          <SelectItem value="NPR">NPR - Nepalese Rupee (Rs.)</SelectItem>
                          <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                          <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1" style={labelStyle}>
                        <Clock className="size-3 text-gray-500" /> Base Timezone
                      </label>
                      <Select
                        value={settings.business_timezone || 'Asia/Kathmandu'}
                        onValueChange={(val) => handleChange('business_timezone', val)}
                      >
                        <SelectTrigger className="h-10 rounded-lg bg-white border-gray-200 text-sm shadow-none text-gray-900">
                          <SelectValue placeholder="Select Timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Kathmandu">Kathmandu (GMT+5:45)</SelectItem>
                          <SelectItem value="Asia/Kolkata">Kolkata (GMT+5:30)</SelectItem>
                          <SelectItem value="UTC">UTC (GMT+0:00)</SelectItem>
                          <SelectItem value="America/New_York">New York (EST/EDT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-100 bg-gray-50/50 py-4 px-6 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="h-10 rounded-lg font-semibold transition-all px-6 shadow-none text-xs text-white"
                >
                  {isSaving ? <Spinner size="sm" className="mr-2" /> : 'Save Business Details'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* ── PAYMENT GATEWAY TAB ── */}
        <TabsContent value="payment" className="outline-none">
          <form onSubmit={(e) => handleSave(e, paymentKeys, 'Payment')}>
            <Card className="border border-gray-200/80 bg-white rounded-xl shadow-none overflow-hidden">
              <CardContent className="p-6 space-y-6">
                {/* Gateway Selection */}
                <div className="space-y-1.5">
                  <label style={labelStyle}>Active Checkout Gateway</label>
                  <Select
                    value={settings.payment_gateway || 'esewa'}
                    onValueChange={(val) => handleChange('payment_gateway', val)}
                  >
                    <SelectTrigger className="h-11 rounded-lg text-sm bg-white border-gray-200 shadow-none text-gray-900">
                      <SelectValue placeholder="Select Gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="esewa">eSewa Mobile Wallet (Nepal)</SelectItem>
                      <SelectItem value="paypal">PayPal Merchant Checkout (International)</SelectItem>
                      <SelectItem value="cod">Cash on Delivery (Pay on Arrival)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* eSewa Setup Card */}
                  <div className={`p-5 rounded-xl border transition-all duration-300 ${
                    settings.esewa_active === '1' 
                       ? 'border-green-500/50 bg-green-500/[0.02] shadow-none' 
                       : 'border-gray-200/80 bg-white opacity-60 hover:opacity-100 shadow-none'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#60bb46] flex items-center justify-center text-white font-extrabold text-xs">
                          eS
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-800">eSewa Payments</h4>
                          <p className="text-[10px] text-gray-650 font-medium">Local Nepalese Rupee payments</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-semibold text-gray-500">
                          {settings.esewa_active === '1' ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          checked={settings.esewa_active === '1'}
                          onCheckedChange={(checked) => handleChange('esewa_active', checked ? '1' : '0')}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label style={labelStyle}>Merchant Code</label>
                        <Input
                          value={settings.esewa_merchant_code || ''}
                          onChange={(e) => handleChange('esewa_merchant_code', e.target.value)}
                          placeholder="e.g. EPAYTEST"
                          className="h-9.5 rounded-lg border-gray-200 bg-white shadow-none text-xs text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label style={labelStyle}>Secret Hash Key</label>
                        <div className="relative">
                          <Input
                            type={showEsewaSecret ? 'text' : 'password'}
                            value={settings.esewa_secret_key || ''}
                            onChange={(e) => handleChange('esewa_secret_key', e.target.value)}
                            placeholder="Enter eSewa secure token"
                            className="h-9.5 rounded-lg border-gray-200 bg-white pr-9 shadow-none text-xs text-gray-900 placeholder-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEsewaSecret(!showEsewaSecret)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {showEsewaSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label style={labelStyle}>eSewa Mode</label>
                        <Select
                          value={settings.esewa_mode || 'sandbox'}
                          onValueChange={(val) => handleChange('esewa_mode', val)}
                        >
                          <SelectTrigger className="h-9.5 rounded-lg bg-white border-gray-200 text-xs shadow-none text-gray-900">
                            <SelectValue placeholder="Sandbox/Live Mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sandbox">Sandbox (Development / Test)</SelectItem>
                            <SelectItem value="live">Live (Real Payments)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* PayPal Setup Card */}
                  <div className={`p-5 rounded-xl border transition-all duration-300 ${
                    settings.paypal_active === '1' 
                       ? 'border-blue-500/50 bg-blue-500/[0.02] shadow-none' 
                       : 'border-gray-200/80 bg-white opacity-60 hover:opacity-100 shadow-none'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#003087] flex items-center justify-center text-white font-extrabold text-xs">
                          PP
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-800">PayPal Merchant</h4>
                          <p className="text-[10px] text-gray-650 font-medium">International checkouts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-semibold text-gray-500">
                          {settings.paypal_active === '1' ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          checked={settings.paypal_active === '1'}
                          onCheckedChange={(checked) => handleChange('paypal_active', checked ? '1' : '0')}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label style={labelStyle}>PayPal Client ID</label>
                        <Input
                          value={settings.paypal_client_id || ''}
                          onChange={(e) => handleChange('paypal_client_id', e.target.value)}
                          placeholder="Enter client ID"
                          className="h-9.5 rounded-lg border-gray-200 bg-white shadow-none text-xs text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label style={labelStyle}>Client Secret</label>
                        <div className="relative">
                          <Input
                            type={showPaypalSecret ? 'text' : 'password'}
                            value={settings.paypal_client_secret || ''}
                            onChange={(e) => handleChange('paypal_client_secret', e.target.value)}
                            placeholder="Enter client secret key"
                            className="h-9.5 rounded-lg border-gray-200 bg-white pr-9 shadow-none text-xs text-gray-900 placeholder-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPaypalSecret(!showPaypalSecret)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {showPaypalSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label style={labelStyle}>PayPal Mode</label>
                        <Select
                          value={settings.paypal_mode || 'sandbox'}
                          onValueChange={(val) => handleChange('paypal_mode', val)}
                        >
                          <SelectTrigger className="h-9.5 rounded-lg bg-white border-gray-200 text-xs shadow-none text-gray-900">
                            <SelectValue placeholder="Sandbox/Live Mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sandbox">Sandbox (Development / Test)</SelectItem>
                            <SelectItem value="live">Live (Real Payments)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Cash on Delivery Card */}
                  <div className={`p-5 rounded-xl border transition-all duration-300 ${
                    settings.cod_active === '1' 
                       ? 'border-amber-500/50 bg-amber-500/[0.02] shadow-none' 
                       : 'border-gray-200/80 bg-white opacity-60 hover:opacity-100 shadow-none'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                          <HandCoins className="size-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-800">Cash on Delivery</h4>
                          <p className="text-[10px] text-gray-650 font-medium">Allow pay on delivery</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-semibold text-gray-500">
                          {settings.cod_active === '1' ? 'Allowed' : 'Disallowed'}
                        </span>
                        <Switch
                          checked={settings.cod_active === '1'}
                          onCheckedChange={(checked) => handleChange('cod_active', checked ? '1' : '0')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-100 bg-gray-50/50 py-4 px-6 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="h-10 rounded-lg font-semibold transition-all px-6 shadow-none text-xs text-white"
                >
                  {isSaving ? <Spinner size="sm" className="mr-2" /> : 'Save Payment Gateways'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* ── SOCIAL PRESENCE TAB ── */}
        <TabsContent value="social" className="outline-none">
          <form onSubmit={(e) => handleSave(e, socialKeys, 'Social Presence')}>
            <Card className="border border-gray-200/80 bg-white rounded-xl shadow-none overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Facebook */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5" style={labelStyle}>
                      <FaFacebookF className="size-3.5 text-[#1877F2]" /> Facebook URL
                    </label>
                    <Input
                      type="url"
                      value={settings.facebook_url || ''}
                      onChange={(e) => handleChange('facebook_url', e.target.value)}
                      placeholder="https://facebook.com/your-username"
                      className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  {/* Twitter / X */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5" style={labelStyle}>
                      <FaTwitter className="size-3.5 text-gray-900" /> Twitter / X URL
                    </label>
                    <Input
                      type="url"
                      value={settings.twitter_url || ''}
                      onChange={(e) => handleChange('twitter_url', e.target.value)}
                      placeholder="https://twitter.com/your-username"
                      className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  {/* Instagram */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5" style={labelStyle}>
                      <FaInstagram className="size-3.5 text-[#E4405F]" /> Instagram URL
                    </label>
                    <Input
                      type="url"
                      value={settings.instagram_url || ''}
                      onChange={(e) => handleChange('instagram_url', e.target.value)}
                      placeholder="https://instagram.com/your-username"
                      className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5" style={labelStyle}>
                      <FaLinkedinIn className="size-3.5 text-[#0A66C2]" /> LinkedIn URL
                    </label>
                    <Input
                      type="url"
                      value={settings.linkedin_url || ''}
                      onChange={(e) => handleChange('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/company/your-company"
                      className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  {/* YouTube */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5" style={labelStyle}>
                      <FaYoutube className="size-3.5 text-[#FF0000]" /> YouTube URL
                    </label>
                    <Input
                      type="url"
                      value={settings.youtube_url || ''}
                      onChange={(e) => handleChange('youtube_url', e.target.value)}
                      placeholder="https://youtube.com/c/your-channel"
                      className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  {/* TikTok */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5" style={labelStyle}>
                      <FaTiktok className="size-3.5 text-gray-900" /> TikTok URL
                    </label>
                    <Input
                      type="url"
                      value={settings.tiktok_url || ''}
                      onChange={(e) => handleChange('tiktok_url', e.target.value)}
                      placeholder="https://tiktok.com/@your-username"
                      className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1.5">
                  <label className="flex items-center gap-1.5" style={labelStyle}>
                    <FaWhatsapp className="size-3.5 text-[#25D366] fill-[#25D366]/10" /> WhatsApp Contact Handle
                  </label>
                  <Input
                    value={settings.whatsapp_number || ''}
                    onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                    placeholder="e.g. +9779800000000"
                    className="h-10 rounded-lg bg-white border-gray-200 shadow-none text-sm text-gray-900 placeholder-gray-400"
                  />
                  <p className="text-[10px] text-gray-500 font-medium">
                    Enter the phone number complete with country code to enable direct customer communications via WhatsApp API links.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-100 bg-gray-50/50 py-4 px-6 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="h-10 rounded-lg font-semibold transition-all px-6 shadow-none text-xs text-white"
                >
                  {isSaving ? <Spinner size="sm" className="mr-2" /> : 'Save Social Settings'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
