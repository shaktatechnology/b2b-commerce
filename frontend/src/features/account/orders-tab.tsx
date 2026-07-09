'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/src/types/orders';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Spinner } from '@/src/components/ui/spinner';
import { ShoppingBag, Package, Truck, CheckCircle2, Clock, ChevronDown, ChevronUp, CreditCard, Calendar, Hash, Receipt, ArrowUpRight, Inbox } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { resolveProductImageUrl } from '@/src/lib/product-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';

interface OrdersTabProps {
  orders: Order[];
  isLoading: boolean;
}

export function OrdersTab({ orders, isLoading }: OrdersTabProps) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | number | null>(null);
  const [localOrders, setLocalOrders] = React.useState<Order[]>(orders);
  const [isDetailLoading, setIsDetailLoading] = React.useState<string | number | null>(null);

  React.useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  // Compute counts for each filter dynamically
  const counts = React.useMemo(() => {
    const all = localOrders.length;
    let toPay = 0;
    let toShip = 0;
    let toReceive = 0;
    let toReview = 0;

    localOrders.forEach(o => {
      const status = o.status ? o.status.toLowerCase() : '';
      const paymentStatus = o.payment_status ? o.payment_status.toLowerCase() : '';
      
      if (paymentStatus === 'unpaid' && (status === 'pending' || status === 'confirmed')) {
        toPay++;
      }
      if (status === 'processing' || status === 'confirmed') {
        toShip++;
      }
      if (status === 'shipped') {
        toReceive++;
      }
      if (status === 'delivered') {
        toReview++;
      }
    });

    return { all, toPay, toShip, toReceive, toReview };
  }, [localOrders]);

  // Filter orders according to selected dropdown value
  const filteredOrders = React.useMemo(() => {
    return localOrders.filter((order) => {
      const status = order.status ? order.status.toLowerCase() : '';
      const paymentStatus = order.payment_status ? order.payment_status.toLowerCase() : '';
      
      switch (filter) {
        case 'to-pay':
          return paymentStatus === 'unpaid' && (status === 'pending' || status === 'confirmed');
        case 'to-ship':
          return status === 'processing' || status === 'confirmed';
        case 'to-receive':
          return status === 'shipped';
        case 'to-review':
          return status === 'delivered';
        default:
          return true;
      }
    });
  }, [localOrders, filter]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-3.5 h-3.5" />;
      case 'confirmed': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'processing': return <Package className="w-3.5 h-3.5" />;
      case 'shipped': return <Truck className="w-3.5 h-3.5" />;
      case 'delivered': return <CheckCircle2 className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200/50';
      case 'confirmed': return 'bg-sky-50 text-sky-600 border-sky-200/50';
      case 'processing': return 'bg-blue-50 text-blue-600 border-blue-200/50';
      case 'shipped': return 'bg-[#966FD6]/10 text-[#966FD6] border-[#966FD6]/20';
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-200/50';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-200/50';
      default: return 'bg-zinc-50 text-zinc-600 border-zinc-200/50';
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const s = status ? status.toLowerCase() : 'unpaid';
    switch (s) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'unpaid':
        return 'bg-amber-50 text-amber-700 border-amber-200/40';
      case 'refunded':
        return 'bg-zinc-100 text-zinc-600 border-zinc-200';
      default:
        return 'bg-zinc-50 text-zinc-600 border-zinc-100';
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
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] p-16 md:p-24 text-center bg-white">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-zinc-50 text-zinc-300 mb-6">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-black mb-2">No orders found</h3>
        <p className="text-zinc-500 font-medium mb-8 max-w-sm mx-auto">When your wholesale orders are processed, details will appear automatically in this tab.</p>
        <Button 
          onClick={() => router.push('/products')}
          className="rounded-xl px-8 h-12 bg-black text-white font-black text-[10px] uppercase tracking-widest hover:bg-zinc-900 transition-all cursor-pointer shadow-lg shadow-zinc-100"
        >
          Browse Wholesale Catalog
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dropdown Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50 border border-zinc-100 p-5 rounded-[2rem]">
        <div>
          <h4 className="text-sm font-black text-black uppercase tracking-wider">Order History</h4>
          <p className="text-xs text-zinc-400 font-medium">Filter and browse your past B2B transactions.</p>
        </div>
        
        <div className="w-full sm:w-[220px] shrink-0">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="bg-white border-zinc-200 hover:border-zinc-300 text-zinc-800 font-bold text-xs h-11 focus:ring-[#966FD6] rounded-xl cursor-pointer">
              <SelectValue placeholder="All Orders" />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-150">
              <SelectItem value="all">All Orders ({counts.all})</SelectItem>
              <SelectItem value="to-pay">To Pay ({counts.toPay})</SelectItem>
              <SelectItem value="to-ship">To Ship ({counts.toShip})</SelectItem>
              <SelectItem value="to-receive">To Receive ({counts.toReceive})</SelectItem>
              <SelectItem value="to-review">To Review ({counts.toReview})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtered Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="border border-zinc-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.01)] rounded-[2.5rem] p-16 text-center bg-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-zinc-50 text-zinc-300 mb-6">
            <Inbox className="w-8 h-8" />
          </div>
          <h4 className="text-base font-black text-black uppercase tracking-wider mb-2">No orders found</h4>
          <p className="text-xs text-zinc-400 font-medium max-w-xs mx-auto leading-relaxed">
            {filter === 'to-pay' && "There are no pending orders awaiting payment."}
            {filter === 'to-ship' && "There are no purchases in shipping preparation status."}
            {filter === 'to-receive' && "There are no shipped orders currently in-transit."}
            {filter === 'to-review' && "There are no completed orders pending custom reviews."}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const isLoadingDetail = isDetailLoading === order.id;
            
            return (
              <Card key={order.id} className="border border-zinc-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2rem] overflow-hidden bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-300 group">
                <div className="flex flex-col md:flex-row md:items-center">
                  {/* Order Info Strip */}
                  <div className="p-6 md:p-8 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <div className="px-3.5 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[10px] font-black uppercase tracking-widest border border-zinc-200/40 flex items-center gap-1.5">
                        <Hash className="w-3 h-3 text-zinc-400" />
                        <span>{order.order_number || order.id}</span>
                      </div>
                      
                      <div className={cn("px-3.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5", getStatusColor(order.status))}>
                        {getStatusIcon(order.status)}
                        <span>{order.status}</span>
                      </div>

                      <div className={cn("px-3.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5", getPaymentStatusBadge(order.payment_status))}>
                        <CreditCard className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>{order.payment_status || 'unpaid'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-2xl font-black text-black">
                        Rs. {Number(order.total_amount || order.total || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-zinc-400 font-bold">
                        ({order.items && order.items.length > 0 ? order.items.length : '—'} {order.items && order.items.length === 1 ? 'item' : 'items'})
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-wide flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                      <span>Placed: {order.created_at ? new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown date'}</span>
                    </p>
                  </div>
                  
                  {/* Right Button Panel */}
                  <div className="p-6 md:p-8 md:border-l border-zinc-100 bg-zinc-50/20 w-full md:w-auto flex flex-row md:flex-col justify-center items-center gap-3 shrink-0">
                     <Button 
                      onClick={() => toggleExpand(order.id)}
                      disabled={isLoadingDetail}
                      variant={isExpanded ? "default" : "outline"}
                      className={cn(
                        "rounded-xl px-5 h-10 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 cursor-pointer flex-1 md:flex-none w-full justify-center",
                        isExpanded ? "bg-[#966FD6] text-white hover:bg-[#855cc4]" : "border-2 border-zinc-200 text-zinc-600 hover:border-[#966FD6] hover:text-[#966FD6]"
                      )}
                     >
                       {isLoadingDetail ? (
                         <Spinner className="w-3.5 h-3.5" />
                       ) : isExpanded ? (
                         <>Hide Details <ChevronUp className="w-4 h-4 ml-0.5" /></>
                       ) : (
                         <>View Receipt <ChevronDown className="w-4 h-4 ml-0.5" /></>
                       )}
                     </Button>
                     
                      {order.payment_status === 'unpaid' && order.status === 'pending' && (
                        <Button 
                          onClick={() => router.push(`/account/orders/${order.id}`)}
                          className="rounded-xl px-5 h-10 bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-emerald-100 cursor-pointer flex-1 md:flex-none w-full justify-center"
                        >
                          Pay Now <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button 
                        variant="ghost"
                        onClick={() => router.push(`/account/orders/${order.id}`)}
                        className="font-black text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-700 cursor-pointer h-10 flex-1 md:flex-none w-full justify-center"
                      >
                        Invoice Page
                      </Button>
                   </div>
                </div>

                {/* EXPANDED RECEIPT VIEW */}
                {isExpanded && !isLoadingDetail && (
                  <div className="px-6 md:px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                    <div className="pt-6 border-t border-dashed border-zinc-200">
                      <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Purchase Summary</span>
                      </h5>
                      
                      <div className="space-y-3">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item) => {
                            const productImage = resolveProductImageUrl(item.variant?.image_url || item.variant?.product?.image_url);
                            
                            return (
                              <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50/50 border border-zinc-150 hover:bg-zinc-50 hover:border-zinc-200 transition-all">
                                <div className="flex items-center gap-4 min-w-0">
                                  <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center border border-zinc-200/70 overflow-hidden shrink-0 shadow-inner group/img relative">
                                    {productImage ? (
                                      <img 
                                        src={productImage} 
                                        alt={item.variant?.product?.name || 'Product'} 
                                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" 
                                      />
                                    ) : (
                                      <Package className="w-5 h-5 text-[#966FD6]" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-black text-sm hover:underline cursor-pointer truncate" onClick={() => item.variant?.product?.slug && router.push(`/products/${item.variant.product.slug}`)}>
                                      {item.variant?.product?.name || item.variant?.variant_name || 'Product'}
                                    </p>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                                      Qty: {item.quantity} × Rs. {Number(item.unit_price).toLocaleString()}
                                      {(item.variant?.color || item.variant?.size) && (
                                        <span className="ml-2 px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-semibold lowercase">
                                          {[item.variant?.color?.name, item.variant?.size?.name].filter(Boolean).join(', ')}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-bold text-black">
                                    Rs. {Number(item.line_total).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-6 rounded-2xl bg-zinc-55 border border-zinc-150 text-center">
                            <p className="text-xs font-medium text-zinc-400 italic">Product item details are not loading for this order entry.</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Total Calculations */}
                      <div className="mt-6 flex flex-col items-end space-y-2 border-t border-dashed border-zinc-200 pt-4 max-w-sm ml-auto">
                        <div className="flex justify-between w-full text-xs">
                          <span className="font-black text-zinc-400 uppercase tracking-widest">Subtotal</span>
                          <span className="font-bold text-black">Rs. {Number(order.subtotal || 0).toLocaleString()}</span>
                        </div>
                        {Number(order.discount_amount || 0) > 0 && (
                          <div className="flex justify-between w-full text-xs">
                            <span className="font-black text-emerald-600 uppercase tracking-widest">Discount</span>
                            <span className="font-bold text-emerald-600">- Rs. {Number(order.discount_amount).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between w-full pt-2 border-t border-zinc-100">
                          <span className="text-xs font-black text-black uppercase tracking-widest self-center">Invoice Total</span>
                          <span className="text-2xl font-black text-[#966FD6]">Rs. {Number(order.total_amount || order.total || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
