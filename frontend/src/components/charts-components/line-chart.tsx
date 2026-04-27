'use client';

import * as React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';

interface ChartData {
  name: string;
  value: number;
}

interface LineChartProps {
  title: string;
  description?: string;
  data: ChartData[];
  className?: string;
  color?: string;
}

export function LineChart({
  title,
  description,
  data,
  className,
  color = 'var(--primary)',
}: LineChartProps) {
  return (
    <Card className={cn('overflow-hidden border-none shadow-md', className)}>
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0 pb-4 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background/80 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        {payload[0].payload.name}
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {payload[0].value}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
