'use client';

import * as React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';

interface ChartData {
  name: string;
  value: number;
}

interface BarChartProps {
  title: string;
  description?: string;
  data: ChartData[];
  className?: string;
}

export function BarChart({
  title,
  description,
  data,
  className,
}: BarChartProps) {
  return (
    <Card className={cn('overflow-hidden border-none shadow-md', className)}>
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-6 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} barSize={20}>
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
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
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index % 2 === 0 ? 'var(--primary)' : 'var(--accent)'} 
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
