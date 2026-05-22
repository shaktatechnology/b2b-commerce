'use client';

import * as React from 'react';
import { format, setHours, setMinutes } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
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

export function DateTimePicker({
  date,
  setDate,
  placeholder = 'Pick date and time',
  disabled,
}: {
  date?: Date;
  setDate: (date?: Date) => void;
  placeholder?: string;
  disabled?: Matcher | Matcher[];
}) {

  const handleTimeChange = (type: 'hours' | 'minutes', value: number) => {
    if (!date) {
      const now = new Date();
      const newDate = type === 'hours' ? setHours(now, value) : setMinutes(now, value);
      setDate(newDate);
      return;
    }
    const newDate = type === 'hours' ? setHours(date, value) : setMinutes(date, value);
    setDate(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-bold rounded-xl h-12 bg-zinc-50/50 border-zinc-100 hover:border-[#966FD6]/30 hover:bg-white transition-all shadow-sm group',
            !date ? 'text-zinc-400 font-medium group-hover:text-[#966FD6]' : 'text-zinc-900 group-hover:text-[#966FD6]'
          )}
        >
          <CalendarIcon className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-[#966FD6] transition-colors" />
          {date ? format(date, 'PPP HH:mm') : <span className="group-hover:text-[#966FD6] transition-colors">{placeholder}</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 overflow-hidden" align="start">
        <div className="flex bg-white rounded-3xl overflow-hidden">
          {/* Calendar Section */}
          <div className="p-4 border-r border-zinc-50">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d && date) {
                   // Keep the current time
                   const updated = setHours(setMinutes(d, date.getMinutes()), date.getHours());
                   setDate(updated);
                } else {
                   setDate(d);
                }
              }}
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
                day_button: [
                  'size-9 rounded-xl text-sm font-semibold',
                  'flex items-center justify-center',
                  'transition-all duration-150 cursor-pointer',
                  'text-zinc-900',
                  'hover:bg-violet-50 hover:text-violet-600',
                  'focus-visible:outline-none',
                ].join(' '),
                selected: [
                  '*:bg-[#966FD6]!',
                  '*:text-white!',
                  '*:shadow-md!',
                  '*:shadow-violet-200!',
                  '*:ring-2!',
                  '*:ring-[#966FD6]!',
                  '*:ring-offset-1!',
                  'hover:*:bg-[#7d5bbf]!',
                ].join(' '),
                disabled: [
                  '*:text-zinc-200!',
                  '*:cursor-not-allowed!',
                  'hover:*:bg-transparent!',
                  'hover:*:text-zinc-200!',
                ].join(' '),
                today:   '*:bg-zinc-100 *:text-[#966FD6]',
                outside: 'opacity-30 pointer-events-none',
                hidden:  'invisible',
              }}
            />
          </div>

          {/* Time Section */}
          <div className="flex flex-col w-48 bg-zinc-50/30">
             <div className="p-4 border-b border-zinc-50 flex items-center justify-center gap-2">
                <Clock className="size-3 text-[#966FD6]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select Time</span>
             </div>
             
             <div className="flex-1 p-6 flex flex-col justify-center items-center gap-6">
                <div className="flex items-center gap-3">
                   {/* Hour Input */}
                   <div className="flex flex-col items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Hour</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={date ? date.getHours().toString().padStart(2, '0') : '00'}
                        onChange={(e) => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val)) val = 0;
                          if (val > 23) val = 23;
                          if (val < 0) val = 0;
                          handleTimeChange('hours', val);
                        }}
                        className="w-14 h-14 rounded-2xl border-2 border-zinc-100 bg-white text-center text-lg font-black text-black outline-none focus:border-[#966FD6] focus:ring-4 focus:ring-[#966FD6]/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                   </div>

                   <span className="text-xl font-black text-zinc-300 mt-5">:</span>

                   {/* Minute Input */}
                   <div className="flex flex-col items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Minute</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={date ? date.getMinutes().toString().padStart(2, '0') : '00'}
                        onChange={(e) => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val)) val = 0;
                          if (val > 59) val = 59;
                          if (val < 0) val = 0;
                          handleTimeChange('minutes', val);
                        }}
                        className="w-14 h-14 rounded-2xl border-2 border-zinc-100 bg-white text-center text-lg font-black text-black outline-none focus:border-[#966FD6] focus:ring-4 focus:ring-[#966FD6]/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                   </div>
                </div>

             </div>

             <div className="p-3 border-t border-zinc-50 bg-white flex justify-center gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setDate(undefined)}
                  className="text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-full px-4 h-8"
                >
                  Clear
                </Button>
                <div className="text-[11px] font-black text-[#966FD6] bg-[#966FD6]/5 px-4 py-1.5 rounded-full border border-[#966FD6]/10">
                   {date ? format(date, 'HH:mm') : '--:--'}
                </div>
             </div>
          </div>
        </div>
      </PopoverContent>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #966FD6;
        }
      `}</style>
    </Popover>
  );
}
