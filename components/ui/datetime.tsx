"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
  withTime?: boolean;
  className?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  withTime,
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value
  );
  const [time, setTime] = React.useState<string>(
    value ? format(value, "HH:mm") : "12:00"
  );

  const handleDateChange = (date?: Date) => {
    if (disabled) return;
    setSelectedDate(date);
    if (date && time) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      onChange(newDate);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setTime(e.target.value);
    if (selectedDate) {
      const [hours, minutes] = e.target.value.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      onChange(newDate);
    }
  };

  return (
    <div className={cn("flex space-x-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("justify-start text-left w-full", disabled && "opacity-50 cursor-not-allowed")}
            disabled={disabled} // ✅ disable button
          >
            {selectedDate ? format(selectedDate, "PPP") : "Select date"}
          </Button>
        </PopoverTrigger>
        {!disabled && (
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              defaultMonth={selectedDate || new Date()}
              showOutsideDays
            />
          </PopoverContent>
        )}
      </Popover>

      {withTime && (
        <Input
          type="time"
          value={time}
          onChange={handleTimeChange}
          className="w-24"
          disabled={disabled}
        />
      )}
    </div>
  );
}
