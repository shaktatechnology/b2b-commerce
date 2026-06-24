'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/src/types/orders';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Spinner } from '@/src/components/ui/spinner';
import { ShoppingBag, Package, Truck, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { resolveProductImageUrl } from '@/src/lib/product-utils';

interface OrdersTabProps {
  orders: Order[];
  isLoading: boolean;
}

export function OrdersTab({ orders, isLoading }: OrdersTabProps) {
  const router = useRouter();
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | number | null>(null);
  const [localOrders, setLocalOrders] = React.useState<Order[]>(orders);
  const [isDetailLoading, setIsDetailLoading] = React.useState<string | number | null>(null);

  React.useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

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

  const toggleExpand = async (orderId: string | number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    const order = localOrders.find(o => o.id === orderId);
    if (order && (!order.items || order.items.length === 0)) {
      setIsDetailLoading(orderId);
      try {
        const { fetchOrderById } = await import('@/src/lib/orders-api');
        const detailedOrder = await fetchOrderById(orderId);
        setLocalOrders(prev => prev.map(o => o.id === orderId ? detailedOrder : o));
      } catch (error) {
        console.error("Failed to fetch order details:", error);
      } finally {
        setIsDetailLoading(null);
      }
    }
    
    setExpandedOrderId(orderId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="w-8 h-8 text-[#966FD6]" />
      </div>
    );
  }

  if (localOrders.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {localOrders.map((order) => {
        const isExpanded = expandedOrderId === order.id;
        const isLoadingDetail = isDetailLoading === order.id;
        
        return (
          <Card key={order.id} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all group">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="p-8 flex-1">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="px-4 py-1.5 rounded-full bg-zinc-100 text-black text-[10px] font-black uppercase tracking-widest border border-zinc-200">
                    #{order.order_number || order.id}
                  </div>
                  <div className={cn("px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2", getStatusColor(order.status))}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                </div>
                <h4 className="text-xl font-black text-black mb-1">
                  Rs. {Number(order.total_amount || order.total || 0).toLocaleString()}
                </h4>
                <p className="text-sm text-zinc-400 font-medium italic">
                  Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
              
              <div className="p-8 md:border-l border-zinc-50 bg-zinc-50/30 w-full md:w-auto flex flex-col justify-center gap-3">
                 <Button 
                  onClick={() => toggleExpand(order.id)}
                  disabled={isLoadingDetail}
                  variant={isExpanded ? "default" : "outline"}
                  className={cn(
                    "rounded-xl px-6 h-12 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2",
                    isExpanded ? "bg-[#966FD6] text-white hover:bg-[#855cc4]" : "border-2 border-zinc-200 hover:border-[#966FD6] hover:text-[#966FD6]"
                  )}
                 >
                   {isLoadingDetail ? (
                     <Spinner className="w-4 h-4 mr-2" />
                   ) : isExpanded ? (
                     <>Hide Details <ChevronUp className="w-4 h-4" /></>
                   ) : (
                     <>View Details <ChevronDown className="w-4 h-4" /></>
                   )}
                 </Button>
                  {order.payment_status === 'unpaid' && order.status === 'pending' && (
                   <Button 
                    onClick={() => router.push(`/account/orders/${order.id}`)}
                    className="rounded-xl px-6 h-12 bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-200"
                   >
                     Complete Payment <CheckCircle2 className="w-4 h-4" />
                   </Button>
                  )}
                  <Button 
                   variant="ghost"
                   onClick={() => router.push(`/account/orders/${order.id}`)}
                   className="font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:text-black"
                  >
                    Go to Page
                  </Button>
               </div>
            </div>

            {isExpanded && !isLoadingDetail && (
              <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                <div className="pt-6 border-t border-zinc-100">
                  <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Order Items</h5>
                  <div className="space-y-3">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item) => {
                        const productImage = resolveProductImageUrl(item.variant?.image_url || item.variant?.product?.image_url);
                        
                        return (
                          <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50/80 border border-zinc-100">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center border border-zinc-100 overflow-hidden shrink-0">
                                {productImage ? (
                                  <img src={productImage} alt={item.variant?.product?.name || 'Product'} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-6 h-6 text-[#966FD6]" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-black text-sm">
                                  {item.variant?.product?.name || item.variant?.variant_name || 'Product'}
                                </p>
                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                                  Qty: {item.quantity} × Rs. {Number(item.unit_price).toLocaleString()}
                                  {(item.variant?.color || item.variant?.size) && (
                                    <span className="ml-2 lowercase">
                                      ({[item.variant?.color?.name, item.variant?.size?.name].filter(Boolean).join(', ')})
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-black">
                                Rs. {Number(item.line_total).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 rounded-2xl bg-zinc-50/80 border border-zinc-100 text-center">
                        <p className="text-sm font-medium text-zinc-500 italic">No item details available for this order.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 flex flex-col items-end space-y-2 border-t border-zinc-100 pt-4">
                    <div className="flex justify-between w-full max-w-[240px]">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Subtotal</span>
                      <span className="font-bold text-black">Rs. {Number(order.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {Number(order.discount_amount || 0) > 0 && (
                      <div className="flex justify-between w-full max-w-[240px]">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-emerald-600">Discount</span>
                        <span className="font-bold text-emerald-600">- Rs. {Number(order.discount_amount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between w-full max-w-[240px] pt-2">
                      <span className="text-sm font-black text-black uppercase tracking-widest">Total Amount</span>
                      <span className="text-xl font-black text-[#966FD6]">Rs. {Number(order.total_amount || order.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
