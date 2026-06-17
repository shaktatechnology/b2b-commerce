import { Card, CardContent } from '@/src/components/ui/card';
import { cn } from '@/src/lib/utils';
import { ArrowDown, ArrowUp, LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  trendValue?: string;
  className?: string;
  href?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
  href,
}: StatsCardProps) {
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (href) {
      return (
        <Link 
          href={href} 
          className="block group"
        >
          {children}
        </Link>
      );
    }
    return <>{children}</>;
  };

  return (
    <CardWrapper>
      <Card className={cn(
        'overflow-hidden transition-all duration-300 border-none shadow-md', 
        href && 'hover:shadow-xl hover:translate-y-[-4px] cursor-pointer ring-1 ring-zinc-100 hover:ring-primary/20',
        className
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
              <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
            </div>
            <div className={cn(
              "h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-all duration-300",
              href && "group-hover:bg-primary group-hover:text-white group-hover:scale-110"
            )}>
              <Icon className="size-6" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2">
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full',
                  trend === 'up' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                )}
              >
                {trend === 'up' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                {trendValue}
              </div>
            )}
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  );
}
