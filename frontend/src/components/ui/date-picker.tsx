'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker, Matcher } from 'react-day-picker';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import * as PopoverPrimitive from '@radix-ui/react-popover';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-[1000] w-auto rounded-[24px] border bg-white p-2 text-popover-foreground shadow-[0_20px_50px_rgba(0,0,0,0.1)] outline-none animate-in fade-in zoom-in-95 duration-200',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export function DatePicker({ 
  date, 
  setDate,
  placeholder = "Pick a date",
  disabled
}: { 
  date?: Date, 
  setDate: (date?: Date) => void,
  placeholder?: string,
  disabled?: Matcher | Matcher[]
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-bold rounded-xl h-11 bg-white border-zinc-200 hover:border-[#966FD6]/30 hover:bg-zinc-50/50 transition-all shadow-sm group',
            !date && 'text-zinc-400 font-medium'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400 group-hover:text-[#966FD6] transition-colors" />
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 border-zinc-100" align="start">
        <div className="p-4 bg-white rounded-[24px] font-poppins">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={setDate}
            captionLayout="dropdown"
            fromYear={2000}
            toYear={2050}
            hideNavigation
            disabled={disabled}
            className="p-0"
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-6',
              caption: 'flex justify-center relative items-center mb-4 px-1 gap-4',
              caption_label: 'text-sm font-black text-black uppercase tracking-widest hidden',
              caption_dropdowns: 'flex gap-2 font-bold text-sm bg-zinc-50 p-1 rounded-lg border border-zinc-100',
              table: 'w-full border-collapse',
              head_row: 'flex mb-2',
              head_cell: 'text-zinc-400 rounded-md w-10 font-bold text-[10px] uppercase tracking-tighter',
              row: 'flex w-full mt-1',
              cell: 'h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
              day: cn(
                'h-10 w-10 p-0 font-bold aria-selected:opacity-100 hover:bg-[#966FD6]/10 hover:text-[#966FD6] rounded-xl transition-all duration-200'
              ),
              day_selected:
                '!bg-[#966FD6] !text-white hover:!bg-[#966FD6] hover:!text-white focus:!bg-[#966FD6] focus:!text-white shadow-lg shadow-[#966FD6]/30',
              day_today: 'bg-zinc-100 text-[#966FD6]',
              day_outside: 'text-zinc-300 opacity-50',
              day_disabled: 'text-zinc-300 opacity-50',
              day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
              day_hidden: 'invisible',
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
