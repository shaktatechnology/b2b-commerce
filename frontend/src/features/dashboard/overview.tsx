'use client';

import * as React from 'react';
import { StatsCard } from '@/src/components/admin-components/stats-card';
import { LineChart } from '@/src/components/charts-components/line-chart';
import { BarChart } from '@/src/components/charts-components/bar-chart';
import { 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '@/src/components/layout-components/page-wrapper';
import { Button } from '@/src/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card';

const chartData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
  { name: 'Jul', value: 1100 },
];

export function DashboardOverview() {
  return (
    <div className="space-y-8 font-poppins">
      <PageHeader 
        title="Dashboard Overview" 
        description="Welcome back! Here's what's happening today."
      >
        <Button variant="outline" className="h-11 px-6 rounded-xl">Download Report</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value="12,543"
          description="from last month"
          icon={Users}
          trend="up"
          trendValue="+12%"
        />
        <StatsCard
          title="Revenue"
          value="$45,231"
          description="from last month"
          icon={DollarSign}
          trend="up"
          trendValue="+8%"
        />
        <StatsCard
          title="Sales"
          value="2,345"
          description="from last month"
          icon={ShoppingCart}
          trend="down"
          trendValue="-3%"
        />
        <StatsCard
          title="Active Now"
          value="+573"
          description="in the last 24h"
          icon={Activity}
          trend="up"
          trendValue="+24%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <LineChart 
          title="Revenue Growth" 
          description="Monthly revenue overview for the current year."
          data={chartData} 
          className="lg:col-span-4"
        />
        <BarChart 
          title="Sales by Category" 
          description="Comparison of sales across different categories."
          data={chartData} 
          className="lg:col-span-3"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              View all <ArrowRight className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Transaction #{1000 + i}</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">+${((i * 47.31) % 100 + 20).toFixed(2)}</p>
                    <p className="text-[10px] text-green-500 font-bold uppercase">Completed</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Upgrade to Pro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <p className="text-primary-foreground/80 leading-relaxed">
              Unlock advanced analytics, unlimited users, and priority support for your entire team.
            </p>
            <Button className="w-full bg-white text-primary hover:bg-white/90 font-bold h-12 rounded-xl">
              Get Started Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
