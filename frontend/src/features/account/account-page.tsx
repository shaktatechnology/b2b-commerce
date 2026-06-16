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
import { Edit2, Save, X, User, Mail, Phone, Building, MapPin, Shield, ChevronLeft } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { fetchUserOrders } from '@/src/lib/orders-api';
import { Order } from '@/src/types/orders';
import { ShoppingBag, Package, Truck, CheckCircle2, Clock } from 'lucide-react';

import { ProfileTab } from './profile-tab';
import { OrdersTab } from './orders-tab';

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Button 
        variant="ghost" 
        onClick={() => router.push('/')}
        className="mb-8 font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:text-black hover:bg-zinc-50 rounded-xl px-0"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to store
      </Button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tight mb-2">My Account</h1>
          <p className="text-zinc-500 font-medium">Overview of your activity and personal data.</p>
        </div>
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
          <ProfileTab user={user} onRefresh={loadProfile} />
        </TabsContent>

        <TabsContent value="orders" className="outline-none">
          <OrdersTab orders={orders} isLoading={isOrdersLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
