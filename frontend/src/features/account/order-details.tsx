'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchOrderById } from '@/src/lib/orders-api';
import { Order } from '@/src/types/orders';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Spinner } from '@/src/components/ui/spinner';
import { toast } from 'sonner';
import { ChevronLeft, Package, Truck, CheckCircle2, Clock, MapPin, Receipt, Calendar } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function OrderDetailsFeature() {
  const router = useRouter();
  const { id } = useParams();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;

    async function loadOrder() {
      try {
        setIsLoading(true);
        const data = await fetchOrderById(id as string);
        setOrder(data);
      } catch (error: any) {
        toast.error('Failed to load order details');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [id]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'processing': return <Package className="w-5 h-5" />;
      case 'shipped': return <Truck className="w-5 h-5" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
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
        <Spinner className="w-8 h-8 text-[#966FD6]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-black text-black mb-4">Order Not Found</h2>
        <Button onClick={() => router.push('/account')} className="bg-black text-white rounded-xl font-black uppercase text-xs">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-8 font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:text-black hover:bg-zinc-50 rounded-xl px-0"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Orders
      </Button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-black tracking-tight flex items-center gap-4">
            Order #{order.id}
          </h1>
          <div className="flex items-center gap-3 text-zinc-400 font-medium italic">
            <Calendar className="w-4 h-4" />
            Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'}
          </div>
        </div>
        <div className={cn("px-6 py-2.5 rounded-2xl border font-black uppercase text-xs tracking-widest flex items-center gap-2.5 shadow-sm", getStatusColor(order.status))}>
          {getStatusIcon(order.status)}
          {order.status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="md:col-span-2 space-y-8">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-zinc-50/50 px-8 py-8 border-b border-zinc-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-black text-black">Line Items</CardTitle>
              <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100')}>
                Payment: {order.payment_status}
              </div>
            </CardHeader>
            <CardContent className="p-0">
               {/* Note: In a real app, we'd map over order.items. Assuming simplified Order type for now. */}
               <div className="p-8 space-y-4">
                  <div className="flex items-center justify-between p-6 rounded-3xl bg-zinc-50 border border-zinc-100">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-zinc-100 overflow-hidden">
                        <Package className="w-8 h-8 text-zinc-200" />
                      </div>
                      <div>
                        <p className="font-black text-black">Bulk Commodity Order</p>
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Industrial Grade</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-black">Rs. {Number(order.total_amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-zinc-400 font-medium">Qty: 1 Unit</p>
                    </div>
                  </div>
               </div>

               <div className="bg-zinc-50/50 p-8 border-t border-zinc-100 space-y-3">
                  <div className="flex justify-between text-sm font-medium text-zinc-500">
                    <span>Subtotal</span>
                    <span>Rs. {Number(order.total_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-zinc-500">
                    <span>Shipping</span>
                    <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest">Calculated at dispatch</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-zinc-100">
                    <span className="text-lg font-black text-black uppercase tracking-tight">Grand Total</span>
                    <span className="text-2xl font-black text-[#966FD6]">Rs. {Number(order.total_amount || 0).toLocaleString()}</span>
                  </div>
               </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] p-8 bg-[#966FD6]/5 border border-[#966FD6]/10">
              <div className="flex gap-4">
                <Receipt className="w-6 h-6 text-[#966FD6] shrink-0" />
                <div>
                  <h4 className="font-black text-black text-sm uppercase tracking-widest mb-2">Order Notes</h4>
                  <p className="text-zinc-600 font-medium italic leading-relaxed">{order.notes}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Shipping Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-[#966FD6] p-8 text-white">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase tracking-widest">Delivery Route</h3>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Destination</p>
                  <p className="font-bold text-black leading-relaxed">
                    {order.shipping_address?.street}, {order.shipping_address?.city}<br />
                    {order.shipping_address?.state}, {order.shipping_address?.zip}<br />
                    {order.shipping_address?.country}
                  </p>
                </div>
                <div className="pt-6 border-t border-zinc-50 space-y-1">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Customer Entity</p>
                  <p className="font-bold text-black">{order.customer || 'Shakta Client'}</p>
                </div>
              </div>

              <div className="pt-8 text-center border-t border-zinc-50">
                 <Button className="w-full h-12 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/10">
                   Track Shipment
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
