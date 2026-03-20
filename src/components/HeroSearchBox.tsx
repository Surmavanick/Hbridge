import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, Stethoscope, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { countries, procedures } from "@/data/mockData";

export default function HeroSearchBox() {
  const navigate = useNavigate();
  const [country, setCountry] = useState("");
  const [procedure, setProcedure] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Custom filter to ensure we can match by the actual name
  const customFilter = (value: string, search: string) => {
    if (value.toLowerCase().includes(search.toLowerCase())) return 1;
    return 0;
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (procedure) params.set("procedure", procedure);
    if (dateRange.from) params.set("from", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange.to) params.set("to", format(dateRange.to, "yyyy-MM-dd"));
    navigate(`/book?${params.toString()}`);
  };

  return (
    <div className="glass-card p-4 md:p-6 w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Country */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Your Country
          </label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Procedure */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5" /> Procedure
          </label>
          <Select value={procedure} onValueChange={setProcedure}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select procedure" />
            </SelectTrigger>
            <SelectContent>
              {procedures.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Preferred Dates
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal bg-background", !dateRange.from && "text-muted-foreground")}>
                {dateRange.from ? (
                  dateRange.to ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}` : format(dateRange.from, "MMM d, yyyy")
                ) : "Select dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={dateRange as import("react-day-picker").DateRange}
                onSelect={(range: import("react-day-picker").DateRange | undefined) => {
                  if (range?.from && range?.to) {
                    const diff = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
                    if (diff > 30) {
                      setDateRange({ from: range.from, to: addDays(range.from, 30) });
                      return;
                    }
                  }
                  setDateRange(range || {});
                }}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const minDate = addDays(today, 15);
                  return date < minDate;
                }}
                modifiers={{
                  booked: (date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const minDate = addDays(today, 15);
                    return date >= today && date < minDate;
                  }
                }}
                modifiersClassNames={{
                  booked: "text-red-500 line-through decoration-red-500/50 bg-red-50/50 !opacity-100 font-medium"
                }}
                components={{
                  IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
                  IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
                  DayContent: (props) => {
                    const { date } = props;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const minDate = addDays(today, 15);
                    const isBooked = date >= today && date < minDate;
                    
                    return (
                      <div 
                        className="w-full h-full flex items-center justify-center relative group"
                        title={isBooked ? "Already booked / დაჯავშნილია" : undefined}
                      >
                        <span>{date.getDate()}</span>
                      </div>
                    );
                  }
                }}
                numberOfMonths={1}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* CTA */}
        <div className="flex flex-col justify-end">
          <Button onClick={handleSearch} className="h-10 gap-2">
            <Search className="h-4 w-4" /> Book With Us
          </Button>
        </div>
      </div>
    </div>
  );
}
