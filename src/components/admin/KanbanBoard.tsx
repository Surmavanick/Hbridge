import { useState, useRef } from "react";
import { BookingRequest, BookingStatus, procedures } from "@/data/mockData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MailWarning, FileText, Hourglass, Plane, CircleDot,
  AlertTriangle, MoreHorizontal, UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

// ─── Column config ────────────────────────────────────────────────────

const PIPELINE_COLUMNS: {
  id: string;
  title: string;
  statuses: BookingStatus[];
  dropStatus: BookingStatus;
  icon: React.ElementType;
  color: string;
  bg: string;
  dropBg: string;
}[] = [
  {
    id: "step1",
    title: "Step 1: New Lead",
    statuses: ["Lead - Step 1: Awaiting Email Verification"],
    dropStatus: "Lead - Step 1: Awaiting Email Verification",
    icon: MailWarning,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    dropBg: "bg-blue-100/70 border-blue-400",
  },
  {
    id: "step2",
    title: "Step 2: Profile Ready",
    statuses: ["Lead - Step 2: Profile Completed"],
    dropStatus: "Lead - Step 2: Profile Completed",
    icon: FileText,
    color: "text-sky-700",
    bg: "bg-sky-50 border-sky-200",
    dropBg: "bg-sky-100/70 border-sky-400",
  },
  {
    id: "step3",
    title: "Step 3: Clinic Review",
    statuses: ["Lead - Step 3: Clinic Confirmation", "Awaiting Hospital Response"],
    dropStatus: "Lead - Step 3: Clinic Confirmation",
    icon: Hourglass,
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    dropBg: "bg-orange-100/70 border-orange-400",
  },
  {
    id: "step4",
    title: "Step 4: Travel/Invoice",
    statuses: ["Lead - Step 4: Travel Booked", "Travel Coordination in Progress"],
    dropStatus: "Lead - Step 4: Travel Booked",
    icon: Plane,
    color: "text-violet-700",
    bg: "bg-violet-50 border-violet-200",
    dropBg: "bg-violet-100/70 border-violet-400",
  },
  {
    id: "step5",
    title: "Step 5: Pre-Arrival",
    statuses: ["Lead - Step 5: Awaiting Arrival", "Appointment Scheduled", "Hospital Confirmed"],
    dropStatus: "Lead - Step 5: Awaiting Arrival",
    icon: CircleDot,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dropBg: "bg-emerald-100/70 border-emerald-400",
  },
];

// ─── Props ────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  bookings: BookingRequest[];
  onOpenPatient: (booking: BookingRequest) => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onAccept?: (id: string) => void;
}

// ─── Board ────────────────────────────────────────────────────────────

export function KanbanBoard({ bookings, onOpenPatient, onStatusChange, onAccept }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const dragBookingRef = useRef<BookingRequest | null>(null);

  const activeBookings = bookings.filter(
    (b) => !["Completed", "Rejected"].includes(b.status)
  );

  const handleDragStart = (e: React.DragEvent, booking: BookingRequest) => {
    dragBookingRef.current = booking;
    setDraggingId(booking.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverColumnId(null);
    dragBookingRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverColumnId(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setOverColumnId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, col: typeof PIPELINE_COLUMNS[0]) => {
    e.preventDefault();
    setOverColumnId(null);
    const booking = dragBookingRef.current;
    if (!booking) return;
    // only update if the card is actually moving to a different column
    if (!col.statuses.includes(booking.status)) {
      onStatusChange(booking.id, col.dropStatus);
    }
    setDraggingId(null);
    dragBookingRef.current = null;
  };

  return (
    <>
      {/* Mobile: stacked sections (no horizontal cut/scroll) */}
      <div className="md:hidden h-full overflow-y-auto space-y-3 pb-4 pr-1">
        {PIPELINE_COLUMNS.map((col) => {
          const columnBookings = activeBookings.filter((b) => col.statuses.includes(b.status));
          const Icon = col.icon;

          return (
            <section key={col.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className={cn("px-3 py-2.5 flex items-center justify-between border-b border-slate-200", col.bg)}>
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`h-4 w-4 ${col.color} shrink-0`} />
                  <h3 className={`font-semibold text-xs ${col.color} truncate`} title={col.title}>{col.title}</h3>
                </div>
                <Badge variant="secondary" className="bg-white/70 text-[10px] px-1.5 py-0 h-5 font-bold shadow-sm shrink-0">
                  {columnBookings.length}
                </Badge>
              </div>

              <div className="p-2.5 space-y-2 bg-slate-50/40">
                {columnBookings.map((booking) => (
                  <KanbanCard
                    key={booking.id}
                    booking={booking}
                    isDragging={false}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={() => onOpenPatient(booking)}
                    draggable={false}
                    compact
                    isUnassigned={!booking.assignedPartnerId}
                    onAccept={onAccept ? () => onAccept(booking.id) : undefined}
                  />
                ))}

                {columnBookings.length === 0 && (
                  <div className="h-14 flex items-center justify-center text-[11px] border border-dashed border-slate-200 rounded-lg text-slate-400 bg-white">
                    No patients
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Desktop/Tablet: drag & drop board */}
      <div className="hidden md:flex h-full gap-3 pb-4 pt-2 px-1 overflow-x-auto overscroll-x-contain">
        {PIPELINE_COLUMNS.map((col) => {
          const columnBookings = activeBookings.filter((b) =>
            col.statuses.includes(b.status)
          );
          const Icon = col.icon;
          const isOver = overColumnId === col.id;

          return (
            <div
              key={col.id}
              className="flex-1 min-w-[210px] flex flex-col h-[calc(100vh-220px)] min-h-[500px]"
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col)}
            >
              {/* Header */}
              <div
                className={cn(
                  "rounded-t-lg border-t border-l border-r p-2.5 flex items-center justify-between transition-colors duration-150",
                  isOver ? col.dropBg : col.bg
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 ${col.color}`} />
                  <h3
                    className={`font-semibold text-xs ${col.color} line-clamp-1`}
                    title={col.title}
                  >
                    {col.title}
                  </h3>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-white/60 hover:bg-white/80 text-[10px] px-1.5 py-0 h-4 font-bold shadow-sm"
                >
                  {columnBookings.length}
                </Badge>
              </div>

              {/* Body */}
              <div
                className={cn(
                  "flex-1 overflow-y-auto border-l border-r border-b rounded-b-lg p-2 space-y-2 scrollbar-thin transition-all duration-150",
                  isOver
                    ? "bg-slate-100/80 border-dashed border-slate-300"
                    : "bg-slate-50/50 border-slate-200"
                )}
              >
                {columnBookings.map((booking) => (
                  <KanbanCard
                    key={booking.id}
                    booking={booking}
                    isDragging={draggingId === booking.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={() => onOpenPatient(booking)}
                    draggable
                    isUnassigned={!booking.assignedPartnerId}
                    onAccept={onAccept ? () => onAccept(booking.id) : undefined}
                  />
                ))}

                {columnBookings.length === 0 && (
                  <div
                    className={cn(
                      "h-16 flex items-center justify-center text-[10px] border border-dashed rounded-lg transition-colors",
                      isOver
                        ? "border-slate-400 text-slate-500 bg-white/50"
                        : "border-slate-200 text-slate-400"
                    )}
                  >
                    {isOver ? "Drop here" : "No patients"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────

interface KanbanCardProps {
  booking: BookingRequest;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, booking: BookingRequest) => void;
  onDragEnd: () => void;
  onClick: () => void;
  draggable?: boolean;
  compact?: boolean;
  isUnassigned?: boolean;
  onAccept?: () => void;
}

function KanbanCard({
  booking,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
  draggable = true,
  compact = false,
  isUnassigned = false,
  onAccept,
}: KanbanCardProps) {
  const proc = procedures.find((p) => p.id === booking.procedureId);
  const isWarning =
    booking.status.includes("More Information") ||
    (booking.notes && booking.notes.toLowerCase().includes("missing"));

  return (
    <Card
      draggable={draggable && !isUnassigned}
      onDragStart={draggable && !isUnassigned ? (e) => onDragStart(e, booking) : undefined}
      onDragEnd={draggable && !isUnassigned ? onDragEnd : undefined}
      onClick={onClick}
      className={cn(
        "transition-all border-l-4 select-none",
        draggable && !isUnassigned ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        isDragging ? "opacity-40 scale-95 shadow-none" : "hover:shadow-md",
        isUnassigned && booking.status === "Lead - Step 1: Awaiting Email Verification"
          ? "border-l-emerald-500 bg-emerald-50/40"
          : isWarning
          ? "border-l-amber-400"
          : "border-l-transparent hover:border-l-slate-300"
      )}
    >
      <div className={cn(compact ? "p-2.5" : "p-3")}>
        {/* Unassigned badge — only on Step 1 */}
        {isUnassigned && booking.status === "Lead - Step 1: Awaiting Email Verification" && (
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              <UserPlus className="h-2.5 w-2.5" /> New Lead
            </div>
            <span className="text-[9px] text-slate-400 font-medium">{timeAgo(booking.createdAt)}</span>
          </div>
        )}

        {/* Name & Country */}
        <div className="flex justify-between items-start mb-1.5">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
              {booking.patientName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-800 leading-none truncate">
                {booking.patientName}
              </p>
              <div className="flex items-center gap-1 mt-0.5 text-[9px] text-slate-500">
                <span>{booking.countryFlag}</span>
                <span className="truncate max-w-[80px]">{booking.country}</span>
              </div>
            </div>
          </div>
          {!isUnassigned && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-slate-400 hover:text-slate-600 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Procedure */}
        <div className="text-[10px] font-medium text-slate-600 mb-2 bg-slate-50 px-1.5 py-1 rounded border border-slate-100 truncate">
          {proc?.name || "Unknown Procedure"}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[9px] mt-1 pt-1 border-t border-slate-100">
          <span className="text-slate-400">
            {format(new Date(booking.createdAt), "MMM d")}
          </span>
          {isUnassigned && onAccept && booking.status === "Lead - Step 1: Awaiting Email Verification" ? (
            <Button
              size="sm"
              className="h-5 px-2 text-[9px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded"
              onClick={(e) => { e.stopPropagation(); onAccept(); }}
            >
              Accept
            </Button>
          ) : booking.sessions && booking.sessions.length > 0 ? (
            <span className="font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
              {format(new Date(booking.sessions[0].date), "MMM d")}
            </span>
          ) : isWarning ? (
            <span className="flex items-center gap-0.5 text-amber-600 font-bold">
              <AlertTriangle className="h-2.5 w-2.5" /> Req Info
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
