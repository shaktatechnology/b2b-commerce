'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
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
        'z-[1000] w-auto rounded-3xl border border-zinc-100 bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
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
  placeholder = 'Pick a date',
  disabled,
}: {
  date?: Date;
  setDate: (date?: Date) => void;
  placeholder?: string;
  disabled?: Matcher | Matcher[];
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-bold rounded-xl h-11 bg-white border-zinc-200 hover:border-violet-300 hover:bg-zinc-50/50 transition-all shadow-sm group',
            !date ? 'text-zinc-400 font-medium hover:text-[#966FD6]' : 'text-zinc-900 group-hover:text-[#966FD6]'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400 group-hover:text-violet-500 transition-colors" />
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0" align="start">
        <div className="p-4 bg-white rounded-3xl">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={setDate}
            captionLayout="dropdown"
            fromYear={2000}
            toYear={2050}
            hideNavigation
            disabled={disabled}
            classNames={{
              root:          'w-full',
              months:        'flex flex-col',
              month:         'space-y-3',
              month_caption: 'flex justify-start items-center mb-3 px-1',
              dropdowns:     'inline-flex flex-row items-center gap-3 text-sm font-bold',
              dropdown_root: 'relative inline-flex flex-row items-center gap-1 cursor-pointer',
              dropdown:      'absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10',
              caption_label: 'text-sm font-bold text-zinc-800 pointer-events-none select-none',
              chevron:       'inline-block ml-0.5 w-3 h-3 fill-zinc-500 pointer-events-none',
              month_grid:    'w-full border-collapse',
              weekdays:      'grid grid-cols-7',
              weekday:       'text-zinc-400 font-semibold text-[10px] uppercase tracking-wider text-center py-2',
              weeks:         'space-y-1 mt-1',
              week:          'grid grid-cols-7',
              day:           'flex items-center justify-center',

              // <button> inside each day cell — base style
              day_button: [
                'size-9 rounded-xl text-sm font-semibold',
                'flex items-center justify-center',
                'transition-all duration-150 cursor-pointer',
                'text-zinc-900',                              // available dates: black
                'hover:bg-violet-50 hover:text-violet-600',
                'focus-visible:outline-none',
              ].join(' '),

              // selected: td gets this class — use * to pierce into the button (Tailwind v4)
              selected: [
                '*:bg-violet-500!',
                '*:text-white!',
                '*:shadow-md!',
                '*:shadow-violet-200!',
                '*:ring-2!',
                '*:ring-violet-600!',
                '*:ring-offset-1!',
                'hover:*:bg-violet-600!',
              ].join(' '),

              // disabled: td gets this — gray out the inner button
              disabled: [
                '*:text-zinc-300!',          // gray text
                '*:cursor-not-allowed!',
                'hover:*:bg-transparent!',
                'hover:*:text-zinc-300!',
              ].join(' '),

              today:   '*:bg-zinc-100 *:text-violet-500',
              outside: 'opacity-30 pointer-events-none',
              hidden:  'invisible',
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}