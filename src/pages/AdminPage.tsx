import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  procedures, hospitals, mockDoctors,
  type BookingRequest, type BookingSession, type BookingStatus,
} from "@/data/mockData";
import { useBookings } from "@/store/bookingStore";
import { Building2, Calendar as CalendarIcon, MapPin, Users, ChevronLeft, ChevronRight, Activity, Clock, FileText, LayoutGrid, CheckCircle2, AlertCircle, Phone, Mail, MoreHorizontal, DollarSign, TrendingUp, Search, Columns, Hourglass, MailWarning, AlertTriangle, Plane, CircleDot, Copy, Check, UserPlus, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { useAuth } from "@/store/authStore";
import { getDoctorBusySlots, findFirstFreeSlotInRange, findNextFreeSlot, pickBestDoctor, consultationSessionTitle, isConsultationSession, isVisitSession } from "@/lib/doctorAvailability";

// NEW COMPONENTS
import { KanbanBoard } from "@/components/admin/KanbanBoard";
import { PatientDrawer } from "@/components/admin/PatientDrawer";

/* ═══════════════════════════════════════════
   HELPERS & CONFIG
   ═══════════════════════════════════════════ */

const SESSION_TYPE_COLORS: Record<string, string> = {
  consultation: "bg-teal-500/90",
  visit:        "bg-indigo-500/85",
  diagnostic:   "bg-sky-500/90",
  surgery:      "bg-rose-500/90",
  therapy:      "bg-violet-500/85",
  followup:     "bg-slate-500/85",
  default:      "bg-cyan-600/85",
};

const getSessionColor = (title: string): string => {
  if (isVisitSession(title)) return SESSION_TYPE_COLORS.visit;
  const t = title.toLowerCase();
  if (/surg|implant|transplant|acl|lasik|fue|rhinoplast/.test(t)) return SESSION_TYPE_COLORS.surgery;
  if (/consult|briefing|review|planning|ivf|report/.test(t)) return SESSION_TYPE_COLORS.consultation;
  if (/x-ray|blood|ecg|echo|mri|ultrasound|scan|urine|vitals|stress|holter|eye exam|mapping|neurology|screening/.test(t)) return SESSION_TYPE_COLORS.diagnostic;
  if (/post-op|follow|check|bandage|vision|remove/.test(t)) return SESSION_TYPE_COLORS.followup;
  if (/prep|anesthesia|monitor/.test(t)) return SESSION_TYPE_COLORS.therapy;
  return SESSION_TYPE_COLORS.default;
};

const statusMeta: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  "Lead - Step 1: Awaiting Email Verification": { label: "STEP 1 · Awaiting Email", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: MailWarning },
  "Lead - Step 2: Profile Completed":           { label: "STEP 2 · Profile Ready", color: "text-sky-700", bg: "bg-sky-50 border-sky-200", icon: FileText },
  "Lead - Step 3: Clinic Confirmation":         { label: "STEP 3 · Clinic Review", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: Hourglass },
  "Lead - Step 4: Travel Booked":               { label: "STEP 4 · Travel Booked", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", icon: Plane },
  "Lead - Step 5: Awaiting Arrival":            { label: "STEP 5 · Pre-Arrival", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CircleDot },
  "Submitted":                                  { label: "Submitted", color: "text-sky-700", bg: "bg-sky-50 border-sky-200", icon: FileText },
  "Under Review":                               { label: "Under Review", color: "text-sky-700", bg: "bg-sky-50 border-sky-200", icon: Hourglass },
  "Awaiting Hospital Response":                 { label: "Awaiting Doctor", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: Hourglass },
  "Hospital Confirmed":                         { label: "Consultation Confirmed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  "Appointment Scheduled":                      { label: "Visit Scheduled", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  "In Treatment":                               { label: "In Treatment", color: "text-teal-700", bg: "bg-teal-50 border-teal-200", icon: Activity },
  "More Information Required":                  { label: "More Info", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: AlertTriangle },
  "Completed":                                  { label: "Completed", color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: CheckCircle2 },
  "Rejected":                                   { label: "Rejected", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: AlertTriangle },
};

const getStatus = (s: string) => statusMeta[s] || { label: s, color: "text-muted-foreground", bg: "bg-muted border-border", icon: CircleDot };

const getBookingRevenue = (b: BookingRequest) => {
  const proc = procedures.find((p) => p.id === b.procedureId);
  if (!proc || !proc.priceRange) return 0;
  const match = proc.priceRange.match(/[\d,]+/);
  return match ? parseInt(match[0].replace(",", "")) : 800;
};

const CONFIRMED_STATUSES = new Set<BookingStatus>([
  "Appointment Scheduled",
  "Hospital Confirmed",
  "In Treatment",
  "Completed",
]);

function MobileScheduleRow({ booking, dateStr, onOpenPatient }: { booking: BookingRequest; dateStr: string; onOpenPatient: (b: BookingRequest) => void }) {
  const sessions = (booking.sessions || [])
    .filter((s) => s.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time));
  const proc = procedures.find((p) => p.id === booking.procedureId);
  const sm = getStatus(booking.status);
  const StatusIcon = sm.icon;

  return (
    <button
      type="button"
      className="w-full text-left rounded-xl border border-slate-200 bg-white shadow-sm p-3.5 transition-colors hover:bg-slate-50"
      onClick={() => onOpenPatient(booking)}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
          {booking.patientName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 truncate">{booking.patientName}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
            <span>{booking.countryFlag}</span>
            <span>{booking.country}</span>
            <span className="text-slate-300">•</span>
            <span className="truncate">{proc?.name || "Procedure TBD"}</span>
          </p>
          <div className={cn("mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border w-fit", sm.bg, sm.color)}>
            <StatusIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">{sm.label}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {sessions.length > 0 ? (
          sessions.map((session, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
              <div className="min-w-0 flex items-center gap-2">
                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", getSessionColor(session.title))} />
                <span className="text-xs font-medium text-slate-700 truncate">{session.title}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">{session.time} · {session.durationMin}m</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 rounded-lg border border-dashed border-slate-200 px-2.5 py-2 bg-slate-50/60">
            {booking.notes ? (booking.notes.length > 72 ? booking.notes.substring(0, 72) + "…" : booking.notes) : "No sessions today"}
          </p>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function AdminPage() {
  const { bookings, updateStatus, updateBooking, assignBooking, addBooking, deleteBooking } = useBookings();
  const { user, userReferralCode } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pipeline");
  const [revPeriod, setRevPeriod] = useState<"3M"|"6M"|"1Y">("6M");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const selectedPatient = selectedPatientId ? (bookings.find(b => b.id === selectedPatientId) ?? null) : null;
  const [codeCopied, setCodeCopied] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [apName, setApName] = useState("");
  const [apEmail, setApEmail] = useState("");
  const [apPhone, setApPhone] = useState("");
  const [apCountry, setApCountry] = useState("");
  const [apProcedure, setApProcedure] = useState("");
  const [apNotes, setApNotes] = useState("");
  const [apSubmitting, setApSubmitting] = useState(false);

  // ── AI Processing ──────────────────────────────────────────────────────────
  const [aiRunning, setAiRunning]         = useState(false);
  const [aiProcStep, setAiProcStep]       = useState(-1);
  const [aiProcComplete, setAiProcComplete] = useState(false);
  const aiTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const AI_FLOW = [
    { title: "Verifying & accepting lead",        subtitle: "Confirming patient identity and assigning to your portfolio.", icon: "usercheck"  },
    { title: "Reviewing profile & documents",     subtitle: "Validating uploaded files and checking completeness.",        icon: "filecheck"  },
    { title: "Sending request to clinic",         subtitle: "Sending patient summary and documents for clinical review — awaiting approval and final cost.", icon: "message" },
  ];

  // Demo clinic account is Leadermed (h1) — the only hospital with a live clinic login right now.
  const AI_TARGET_HOSPITAL_ID = "h1";

  function aiSVG(key: string, size = 20) {
    const s = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;
    const paths: Record<string, string> = {
      usercheck:  `<svg ${s}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
      filecheck:  `<svg ${s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>`,
      message:    `<svg ${s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8"/><path d="M8 14h5"/></svg>`,
      hospital:   `<svg ${s}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`,
      plane:      `<svg ${s}><path d="M21 16v-2l-8-5V4.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z"/></svg>`,
      send:       `<svg ${s}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
      checkdbl:   `<svg ${s}><path d="M7 12l3 3 7-7"/><path d="M3 12l3 3 2-2"/></svg>`,
      check:      `<svg ${s}><path d="M5 13l4 4L19 7"/></svg>`,
    };
    return paths[key] ?? paths.check;
  }

  const runAIProcessing = () => {
    const target = [...myBookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .find(b => b.status === "Lead - Step 1: Awaiting Email Verification");
    if (!target) { toast.error("No new leads in Step 1 to process."); return; }

    aiTimers.current.forEach(clearTimeout);
    aiTimers.current = [];
    setAiRunning(true);
    setAiProcStep(-1);
    setAiProcComplete(false);

    const STEP_MS = 1800;
    const id = target.id;
    const targetHospital = hospitals.find((h) => h.id === AI_TARGET_HOSPITAL_ID);
    const targetProcedure = procedures.find((p) => p.id === target.procedureId);

    // Pick the best-matching doctor on staff and the first slot they actually have
    // open — prefer one inside the patient's requested window, else their next
    // free slot at all. This is a suggestion: the clinic reviews/changes it.
    const hospitalDoctors = mockDoctors.filter((d) => d.hospitalId === AI_TARGET_HOSPITAL_ID);
    const bestDoctor = targetProcedure ? pickBestDoctor(hospitalDoctors, targetProcedure.category) : hospitalDoctors[0];
    let suggestedSlot: { date: string; time: string } | null = null;
    if (bestDoctor) {
      const busySlots = getDoctorBusySlots(bestDoctor.id, bookings);
      suggestedSlot =
        (target.preferredDateStart && target.preferredDateEnd
          ? findFirstFreeSlotInRange(busySlots, target.preferredDateStart, target.preferredDateEnd)
          : null) ?? findNextFreeSlot(busySlots, new Date());
    }

    const steps: Array<() => void> = [
      () => { setAiProcStep(0); if (user) assignBooking(id, user.id);
              aiTimers.current.push(setTimeout(() => toast.success(`Lead accepted — ${target.patientName} assigned to you ✓`), 900)); },
      () => { setAiProcStep(1); updateStatus(id, "Lead - Step 2: Profile Completed");
              aiTimers.current.push(setTimeout(() => toast.success("Profile complete — all documents verified ✓"), 900)); },
      () => {
        setAiProcStep(2);
        const proposedSession: BookingSession | undefined =
          suggestedSlot && bestDoctor
            ? {
                date: suggestedSlot.date,
                time: suggestedSlot.time,
                durationMin: 60,
                title: consultationSessionTitle(bestDoctor.name),
                doctorId: bestDoctor.id,
                hospitalId: AI_TARGET_HOSPITAL_ID,
                location: targetHospital?.address,
              }
            : undefined;
        updateBooking(id, {
          status: "Awaiting Hospital Response",
          hospitalId: AI_TARGET_HOSPITAL_ID,
          doctorId: bestDoctor?.id,
          hospitalResponse: suggestedSlot
            ? {
                status: "proposed",
                confirmedDate: suggestedSlot.date,
                confirmedTime: suggestedSlot.time,
                message: `AI suggested ${bestDoctor?.name} — ${format(new Date(suggestedSlot.date), "MMM d")} at ${suggestedSlot.time}.`,
              }
            : undefined,
          sessions: proposedSession
            ? [...(target.sessions ?? []).filter((s) => !isConsultationSession(s.title)), proposedSession]
            : target.sessions,
        });
        const slotText = suggestedSlot
          ? ` ${bestDoctor?.name} suggested for ${format(new Date(suggestedSlot.date), "MMM d")} at ${suggestedSlot.time}.`
          : "";
        aiTimers.current.push(setTimeout(() => toast(`📋 Sent to ${targetHospital?.name ?? "the clinic"} —${slotText} Awaiting clinical approval. Final cost will be confirmed once the clinic reviews the case.`), 900));
      },
    ];

    steps.forEach((fn, idx) => {
      aiTimers.current.push(setTimeout(fn, idx * STEP_MS));
    });

    aiTimers.current.push(setTimeout(() => {
      setAiProcComplete(true);
      aiTimers.current.push(setTimeout(() => {
        setAiRunning(false);
        setAiProcStep(-1);
        setAiProcComplete(false);
      }, 2400));
    }, steps.length * STEP_MS));
  };

  const handleAddPatient = () => {
    if (!apName || !apEmail || !apPhone || !apProcedure) return;
    setApSubmitting(true);
    const newBooking: BookingRequest = {
      id: `booking-${Date.now()}`,
      patientName: apName,
      patientEmail: apEmail,
      patientPhone: apPhone,
      country: apCountry || "—",
      countryFlag: "",
      procedureId: apProcedure,
      status: "Lead - Step 1: Awaiting Email Verification",
      preferredDateStart: "",
      preferredDateEnd: "",
      uploadedFiles: [],
      notes: apNotes,
      createdAt: new Date().toISOString(),
      assignedPartnerId: user?.id,
    };
    addBooking(newBooking);
    setApName(""); setApEmail(""); setApPhone(""); setApCountry(""); setApProcedure(""); setApNotes("");
    setApSubmitting(false);
    setShowAddPatient(false);
  };

  const handleCopyCode = () => {
    if (!userReferralCode) return;
    navigator.clipboard.writeText(userReferralCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  // Bookings visible to this partner: assigned to me OR unassigned
  const myBookings = useMemo(() => {
    return bookings.filter(
      (b) => !b.assignedPartnerId || b.assignedPartnerId === user?.id
    );
  }, [bookings, user?.id]);

  const handleStatusChange = (id: string, status: BookingStatus) => {
    updateStatus(id, status);
  };

  const dateStr = format(currentDate, "yyyy-MM-dd");
  const periodToMonths: Record<"3M" | "6M" | "1Y", number> = { "3M": 3, "6M": 6, "1Y": 12 };

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return myBookings;
    return myBookings.filter((b) => {
      const proc = procedures.find((p) => p.id === b.procedureId);
      return (
        b.patientName.toLowerCase().includes(q) ||
        b.country.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q) ||
        b.notes.toLowerCase().includes(q) ||
        (proc?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [bookings, searchQuery]);

  /* patients visible for this date (have sessions or fall in date range) */
  const patientsForDate = useMemo(() => {
    return filteredBookings
      .filter((b) => {
        const hasSessions = (b.sessions || []).some((s) => s.date === dateStr);
        const inRange = b.preferredDateStart <= dateStr && b.preferredDateEnd >= dateStr;
        return hasSessions || inRange;
      });
  }, [dateStr, filteredBookings]);

  /* aggregate stats */
  const stats = useMemo(() => {
    const active = filteredBookings.filter((b) => !["Completed", "Rejected"].includes(b.status)).length;
    const confirmed = filteredBookings.filter((b) => CONFIRMED_STATUSES.has(b.status)).length;
    const pending = Math.max(0, active - confirmed);
    const revenue = filteredBookings
      .filter((b) => !["Rejected", "Draft"].includes(b.status))
      .reduce((sum, b) => sum + getBookingRevenue(b), 0);
    const clinicPayable = Math.round(revenue * 0.7);
    return { total: active, confirmed, pending, revenue, clinicPayable };
  }, [filteredBookings]);

  const overviewRevenueData = useMemo(() => {
    const monthCount = periodToMonths[revPeriod];
    const now = new Date();
    const buckets = Array.from({ length: monthCount }, (_, idx) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - idx), 1);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      return { key, name: format(monthDate, "MMM"), clinic: 0, ops: 0, net: 0 };
    });
    const bucketMap = new Map(buckets.map((b) => [b.key, b]));

    filteredBookings.forEach((booking) => {
      if (["Rejected", "Draft"].includes(booking.status)) return;
      const createdAt = new Date(booking.createdAt);
      if (Number.isNaN(createdAt.getTime())) return;
      const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
      const bucket = bucketMap.get(key);
      if (!bucket) return;

      const gross = getBookingRevenue(booking);
      const clinic = Math.round(gross * 0.7);
      const ops = Math.round(gross * 0.1);
      const net = gross - clinic - ops;
      bucket.clinic += clinic;
      bucket.ops += ops;
      bucket.net += net;
    });

    return buckets.map(({ name, clinic, ops, net }) => ({ name, clinic, ops, net }));
  }, [filteredBookings, revPeriod]);

  const actionItems = useMemo(() => {
    return filteredBookings
      .filter((b) =>
        b.status.startsWith("Lead") ||
        b.status.includes("Awaiting") ||
        b.status.includes("More Information") ||
        b.status === "Under Review" ||
        b.status === "Submitted"
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map((b) => {
        const title = getStatus(b.status).label;
        const desc = b.notes?.trim() || `Status: ${b.status}`;
        const priority = /missing|urgent|awaiting|more info/i.test(`${desc} ${b.status}`) ? "high" : "medium";
        const createdAt = new Date(b.createdAt);
        const time = Number.isNaN(createdAt.getTime()) ? "recently" : format(createdAt, "MMM d");
        return { title, desc, patient: b.patientName, time, priority };
      });
  }, [filteredBookings]);

  return (
    <div className="bg-[#f5f7fa] h-full min-h-0 overflow-hidden flex flex-col">
      {/* ── Top Navigation / Header ── */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 h-16 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-6">
          <div className="hidden md:flex ml-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
              <TabsList className="bg-slate-100/50">
                <TabsTrigger value="overview" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Overview
                </TabsTrigger>
                <TabsTrigger value="pipeline" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Columns className="h-3.5 w-3.5 mr-1.5" /> Pipeline
                </TabsTrigger>
                <TabsTrigger value="schedule" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5" /> Schedule
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 lg:w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 rounded-full h-9 text-sm focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-auto min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full min-h-0 flex flex-col">
          <div className="md:hidden px-4 pt-4 pb-2 shrink-0">
            <TabsList className="grid grid-cols-3 w-full bg-slate-100/80 h-10">
              <TabsTrigger value="overview" className="text-[11px] font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Overview
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="text-[11px] font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Columns className="h-3.5 w-3.5 mr-1" /> Pipeline
              </TabsTrigger>
              <TabsTrigger value="schedule" className="text-[11px] font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <CalendarIcon className="h-3.5 w-3.5 mr-1" /> Schedule
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* TAB: PIPELINE */}
          <TabsContent value="pipeline" className="mt-0 h-full data-[state=active]:flex flex-col p-4 md:p-6 overflow-hidden">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-800">Lead Pipeline</h2>
                  {userReferralCode && (
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm"
                      title="Copy your referral code"
                    >
                      <span className="text-xs text-slate-500 font-medium">Your Code:</span>
                      <span className="font-mono font-bold text-primary tracking-wide">{userReferralCode}</span>
                      {codeCopied
                        ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                        : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex-1 sm:flex-none gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                    onClick={runAIProcessing}
                    disabled={aiRunning}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiRunning ? "Processing…" : "AI Process Lead"}
                  </Button>
                  <Button size="sm" className="h-8 flex-1 sm:flex-none" onClick={() => setShowAddPatient(true)}>
                    <UserPlus className="h-4 w-4 mr-1.5" /> Add Patient Manually
                  </Button>
                </div>
             </div>

             {/* ── AI Processing inline strip ── */}
             {aiRunning && (
               <div className="ai-animate-fade-scale mb-4 shrink-0" style={{
                 background: "#fff", border: "1px solid #e5e7eb",
                 borderRadius: 18, overflow: "hidden",
                 boxShadow: "0 4px 20px rgba(15,23,42,0.07)",
               }}>
                 {/* top progress bar */}
                 <div style={{ height: 4, background: "#f1f5f9" }}>
                   <div style={{
                     height: "100%",
                     width: aiProcComplete ? "100%" : aiProcStep >= 0 ? `${Math.round(((aiProcStep + 0.5) / AI_FLOW.length) * 100)}%` : "3%",
                     background: aiProcComplete ? "#10b981" : "linear-gradient(90deg,#6366f1,#3b82f6)",
                     transition: "width 0.6s ease, background 0.4s ease",
                     borderRadius: "0 4px 4px 0",
                   }} />
                 </div>

                 <div style={{ padding: "14px 20px" }}>
                   {/* header row */}
                   <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                     <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                       {aiProcComplete
                         ? <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}
                             dangerouslySetInnerHTML={{ __html: aiSVG("checkdbl", 14) }} />
                         : <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                             <div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid #cbd5e1", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite" }} />
                           </div>
                       }
                       <div>
                         <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                           {aiProcComplete ? "AI Processing Complete" : "AI Lead Processing"}
                         </span>
                         {!aiProcComplete && aiProcStep >= 0 && (
                           <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>— {AI_FLOW[aiProcStep].title}</span>
                         )}
                       </div>
                     </div>
                     <span style={{
                       fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                       background: aiProcComplete ? "#ecfdf5" : "#f1f5f9",
                       color: aiProcComplete ? "#047857" : "#64748b",
                       border: `1px solid ${aiProcComplete ? "#bbf7d0" : "#e5e7eb"}`,
                     }}>
                       {aiProcComplete ? "All done ✓" : `Step ${Math.max(aiProcStep + 1, 1)} of ${AI_FLOW.length}`}
                     </span>
                   </div>

                   {/* horizontal steps */}
                   <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
                     {AI_FLOW.map((wf, idx) => {
                       const done   = aiProcComplete || idx < aiProcStep;
                       const active = !aiProcComplete && idx === aiProcStep;
                       const isLast = idx === AI_FLOW.length - 1;
                       return (
                         <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                           {/* connector line left */}
                           {idx > 0 && (
                             <div style={{
                               position: "absolute", left: 0, top: 17, width: "50%", height: 2,
                               background: done || active ? (aiProcComplete ? "#10b981" : "#6366f1") : "#e5e7eb",
                               transition: "background 0.4s ease",
                               zIndex: 0,
                             }} />
                           )}
                           {/* connector line right */}
                           {!isLast && (
                             <div style={{
                               position: "absolute", right: 0, top: 17, width: "50%", height: 2,
                               background: done ? (aiProcComplete ? "#10b981" : "#6366f1") : "#e5e7eb",
                               transition: "background 0.4s ease",
                               zIndex: 0,
                             }} />
                           )}

                           {/* icon circle */}
                           <div className={active ? "ai-animate-breathe" : ""} style={{
                             position: "relative", zIndex: 1,
                             width: 36, height: 36, borderRadius: "50%",
                             border: `2px solid ${done ? (aiProcComplete ? "#10b981" : "#6366f1") : active ? "#6366f1" : "#e5e7eb"}`,
                             background: done ? (aiProcComplete ? "#ecfdf5" : "#eef2ff") : active ? "#fff" : "#f8fafc",
                             display: "flex", alignItems: "center", justifyContent: "center",
                             color: done ? (aiProcComplete ? "#059669" : "#6366f1") : active ? "#6366f1" : "#cbd5e1",
                             boxShadow: active ? "0 0 0 4px rgba(99,102,241,0.12)" : "none",
                             transition: "all 0.3s ease",
                           }}
                             dangerouslySetInnerHTML={{ __html: aiSVG(done ? "check" : wf.icon, 15) }}
                           />

                           {/* label */}
                           <div style={{ marginTop: 8, textAlign: "center", padding: "0 4px" }}>
                             <p style={{
                               margin: 0, fontSize: 10.5, fontWeight: active ? 700 : done ? 600 : 500, lineHeight: 1.3,
                               color: done ? (aiProcComplete ? "#059669" : "#6366f1") : active ? "#0f172a" : "#94a3b8",
                               transition: "color 0.3s",
                             }}>
                               {wf.title.split(" ").slice(0, 3).join(" ")}
                             </p>
                             {active && (
                               <span style={{ display: "inline-flex", gap: 2, marginTop: 3 }}>
                                 <span className="ai-dot" style={{ width: 3, height: 3, borderRadius: 999, background: "#6366f1", display: "block" }} />
                                 <span className="ai-dot" style={{ width: 3, height: 3, borderRadius: 999, background: "#6366f1", display: "block" }} />
                                 <span className="ai-dot" style={{ width: 3, height: 3, borderRadius: 999, background: "#6366f1", display: "block" }} />
                               </span>
                             )}
                             {done && <p style={{ margin: "2px 0 0", fontSize: 9.5, color: aiProcComplete ? "#10b981" : "#818cf8", fontWeight: 600 }}>Done</p>}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               </div>
             )}

             <div className="flex-1 overflow-hidden">
                <KanbanBoard
                  bookings={myBookings.filter(b => !searchQuery || b.patientName.toLowerCase().includes(searchQuery.toLowerCase()))}
                  onOpenPatient={(b) => setSelectedPatientId(b.id)}
                  onStatusChange={handleStatusChange}
                  onAccept={(id) => user && assignBooking(id, user.id)}
                  onDelete={(id) => { deleteBooking(id); toast.success("Patient record deleted."); }}
                />
             </div>
          </TabsContent>

          {/* TAB: SCHEDULE */}
          <TabsContent value="schedule" className="mt-0 p-4 md:p-6 flex-col data-[state=active]:flex overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3 shrink-0">
               <div>
                  <h2 className="text-lg font-bold text-slate-800">Master Schedule</h2>
                  <p className="text-sm text-slate-500">View and manage daily appointments</p>
               </div>
               
               <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start bg-white rounded-full border border-slate-200 shadow-sm p-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100" onClick={() => setCurrentDate((p) => addDays(p, -1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="h-8 px-4 font-semibold hover:bg-transparent text-sm w-[140px] justify-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                        {format(currentDate, "dd MMM")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <CalendarComponent mode="single" selected={currentDate} onSelect={(d) => d && setCurrentDate(d)} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100" onClick={() => setCurrentDate((p) => addDays(p, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
               </div>
            </div>

            {patientsForDate.length > 0 ? (
              <>
                {/* Mobile schedule list */}
                <div className="md:hidden flex-1 overflow-y-auto space-y-3 pr-1">
                  {patientsForDate.map((booking) => (
                    <MobileScheduleRow key={booking.id} booking={booking} dateStr={dateStr} onOpenPatient={(b) => setSelectedPatientId(b.id)} />
                  ))}
                </div>

                {/* Desktop timeline */}
                <div className="hidden md:flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex-col min-h-[500px]">
                  <div className="flex border-b border-slate-200 bg-slate-50/80 sticky top-0 z-30 shrink-0">
                    <div className="w-[260px] shrink-0 border-r border-slate-200 p-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patient / Status</span>
                    </div>
                    <div className="flex-1 grid min-w-[840px] overflow-hidden" style={{ gridTemplateColumns: "repeat(14, 1fr)" }}>
                      {HOURS.slice(0, -1).map((h) => (
                        <div key={h} className="border-r border-slate-100 py-2.5 text-[10px] font-semibold text-slate-400 text-center tracking-wide">
                          {h.toString().padStart(2, "0")}:00
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-y-auto overflow-x-auto flex-1">
                    {patientsForDate.map((booking) => (
                      <TimelineRow key={booking.id} booking={booking} dateStr={dateStr} onOpenPatient={(b) => setSelectedPatientId(b.id)} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex items-center justify-center text-slate-400 flex-col gap-3 min-h-[220px]">
                <CalendarIcon className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">No schedule items for {format(currentDate, "MMMM d")}</p>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Reset to Today</Button>
              </div>
            )}
          </TabsContent>

          {/* TAB: OVERVIEW */}
          <TabsContent value="overview" className="mt-0 data-[state=active]:flex flex-col h-full p-4 md:p-6 gap-4 md:gap-6 bg-slate-50/50 overflow-y-auto md:overflow-hidden">

            {/* Row 1 — Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4 shrink-0">
              <StatCard icon={Users} label="Active Patients" value={stats.total} color="blue" />
              <StatCard icon={CheckCircle2} label="Confirmed" value={stats.confirmed} color="green" sub={`${stats.pending} pending`} />
              <StatCard icon={DollarSign} label="Est. Revenue" value={`$${stats.revenue.toLocaleString()}`} color="violet" />
              <StatCard icon={TrendingUp} label="Clinic Payable" value={`$${stats.clinicPayable.toLocaleString()}`} color="rose" sub="70% share" />
            </div>

            {/* Referral Code card */}
            {userReferralCode && (
              <div className="shrink-0 bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Your Referral Code</p>
                  <p className="text-xl font-mono font-bold text-primary tracking-widest">{userReferralCode}</p>
                  <p className="text-xs text-slate-400 mt-1">Share this code with patients so leads are assigned directly to you</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm transition-all shrink-0 ${codeCopied ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                >
                  {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {codeCopied ? "Copied!" : "Copy Code"}
                </button>
              </div>
            )}

            {/* Row 2 — Chart + Actions (flex-1, fills remaining space) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 md:flex-1 md:min-h-0">

              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 md:p-5 flex flex-col md:min-h-0">
                <div className="flex items-start justify-between mb-4 shrink-0">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base tracking-tight">Revenue Trends</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Estimated earnings and profit over time
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                    {(["3M","6M","1Y"] as const).map((p) => (
                      <button key={p} onClick={() => setRevPeriod(p)}
                        className={cn("px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all", revPeriod === p ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* ── Multi-month: Horizontal Stacked Bar ── */}
                <RevenueChart period={revPeriod} data={overviewRevenueData} />

              </div>

              {/* Action Required */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 md:p-5 flex flex-col md:min-h-0">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 tracking-tight">
                    <AlertCircle className="h-5 w-5 text-orange-500" /> Action Required
                  </h3>
                  <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 font-bold">{actionItems.length}</Badge>
                </div>
                <div className="md:flex-1 overflow-y-auto space-y-2 -mx-2 px-2 max-h-64 md:max-h-none">
                  {actionItems.length > 0 ? (
                    actionItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3 group cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent">
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", item.priority === 'high' ? 'bg-red-500' : 'bg-orange-400')} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-primary transition-colors">{item.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{item.desc}</p>
                          <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{item.patient} · {item.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full min-h-24 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/70">
                      No pending lead actions
                    </div>
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4 text-xs font-semibold h-8 text-slate-600 shrink-0">View All Tasks</Button>
              </div>
            </div>

          </TabsContent>

        </Tabs>
      </div>

      {/* Drawer for Patient Details */}
      <PatientDrawer booking={selectedPatient} onClose={() => setSelectedPatientId(null)} />

      {/* Add Patient Manually Modal */}
      <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Add Patient Manually
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Full Name *</label>
              <Input value={apName} onChange={e => setApName(e.target.value)} placeholder="John Smith" className="rounded-[14px] h-11" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Email *</label>
              <Input type="email" value={apEmail} onChange={e => setApEmail(e.target.value)} placeholder="john@example.com" className="rounded-[14px] h-11" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Phone *</label>
              <Input value={apPhone} onChange={e => setApPhone(e.target.value)} placeholder="+1 555 000 0000" className="rounded-[14px] h-11" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Country</label>
              <Input value={apCountry} onChange={e => setApCountry(e.target.value)} placeholder="e.g. Germany" className="rounded-[14px] h-11" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Procedure *</label>
              <Select value={apProcedure} onValueChange={setApProcedure}>
                <SelectTrigger className="rounded-[14px] h-11"><SelectValue placeholder="Select procedure" /></SelectTrigger>
                <SelectContent>
                  {procedures.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Notes</label>
              <Textarea value={apNotes} onChange={e => setApNotes(e.target.value)} placeholder="Any relevant info about the patient..." rows={3} className="rounded-[14px]" />
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1 rounded-[14px] h-11" onClick={() => setShowAddPatient(false)}>Cancel</Button>
            <Button
              className="flex-1 rounded-[14px] h-11"
              disabled={!apName || !apEmail || !apPhone || !apProcedure || apSubmitting}
              onClick={handleAddPatient}
            >
              {apSubmitting ? "Adding..." : "Add to Pipeline"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

/* ═══════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: 'blue' | 'green' | 'violet' | 'rose';
}) {
  const colorClasses = {
    blue:   { bg: "bg-blue-50", text: "text-blue-600", accent: "bg-blue-500" },
    green:  { bg: "bg-emerald-50", text: "text-emerald-600", accent: "bg-emerald-500" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", accent: "bg-violet-500" },
    rose:   { bg: "bg-rose-50", text: "text-rose-600", accent: "bg-rose-500" },
  };
  const c = colorClasses[color];

  return (
    <div className={cn("bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-200/80 p-2.5 sm:p-3 md:p-4 flex items-center gap-2.5 md:gap-4 hover:shadow-md transition-shadow group min-w-0", c.bg)}>
      <div className={cn("h-8 w-8 sm:h-9 sm:w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105", c.accent)}>
        <Icon className="h-4 w-4 md:h-5 md:w-5" />
      </div>
      <div className="min-w-0">
        <p className={cn("text-[10px] md:text-xs uppercase tracking-wide md:tracking-wider font-bold leading-tight line-clamp-2", c.text)}>{label}</p>
        <p className="text-[1.05rem] sm:text-xl md:text-2xl font-bold text-slate-800 leading-tight mt-0.5 md:mt-1 truncate">{value}</p>
        {sub && <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 md:mt-1 font-medium truncate">{sub}</p>}
      </div>
    </div>
  );
}

const revenueChartColors = {
  clinic: "#f43f5e", // rose-500
  ops:    "#f97316", // orange-500
  net:    "#22c55e"  // green-500
};

const RevenueChart = ({
  period,
  data,
}: {
  period: "3M" | "6M" | "1Y";
  data: Array<{ name: string; clinic: number; ops: number; net: number }>;
}) => {
  const total = data.reduce((s, d) => s + d.clinic + d.ops + d.net, 0);
  const totClinic = data.reduce((s, d) => s + d.clinic, 0);
  const totOps    = data.reduce((s, d) => s + d.ops, 0);
  const totNet    = data.reduce((s, d) => s + d.net, 0);
  const isYear = period === '1Y';

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-6">
      <div className="flex-1 min-h-[220px] sm:min-h-[250px] lg:min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }} 
            barCategoryGap={isYear ? '25%' : '35%'}
          >
            <CartesianGrid horizontal={false} strokeDasharray="4 4" stroke="#e2e8f0" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v/1000}k`} />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} width={35} />
            <Tooltip
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{
                borderRadius: '12px',
                borderColor: '#e2e8f0',
                boxShadow: '0 8px 20px rgb(0 0 0 / 0.1)',
                padding: '8px 12px',
                fontSize: 13,
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = { clinic: 'Clinic Payout', ops: 'Operations Cost', net: 'Health Bridge Net Profit' };
                return [`$${value.toLocaleString()}`, labels[name] ?? name];
              }}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: 6, fontSize: 14 }}
              itemStyle={{ paddingTop: 2, paddingBottom: 2 }}
            />
            <Bar dataKey="clinic" name="Clinic Payout" stackId="a" fill={revenueChartColors.clinic} shape={<RoundedBar a={1} />} />
            <Bar dataKey="ops" name="Operations Cost" stackId="a" fill={revenueChartColors.ops} shape={<RoundedBar a={2} />} />
            <Bar dataKey="net" name="Health Bridge Net Profit" stackId="a" fill={revenueChartColors.net} shape={<RoundedBar a={3} />}>
              <LabelList
                dataKey="net"
                position="right"
                formatter={(v: number, i: number) => {
                    if (!data[i]) return null;
                    const totalMonth = data[i].clinic + data[i].ops + data[i].net;
                    return `$${(totalMonth/1000).toFixed(isYear ? 1: 0)}k`
                }}
                style={{ fill: '#059669', fontSize: isYear ? 10 : 11, fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary strip */}
      <div className="shrink-0 lg:w-[200px] lg:border-l lg:border-slate-200 lg:pl-5 space-y-3">
        <div className="text-center lg:text-left">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Revenue ({period})</p>
          <p className="text-2xl lg:text-3xl font-bold text-slate-800">${(total/1000).toFixed(0)}k</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 lg:gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Clinic Payout</p>
              <p className="text-base font-bold text-slate-700">${(totClinic/1000).toFixed(1)}k</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Operations</p>
              <p className="text-base font-bold text-slate-700">${(totOps/1000).toFixed(1)}k</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">Net Profit</p>
              <p className="text-base font-bold text-emerald-600">${(totNet/1000).toFixed(1)}k</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const RoundedBar = (props: any) => {
    const { fill, a } = props;
    const x = Number(props.x);
    const y = Number(props.y);
    const width = Number(props.width);
    const height = Number(props.height);

    if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;

    const r = Math.max(0, Math.min(8, height / 2, width / 2));
    const segmentWidth = Math.max(0, width - r);
    const middleHeight = Math.max(0, height - r * 2);

    if (a === 1) { // first
        if (segmentWidth === 0 || r === 0) return <rect x={x} y={y} width={width} height={height} fill={fill} />;
        return <path d={`M${x + r},${y} h${segmentWidth} v${height} h-${segmentWidth} a${r},${r},0,0,1,-${r},-${r} v-${middleHeight} a${r},${r},0,0,1,${r},-${r} z`} fill={fill} />;
    }
    if (a === 3) { // last
        if (segmentWidth === 0 || r === 0) return <rect x={x} y={y} width={width} height={height} fill={fill} />;
        return <path d={`M${x},${y} h${segmentWidth} a${r},${r},0,0,1,${r},${r} v${middleHeight} a${r},${r},0,0,1,-${r},${r} h-${segmentWidth} z`} fill={fill} />;
    }
    return <rect x={x} y={y} width={width} height={height} fill={fill} />;
};


/* ═══════════════════════════════════════════
   HOURS CONSTANT
   ═══════════════════════════════════════════ */
const HOURS = Array.from({ length: 15 }, (_, i) => i + 9);

/* ═══════════════════════════════════════════
   TIMELINE ROW
   ═══════════════════════════════════════════ */
function TimelineRow({ booking, dateStr, onOpenPatient }: { booking: BookingRequest; dateStr: string, onOpenPatient: (b: BookingRequest) => void }) {
  const sessions = (booking.sessions || []).filter((s) => s.date === dateStr);
  const proc = procedures.find((p) => p.id === booking.procedureId);
  const sm = getStatus(booking.status);
  const StatusIcon = sm.icon;

  return (
    <div className="flex group min-h-[88px] border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      {/* ── Patient sidebar ── */}
      <div 
        className="w-[260px] shrink-0 border-r border-slate-100 p-3 flex flex-col justify-center gap-1.5 sticky left-0 bg-white group-hover:bg-slate-50/60 transition-colors z-20 cursor-pointer"
        onClick={() => onOpenPatient(booking)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
            {booking.patientName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate leading-tight group-hover:text-primary transition-colors">{booking.patientName}</p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
              <span>{booking.countryFlag}</span>
              <span className="truncate">{proc?.name || "Procedure TBD"}</span>
            </p>
          </div>
        </div>
        <div className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border w-fit max-w-[220px] ml-[44px]", sm.bg, sm.color)}>
          <StatusIcon className="h-3 w-3 shrink-0" />
          <span className="truncate">{sm.label}</span>
        </div>
      </div>

      {/* ── Timeline area ── */}
      <div className="flex-1 relative min-w-[840px]">
        {/* grid lines */}
        <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: "repeat(14, 1fr)" }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="border-r border-slate-100 h-full" />
          ))}
        </div>
        {/* session blocks */}
        <div className="absolute inset-0 top-3 bottom-3 px-0.5">
          {sessions.map((session, idx) => (
            <SessionBlock key={idx} session={session} onClick={() => onOpenPatient(booking)} />
          ))}
          {/* no sessions indicator */}
          {sessions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={cn("text-xs font-semibold px-3 py-1 rounded-full border shadow-sm bg-white", sm.color, "border-slate-200")}>
                {booking.notes ? (booking.notes.length > 50 ? booking.notes.substring(0, 50) + "…" : booking.notes) : "No sessions today"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SESSION BLOCK
   ═══════════════════════════════════════════ */
function SessionBlock({ session, onClick }: { session: BookingSession, onClick: () => void }) {
  const [h, m] = session.time.split(":").map(Number);
  const startMins = (h - 9) * 60 + (m || 0);
  const totalMins = 14 * 60;
  let left = (startMins / totalMins) * 100;
  let width = (session.durationMin / totalMins) * 100;
  if (left < 0) { width += left; left = 0; }
  if (left + width > 100) width = 100 - left;

  const colorClass = getSessionColor(session.title);

  const endTime = (() => {
    const totalMin = h * 60 + m + session.durationMin;
    return `${Math.floor(totalMin / 60).toString().padStart(2, "0")}:${(totalMin % 60).toString().padStart(2, "0")}`;
  })();

  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute top-0 bottom-0 rounded-md shadow-sm cursor-pointer border border-white/20 group",
        "hover:brightness-110 hover:shadow-md hover:z-50 transition-all z-10",
        colorClass,
      )}
      style={{ left: `${Math.max(0, left)}%`, width: `${Math.max(2, width)}%` }}
    >
      {/* ── Inner visible block (hides overflow) ── */}
      <div className="h-full w-full overflow-hidden flex flex-col justify-center px-2 py-1 relative">
        <p className="font-bold text-[10px] xl:text-[11px] truncate drop-shadow-sm text-white">{session.title}</p>
        {session.durationMin >= 45 && (
           <p className="text-[9px] font-medium text-white/90 truncate flex items-center gap-1 mt-0.5">
             <Clock className="h-2.5 w-2.5" /> {session.time} – {endTime}
           </p>
        )}
      </div>

      {/* ── Hover expandable popout (always fully visible on hover) ── */}
      <div className={cn(
        "absolute -inset-1 px-3 py-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-lg flex flex-col justify-center z-50",
        colorClass
      )}
      style={{ minWidth: 'max-content' }}
      >
        <p className="font-bold text-xs text-white truncate drop-shadow-sm">{session.title}</p>
        <p className="text-[10px] font-medium text-white/95 mt-0.5 mb-1 flex items-center gap-1">
          <Clock className="h-3 w-3" /> {session.time} – {endTime} ({session.durationMin}m)
        </p>
        <div className="flex -space-x-1 mt-auto">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold text-white border border-white/30 backdrop-blur-sm">A</div>
        </div>
      </div>
    </div>
  );
}
