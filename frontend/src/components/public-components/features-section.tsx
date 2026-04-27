'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Zap, 
  ShieldCheck, 
  Smartphone, 
  Layout, 
  BarChart, 
  Users 
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Blazing Fast',
    description: 'Optimized for speed with Next.js App Router and Server Components.',
    icon: Zap,
    color: 'text-yellow-500',
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
  },
  {
    title: 'Secure by Default',
    description: 'Built-in authentication and role-based access control systems.',
    icon: ShieldCheck,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    title: 'Fully Responsive',
    description: 'Looks great on any device, from mobile phones to high-res monitors.',
    icon: Smartphone,
    color: 'text-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900/20',
  },
  {
    title: 'Modern Layouts',
    description: 'Premium admin and public layouts designed for the best UX.',
    icon: Layout,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/20',
  },
  {
    title: 'Powerful Analytics',
    description: 'Visualise your data with integrated chart and table systems.',
    icon: BarChart,
    color: 'text-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/20',
  },
  {
    title: 'Team Ready',
    description: 'Simple user management to handle teams of any size.',
    icon: Users,
    color: 'text-pink-500',
    bg: 'bg-pink-100 dark:bg-pink-900/20',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-card/30">
      <div className="container px-6 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Everything You Need</h2>
          <p className="text-lg text-muted-foreground">
            Stop wasting time on boilerplate. Focus on what makes your product unique.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-card group">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`size-7 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
