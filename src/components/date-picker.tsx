// src/components/ui/DatePickerWithPresets.tsx
"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DatePickerWithPresetsProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
}

export function DatePickerWithPresets({ value, onChange }: DatePickerWithPresetsProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
  const [selectedTime, setSelectedTime] = React.useState<string>("12:00 PM");

  React.useEffect(() => {
    if (selectedDate) {
      // Combine selected date and time into a single Date object
      const [hours, minutes, period] = selectedTime.split(/[: ]/);
      let hoursNumber = parseInt(hours);
      const minutesNumber = parseInt(minutes);

      if (period === "PM" && hoursNumber !== 12) {
        hoursNumber += 12;
      }
      if (period === "AM" && hoursNumber === 12) {
        hoursNumber = 0;
      }

      const combinedDate = new Date(selectedDate);
      combinedDate.setHours(hoursNumber);
      combinedDate.setMinutes(minutesNumber);
      combinedDate.setSeconds(0);
      combinedDate.setMilliseconds(0);

      onChange(combinedDate);
    }
  }, [selectedDate, selectedTime, onChange]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            "w-full justify-center font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {value ? format(value, "PPP p") : <span>Pick a date & time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex flex-col space-y-2 p-2"
      >
        {/* Preset Date Options */}
        <Select
          onValueChange={(value) => {
            const daysToAdd = parseInt(value);
            const presetDate = addDays(new Date(), daysToAdd);
            setSelectedDate(presetDate);
          }}
          value={
            selectedDate
              ? Math.floor((selectedDate.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)).toString()
              : ""
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a preset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Today</SelectItem>
            <SelectItem value="1">Tomorrow</SelectItem>
            <SelectItem value="3">In 3 days</SelectItem>
            <SelectItem value="7">In a week</SelectItem>
          </SelectContent>
        </Select>

        {/* Calendar for Custom Date Selection */}
        <div className="rounded-md border">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="bg-gray-800 text-white"
          />
        </div>

        {/* Time Selection */}
        <div className="flex space-x-2">
          <Select
            onValueChange={(value) => setSelectedTime(value)}
            value={selectedTime}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Time" />
            </SelectTrigger>
            <SelectContent>
              {generateTimeOptions().map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to generate time options in 30-minute increments
function generateTimeOptions(): string[] {
  const times: string[] = [];
  const periods = ["AM", "PM"];

  for (let period of periods) {
    for (let hour = 1; hour <= 12; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const minuteStr = minute === 0 ? "00" : "30";
        times.push(`${hour}:${minuteStr} ${period}`);
      }
    }
  }

  return times;
}
