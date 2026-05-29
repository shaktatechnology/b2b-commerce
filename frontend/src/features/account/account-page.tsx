'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/src/store/use-app-store';
import { fetchProfile, updateProfile, getAuthToken } from '@/src/lib/auth';
import { AuthUser } from '@/src/types';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { toast } from 'sonner';
import { Spinner } from '@/src/components/ui/spinner';
import { Edit2, Save, X, User, Mail, Phone, Building, MapPin, Shield, ArrowLeft } from 'lucide-react';
import { AccountNavbar } from '@/src/components/layout-components/AccountNavbar';
import { cn } from '@/src/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { fetchUserOrders } from '@/src/lib/orders-api';
import { Order } from '@/src/types/orders';
import { ShoppingBag, Package, Truck, CheckCircle2, Clock } from 'lucide-react';

export function AccountPageFeature() {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Orders state
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = React.useState(false);
  
  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    address: '',
    password: '',
    password_confirmation: '',
  });

  const loadProfile = React.useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setIsLoading(true);
      const profile = await fetchProfile(token);
      setUser(profile);
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        company_name: profile.company_name || '',
        address: profile.address || '',
        password: '',
        password_confirmation: '',
      });
    } catch (error: any) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [router, setUser]);

  const loadOrders = React.useCallback(async () => {
    setIsOrdersLoading(true);
    try {
      const myOrders = await fetchUserOrders();
      setOrders(myOrders);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProfile();
    loadOrders();
  }, [loadProfile, loadOrders]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (formData.password && formData.password !== formData.password_confirmation) {
          toast.error("Passwords do not match");
          setIsSaving(false);
          return;
      }
      await updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company_name: formData.company_name || null,
        address: formData.address || null,
        password: formData.password || null,
        password_confirmation: formData.password_confirmation || null,
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'shipped': return 'bg-[#966FD6]/10 text-[#966FD6] border-[#966FD6]/20';
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-zinc-50 text-zinc-600 border-zinc-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <AccountNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tight mb-2">My Account</h1>
          <p className="text-zinc-500 font-medium">Overview of your activity and personal data.</p>
        </div>
        
        <Button 
          variant="outline"
          onClick={() => router.push('/products')}
          className="rounded-2xl h-12 px-6 border-zinc-200 hover:border-[#966FD6] hover:text-[#966FD6] hover:bg-[#966FD6]/5 font-black text-[10px] uppercase tracking-widest transition-all gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-12">
        <TabsList className="bg-zinc-100/50 p-1 rounded-2xl border border-zinc-100 h-auto self-start">
          <TabsTrigger 
            value="profile" 
            className="rounded-xl px-8 py-3 text-sm font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#966FD6] data-[state=active]:shadow-sm transition-all"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="rounded-xl px-8 py-3 text-sm font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#966FD6] data-[state=active]:shadow-sm transition-all"
          >
            Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar Cards */}
            <div className="space-y-6">
              <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-3xl">
                <div className="h-24 bg-gradient-to-r from-[#966FD6] to-[#7c52c9]" />
                <CardContent className="pt-0 -mt-12 text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white shadow-xl border-4 border-white mb-4">
                    <span className="text-3xl font-black text-[#966FD6]">
                      {user.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-black mb-1">{user.name}</h2>
                  <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">{user.role || 'Member'}</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3 text-[#966FD6]">
                    <Shield className="w-5 h-5" />
                    <h3 className="font-black text-sm uppercase tracking-widest">Security</h3>
                  </div>
                  {!isEditing && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-[10px] font-black uppercase tracking-widest text-[#966FD6] hover:bg-[#966FD6]/5 h-8"
                    >
                      Settings
                    </Button>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Your account is protected. Last activity logged {new Date(user.updated_at).toLocaleDateString()}.
                </p>
              </Card>
            </div>

            {/* Profile Form/Info */}
            <div className="lg:col-span-2">
              {isEditing ? (
                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden bg-white">
                  <CardHeader className="bg-zinc-50/50 px-8 py-8 border-b border-zinc-100">
                    <CardTitle className="text-xl font-black text-black">Edit Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form onSubmit={handleUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</label>
                          <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl bg-zinc-50/50" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email</label>
                          <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 rounded-xl bg-zinc-50/50" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Address</label>
                        <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full p-4 rounded-xl bg-zinc-50/50 border border-zinc-100 outline-none h-24 resize-none" />
                      </div>
                      <div className="flex items-center justify-end gap-3 pt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl font-black text-[10px] uppercase">Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="rounded-xl bg-black text-white px-8 font-black text-[10px] uppercase tracking-widest">
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-10 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Display Name</p>
                        <p className="text-lg font-bold text-black">{user.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Email Address</p>
                        <p className="text-lg font-bold text-black">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Contact</p>
                        <p className="text-lg font-bold text-black">{user.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Company</p>
                        <p className="text-lg font-bold text-black">{user.company_name || '—'}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="outline-none">
          {isOrdersLoading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-24 text-center bg-white">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-zinc-50 text-zinc-300 mb-6">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-black mb-2">No orders yet</h3>
              <p className="text-zinc-500 font-medium mb-8">When you place orders, they will appear here.</p>
              <Button 
                onClick={() => router.push('/products')}
                className="rounded-xl px-8 h-12 bg-black text-white font-black text-[10px] uppercase tracking-widest"
              >
                Browse Products
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="p-8 flex-1">
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="px-4 py-1.5 rounded-full bg-zinc-100 text-black text-[10px] font-black uppercase tracking-widest border border-zinc-200">
                          #{order.id}
                        </div>
                        <div className={cn("px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2", getStatusColor(order.status))}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </div>
                      </div>
                      <h4 className="text-xl font-black text-black mb-1">
                        Rs. {Number(order.total || order.total_amount || 0).toLocaleString()}
                      </h4>
                      <p className="text-sm text-zinc-400 font-medium italic">
                        Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                    
                    <div className="p-8 md:border-l border-zinc-50 bg-zinc-50/30 w-full md:w-auto flex flex-col justify-center">
                       <Button 
                        onClick={() => router.push(`/account/orders/${order.id}`)}
                        className="rounded-xl px-6 h-12 border-2 border-zinc-200 hover:border-[#966FD6] hover:text-[#966FD6] transition-all font-black text-[10px] uppercase tracking-widest"
                       >
                         View Details
                       </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
