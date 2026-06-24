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

import { resolveProductImageUrl } from '@/src/lib/product-utils';
import { fetchAllSettings } from '@/src/lib/storefront-api';
import { initiatePayment } from '@/src/lib/payment-api';
import { getAuthToken } from '@/src/lib/auth';
import { PaymentSettings, PaymentGatewayId } from '@/src/types/payment-settings';
import EsewaPaymentForm from '@/src/components/checkout/EsewaPaymentForm';

export function OrderDetailsFeature() {
  const router = useRouter();
  const { id } = useParams();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [paymentSettings, setPaymentSettings] = React.useState<PaymentSettings | null>(null);
  const [selectedGateway, setSelectedGateway] = React.useState<PaymentGatewayId | null>(null);
  const [isPaying, setIsPaying] = React.useState(false);
  const [esewaConfig, setEsewaConfig] = React.useState<{
    config: import("@/src/lib/payment-api").EsewaPaymentConfig;
    paymentId: string;
    amount: number;
  } | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [orderData, settingsData] = await Promise.all([
          fetchOrderById(id as string),
          fetchAllSettings()
        ]);
        setOrder(orderData);
        setPaymentSettings(settingsData.payment);
        if (settingsData.payment.defaultGateway) {
          setSelectedGateway(settingsData.payment.defaultGateway);
        }
      } catch (error: any) {
        toast.error('Failed to load order details');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, router]);

  const handlePay = async () => {
    const token = getAuthToken();
    if (!token || !order || !selectedGateway) {
      toast.error("Please select a payment method.");
      return;
    }

    setIsPaying(true);
    try {
      const payment = await initiatePayment(token, String(order.id), selectedGateway);

      if (selectedGateway === "cod") {
        toast.success("Order confirmed as Cash on Delivery!");
        router.push(`/payment-verify?gateway=cod&order_id=${order.id}&status=success`);
        return;
      }

      if (selectedGateway === "esewa" && payment.esewa) {
        setEsewaConfig({
          config: payment.esewa,
          paymentId: payment.payment_id,
          amount: payment.amount,
        });
        return;
      }

      if (selectedGateway === "paypal" && payment.paypal) {
        sessionStorage.setItem("pending_payment_config", JSON.stringify(payment));
        router.push(`/payment?order_id=${order.id}&payment_id=${payment.payment_id}&gateway=paypal`);
        return;
      }

      toast.error("Payment gateway configuration is incomplete.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment initiation failed.";
      toast.error(message);
    } finally {
      setIsPaying(false);
    }
  };

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

  if (esewaConfig) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Spinner className="w-8 h-8 text-[#966FD6] mb-4" />
        <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Redirecting to eSewa...</p>
        <EsewaPaymentForm
          config={esewaConfig.config}
          paymentId={esewaConfig.paymentId}
          amount={esewaConfig.amount}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-8 font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:text-black hover:bg-zinc-50 rounded-xl px-0"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Orders
      </Button>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-black tracking-tight flex items-center gap-4">
            Order #{order.order_number || order.id}
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
               <div className="p-8 space-y-4">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => {
                      const productImage = resolveProductImageUrl(item.variant?.image_url || item.variant?.product?.image_url);
                      return (
                        <div key={item.id} className="flex items-center justify-between p-6 rounded-3xl bg-zinc-50 border border-zinc-100">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-zinc-100 overflow-hidden shrink-0">
                              {productImage ? (
                                <img src={productImage} alt={item.variant?.product?.name || 'Product'} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-8 h-8 text-zinc-200" />
                              )}
                            </div>
                            <div>
                              <p className="font-black text-black">
                                {item.variant?.product?.name || item.variant?.variant_name || 'Product Item'}
                              </p>
                              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">
                                {item.variant?.sku || 'SKU-000'}
                                {(item.variant?.color || item.variant?.size) && (
                                  <span className="ml-2 lowercase font-medium italic">
                                    ({[item.variant?.color?.name, item.variant?.size?.name].filter(Boolean).join(', ')})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-black">Rs. {Number(item.line_total || 0).toLocaleString()}</p>
                            <p className="text-xs text-zinc-400 font-medium">Qty: {item.quantity} Unit</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-zinc-400 font-medium italic">
                      No line items found.
                    </div>
                  )}
               </div>

               <div className="bg-zinc-50/50 p-8 border-t border-zinc-100 space-y-3">
                  <div className="flex justify-between text-sm font-medium text-zinc-500">
                    <span>Subtotal</span>
                    <span>Rs. {Number(order.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {Number(order.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm font-medium text-emerald-600">
                      <span>Discount</span>
                      <span>- Rs. {Number(order.discount_amount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium text-zinc-500">
                    <span>Shipping</span>
                    <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest">Calculated at dispatch</span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-zinc-100">
                    <span className="text-lg font-black text-black uppercase tracking-tight">Grand Total</span>
                    <span className="text-2xl font-black text-[#966FD6]">Rs. {Number(order.total_amount || order.total || 0).toLocaleString()}</span>
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

        {/* Shipping & Payment Sidebar */}
        <div className="space-y-6">
          {/* Payment Section for Unpaid Orders */}
          {order.payment_status === 'unpaid' && order.status === 'pending' && paymentSettings && (
             <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-[2.5rem] overflow-hidden bg-white border-2 border-[#966FD6]/20">
               <CardHeader className="bg-emerald-600 p-8 text-white">
                 <div className="flex items-center gap-3 mb-2">
                   <Clock className="w-5 h-5" />
                   <h3 className="font-black text-sm uppercase tracking-widest">Complete Payment</h3>
                 </div>
                 <p className="text-emerald-50/80 text-[10px] font-bold uppercase tracking-widest">Select a method to confirm order</p>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                 <div className="space-y-3">
                   {paymentSettings.gateways.map((gateway) => (
                     <label
                       key={gateway.id}
                       className={cn(
                         "flex items-start gap-3 border rounded-xl p-4 cursor-pointer transition-all",
                         selectedGateway === gateway.id
                           ? "border-[#966FD6] bg-[#966FD6]/5 ring-1 ring-[#966FD6]/20"
                           : "border-zinc-100 hover:border-zinc-200"
                       )}
                     >
                       <input
                         type="radio"
                         name="gateway"
                         checked={selectedGateway === gateway.id}
                         onChange={() => setSelectedGateway(gateway.id as PaymentGatewayId)}
                         className="mt-1 accent-[#966FD6]"
                       />
                       <div>
                         <p className="font-black text-xs text-black uppercase tracking-widest">
                           {gateway.label}
                         </p>
                         <p className="text-[10px] text-zinc-500 font-medium mt-1">
                           {gateway.description}
                         </p>
                       </div>
                     </label>
                   ))}
                 </div>
                 
                 <Button 
                   onClick={handlePay}
                   disabled={isPaying || !selectedGateway}
                   className="w-full h-14 bg-[#966FD6] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#855cc4] transition-all shadow-xl shadow-[#966FD6]/20"
                 >
                   {isPaying ? <Spinner className="w-4 h-4 mr-2" /> : null}
                   {selectedGateway === 'cod' ? 'Confirm with COD' : 'Pay Now'}
                 </Button>
               </CardContent>
             </Card>
          )}

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
                {/* <div className="pt-6 border-t border-zinc-50 space-y-1">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Customer Entity</p>
                  <p className="font-bold text-black">{order.customer || 'Shakta Client'}</p>
                </div> */}
              </div>

              {/* <div className="pt-8 text-center border-t border-zinc-50">
                 <Button className="w-full h-12 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/10">
                   Track Shipment
                 </Button>
              </div> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
