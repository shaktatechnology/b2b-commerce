import { cn } from "@/src/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-400", className)}
      {...props}
    />
  );
}

export { Skeleton };
