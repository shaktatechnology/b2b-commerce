'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/src/store/use-app-store';
import { fetchProfile, getAuthToken } from '@/src/lib/auth';
import { Button } from '@/src/components/ui/button';
import { toast } from 'sonner';
import { Spinner } from '@/src/components/ui/spinner';
import { User, ShoppingBag, MessageSquare, ChevronLeft, Shield, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { fetchUserOrders } from '@/src/lib/orders-api';
import { Order } from '@/src/types/orders';

import { ProfileTab } from './profile-tab';
import { OrdersTab } from './orders-tab';
import { ReviewsTab } from './reviews-tab';

export function AccountPageFeature() {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Orders state
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = React.useState(false);
  
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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const defaultTab = searchParams?.get('tab') || 'profile';

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status.toLowerCase() === 'delivered').length;
  const totalSpent = orders
    .filter(o => o.status.toLowerCase() === 'delivered' || o.payment_status?.toLowerCase() === 'paid')
    .reduce((sum, o) => sum + Number(o.total_amount || o.total || 0), 0);

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen">
      {/* Ambient background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#966FD6]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[350px] h-[350px] rounded-full bg-[#966FD6]/3 blur-[100px] pointer-events-none" />

      <Button 
        variant="ghost" 
        onClick={() => router.push('/')}
        className="mb-8 font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:text-black hover:bg-zinc-50 rounded-xl px-0 cursor-pointer group transition-all duration-300"
      >
        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back to store
      </Button>

      {/* Profile & Stats Dashboard Hero Banner */}
      <div className="relative overflow-hidden bg-white border border-zinc-100 rounded-[2.5rem] p-6 md:p-8 mb-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col lg:flex-row lg:items-center justify-between gap-8 z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#966FD6]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* User Card */}
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 border-none">
          <div className="relative group">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#966FD6]/10 to-[#966FD6]/5 flex items-center justify-center border border-[#966FD6]/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <span className="text-3xl font-black text-[#966FD6]">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            {user.is_verified && (
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5 fill-white/20" />
              </span>
            )}
          </div>
          
          <div className="text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-black tracking-tight">{user.name}</h2>
              {user.wholeseller_status === 'approved' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#966FD6]/10 text-[#966FD6] border border-[#966FD6]/20">
                  Wholesaler Partner
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-zinc-50 text-zinc-500 border border-zinc-100">
                  Retail Customer
                </span>
              )}
            </div>
            
            <p className="text-zinc-500 text-sm font-medium flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <span className="bg-zinc-100 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-500">{user.role || 'Member'}</span>
              <span>•</span>
              <span className="font-semibold text-zinc-600 truncate">{user.email}</span>
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 relative z-10 w-full lg:w-auto">
          <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-4 text-center min-w-[100px] hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Total Orders</p>
            <p className="text-2xl font-black text-[#966FD6]">{totalOrders}</p>
          </div>
          <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-4 text-center min-w-[100px] hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Completed</p>
            <p className="text-2xl font-black text-emerald-600">{completedOrders}</p>
          </div>
          <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-4 text-center min-w-[100px] hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Total Spent</p>
            <p className="text-2xl font-black text-zinc-800">
              Rs. {Math.round(totalSpent).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-8 z-10 relative">
        <TabsList className="bg-zinc-100/60 p-1 rounded-2xl border border-zinc-200/50 h-auto self-start flex gap-1 w-full max-w-md sm:w-auto">
          <TabsTrigger 
            value="profile" 
            className="flex-1 sm:flex-none rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#966FD6] data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="flex-1 sm:flex-none rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#966FD6] data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Orders
          </TabsTrigger>
          <TabsTrigger 
            value="reviews" 
            className="flex-1 sm:flex-none rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#966FD6] data-[state=active]:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="outline-none animate-in fade-in-50 duration-300">
          <ProfileTab user={user} onRefresh={loadProfile} />
        </TabsContent>

        <TabsContent value="orders" className="outline-none animate-in fade-in-50 duration-300">
          <OrdersTab orders={orders} isLoading={isOrdersLoading} />
        </TabsContent>

        <TabsContent value="reviews" className="outline-none animate-in fade-in-50 duration-300">
          <ReviewsTab orders={orders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
