'use client';

import * as React from 'react';
import { StatsCard } from '@/src/components/admin-components/stats-card';
import { LineChart } from '@/src/components/charts-components/line-chart';
import { BarChart } from '@/src/components/charts-components/bar-chart';
import { 
  Users, 
  Briefcase, 
  Layers, 
  ShoppingCart,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { PageHeader } from '@/src/components/layout-components/page-wrapper';
import { Button } from '@/src/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';
import Link from 'next/link';

const chartData = [
  { name: 'Jan', value: 120 },
  { name: 'Feb', value: 156 },
  { name: 'Mar', value: 245 },
  { name: 'Apr', value: 310 },
  { name: 'May', value: 280 },
  { name: 'Jun', value: 410 },
  { name: 'Jul', value: 650 },
];

export function DashboardOverview() {
  return (
    <div className="space-y-8" style={{ fontFamily: 'Lato, sans-serif' }}>
      <PageHeader 
        title="Admin Dashboard" 
        description="Welcome to Exclusive. Here's your platform overview today."
      >
        <Button className="h-11 px-6 rounded-xl bg-[#966FD6] hover:bg-[#7d5bbf] text-white transition-all shadow-md">
          Download Monthly Report
        </Button>
      </PageHeader>

      {/* KPI Cards section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-black text-black mb-4 flex items-center gap-2">
            <ShoppingCart className="size-5 text-[#966FD6]" />
            Sales Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Orders"
              value="456"
              description="from last month"
              icon={ShoppingCart}
              trend="up"
              trendValue="+18%"
            />
            <StatsCard
              title="Pending Orders"
              value="24"
              description="requires attention"
              icon={ShoppingCart}
              trend="down"
              trendValue="-5%"
            />
            <StatsCard
              title="Processing"
              value="12"
              description="in fulfillment"
              icon={ShoppingCart}
              trend="up"
              trendValue="+2"
            />
            <StatsCard
              title="Delivered"
              value="420"
              description="successfully reached"
              icon={CheckCircle2}
              trend="up"
              trendValue="+12%"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-black text-black mb-4 flex items-center gap-2">
            <Briefcase className="size-5 text-green-600" />
            Financial Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="Total Revenue"
              value="$12,450"
              description="Gross settled funds"
              icon={ShoppingCart}
              trend="up"
              trendValue="+24%"
            />
            <StatsCard
              title="Pending Collections"
              value="$3,200"
              description="Awaiting settlement"
              icon={Briefcase}
              trend="down"
              trendValue="-2%"
            />
            <StatsCard
              title="Settled Today"
              value="$1,850"
              description="Daily transaction volume"
              icon={CheckCircle2}
              trend="up"
              trendValue="+$850"
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <LineChart 
          title="B2B Revenue Growth" 
          description="Monthly wholesale revenue overview."
          data={chartData} 
          className="lg:col-span-4"
        />
        <BarChart 
          title="Top Categories" 
          description="Comparison of wholesale volumes by category."
          data={chartData} 
          className="lg:col-span-3"
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-2xl border border-zinc-100 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-50 px-6 py-5">
            <CardTitle className="text-xl font-black tracking-tight text-black">Wholesaler Approvals</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-[#966FD6] hover:bg-[#966FD6]/10 font-bold">
              View Directory <ArrowRight className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-50">
              {[
                { name: 'Apex Electronics LTD', time: '2 hours ago', status: 'Approved' },
                { name: 'Global Supply Co.', time: '5 hours ago', status: 'Approved' },
                { name: 'Smith & Sons Wholesale', time: 'Yesterday', status: 'Approved' },
                { name: 'Prime Distributors', time: 'Yesterday', status: 'Approved' },
              ].map((partner, i) => (
                <div key={i} className="flex items-center justify-between p-6 hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-[#966FD6]/10 flex items-center justify-center text-[#966FD6] font-black text-lg">
                      {partner.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-base text-black/90">{partner.name}</p>
                      <p className="text-sm text-zinc-400 font-medium">{partner.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-black uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {partner.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-none shadow-[0_20px_40px_rgba(150,111,214,0.2)] bg-[#966FD6] text-white overflow-hidden relative rounded-2xl p-2 flex flex-col justify-center">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-black/10 rounded-full blur-2xl opacity-30" />
          <CardHeader className="relative z-10 pt-8">
            <CardTitle className="text-3xl font-black tracking-tighter">Admin Portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10 pb-8">
            <p className="text-white/80 leading-relaxed font-medium">
              Manage core platform settings and wholesale relationships seamlessly.
            </p>
            <div className="flex flex-col gap-4">
              <Link href="/admin/categories" className="flex items-center justify-between bg-white text-[#966FD6] hover:bg-zinc-100 font-black h-14 px-6 rounded-xl transition-all shadow-xl hover:translate-y-[-2px]">
                <span>Categories</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Button className="w-full justify-between bg-black/20 text-white hover:bg-black/30 font-bold h-14 px-6 rounded-xl border-0 shadow-none transition-all">
                <span>Wholesale Queue</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
