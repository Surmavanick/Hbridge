import { useEffect, useMemo, useRef, useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import type { BookingRequest, BookingSession } from "@/data/mockData";
import { procedures, hospitals, mockDoctors } from "@/data/mockData";
import { useBookings } from "@/store/bookingStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mail, Phone, MapPin, CalendarDays, Banknote, StickyNote,
  AlertTriangle, CheckCircle2, XCircle, HelpCircle, Video, Copy, Stethoscope,
  CalendarClock, FileText, Loader2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import emailjs from "@emailjs/browser";
import { EMAILJS_CONFIG, isEmailJSConfigured } from "@/lib/emailjs";
import { cn } from "@/lib/utils";
import {
  CONSULTATION_SLOTS, getDoctorBusySlots, getFreeTimesForDate,
  hasFreeSlotInRange, findNextFreeSlot, whoIsBusy, sortDoctorsBySpecialtyMatch,
} from "@/lib/doctorAvailability";
import { createConsultationRoomUrl, isRealConsultationRoom } from "@/lib/videoCall";

interface ClinicPatientDrawerProps {
  booking: BookingRequest | null;
  onClose: () => void;
}

export function ClinicPatientDrawer({ booking, onClose }: ClinicPatientDrawerProps) {
  const { bookings, updateBooking } = useBookings();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [moreInfoMessage, setMoreInfoMessage] = useState("");
  const declineFormRef = useRef<HTMLDivElement>(null);
  const moreInfoFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showDecline) declineFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [showDecline]);
  useEffect(() => {
    if (showMoreInfo) moreInfoFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [showMoreInfo]);

  // AI pre-fills a suggested doctor + slot (hospitalResponse.status === "proposed")
  // when it hands a lead to the clinic — load it in as the starting point here,
  // the clinic can review and change anything before confirming.
  useEffect(() => {
    if (
      booking &&
      !booking.consultationLink &&
      booking.hospitalResponse?.status === "proposed" &&
      booking.hospitalResponse.confirmedDate &&
      booking.hospitalResponse.confirmedTime
    ) {
      setSelectedDate(booking.hospitalResponse.confirmedDate);
      setSelectedTime(booking.hospitalResponse.confirmedTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id]);

  const procedure = booking ? procedures.find((p) => p.id === booking.procedureId) : undefined;
  const hospital = booking ? hospitals.find((h) => h.id === booking.hospitalId) : undefined;

  const clinicDoctors = useMemo(() => {
    if (!booking) return [];
    const list = mockDoctors.filter((d) => d.hospitalId === booking.hospitalId);
    if (!procedure) return list;
    return sortDoctorsBySpecialtyMatch(list, procedure.category);
  }, [booking, procedure]);

  const doctorId = selectedDoctorId || booking?.doctorId || clinicDoctors[0]?.id || "";
  const doctor = mockDoctors.find((d) => d.id === doctorId);

  const busySlots = useMemo(
    () => (doctorId ? getDoctorBusySlots(doctorId, bookings, booking?.id) : []),
    [doctorId, bookings, booking?.id]
  );

  const today = startOfDay(new Date());
  const dateOptions = useMemo(
    () => Array.from({ length: 10 }, (_, i) => {
      const d = addDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      return {
        value: dateStr,
        label: format(d, "EEE, MMM d"),
        freeCount: getFreeTimesForDate(busySlots, dateStr).length,
      };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busySlots]
  );

  const activeDate = selectedDate || dateOptions.find((d) => d.freeCount > 0)?.value || dateOptions[0]?.value || "";
  const freeTimesToday = getFreeTimesForDate(busySlots, activeDate);

  if (!booking) return null;

  const matchesPreferredWindow = booking.preferredDateStart && booking.preferredDateEnd
    ? hasFreeSlotInRange(busySlots, booking.preferredDateStart, booking.preferredDateEnd)
    : true;
  const nextFree = !matchesPreferredWindow
    ? findNextFreeSlot(busySlots, new Date(booking.preferredDateStart || today))
    : null;

  const alreadyScheduled = !!booking.consultationLink;

  function resetForms() {
    setShowDecline(false);
    setDeclineReason("");
    setShowMoreInfo(false);
    setMoreInfoMessage("");
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedTime("");
  }

  function handleClose() {
    resetForms();
    onClose();
  }

  async function handleConfirmSchedule() {
    if (!doctor || !activeDate || !selectedTime) {
      toast.error("Pick a doctor, date, and time first.");
      return;
    }
    const scheduledAt = `${activeDate}T${selectedTime}:00`;

    // Reuse the existing room on reschedule (same link the patient already has);
    // only mint a fresh one the first time, or to replace an old fake mock link.
    setIsScheduling(true);
    let consultationLink: string;
    if (isRealConsultationRoom(booking!.consultationLink)) {
      consultationLink = booking!.consultationLink!;
    } else {
      const created = await createConsultationRoomUrl(booking!.id, booking!.patientName);
      if (!created) {
        setIsScheduling(false);
        toast.error("Could not create the video room — please try again.");
        return;
      }
      consultationLink = created;
    }

    // Master Schedule (partner/admin) reads from `sessions`, not consultationScheduledAt —
    // keep them in sync so a clinic-confirmed consultation actually shows up there.
    const consultationSession: BookingSession = {
      date: activeDate,
      time: selectedTime,
      durationMin: 60,
      title: "Consultation",
      doctorId: doctor.id,
      hospitalId: booking!.hospitalId!,
      location: hospital?.address,
    };
    const otherSessions = (booking!.sessions ?? []).filter((s) => s.title !== "Consultation");

    updateBooking(booking!.id, {
      doctorId: doctor.id,
      consultationLink,
      consultationScheduledAt: scheduledAt,
      status: "Hospital Confirmed",
      hospitalResponse: {
        status: "accepted",
        confirmedDate: activeDate,
        confirmedTime: selectedTime,
        message: alreadyScheduled ? "Rescheduled by clinic." : "Confirmed by clinic.",
      },
      sessions: [...otherSessions, consultationSession],
    });

    const consultationDate = format(new Date(scheduledAt), "EEEE, MMMM d 'at' HH:mm");
    if (isEmailJSConfigured()) {
      try {
        await emailjs.send(
          EMAILJS_CONFIG.serviceId,
          "template_lccj6bs",
          {
            patient_name: booking!.patientName,
            email: booking!.patientEmail,
            procedure_name: procedure?.name ?? booking!.procedureId,
            doctor_name: doctor.name,
            clinic_name: hospital?.name ?? "Our clinic",
            consultation_date: consultationDate,
            consultation_link: consultationLink,
          },
          { publicKey: EMAILJS_CONFIG.publicKey }
        );
        toast.success(alreadyScheduled ? "Rescheduled! Email sent to patient." : "Consultation scheduled! Email sent to patient.");
      } catch {
        toast.success(`${alreadyScheduled ? "Rescheduled" : "Scheduled"}! (Email delivery failed — check EmailJS config.)`);
      }
    } else {
      toast.success(alreadyScheduled ? "Rescheduled — link sent to patient." : "Consultation scheduled! Link sent to patient.");
    }
    setIsScheduling(false);
    resetForms();
  }

  function handleDecline() {
    if (!declineReason.trim()) {
      toast.error("Add a short reason for the patient/partner.");
      return;
    }
    updateBooking(booking!.id, {
      status: "Rejected",
      hospitalResponse: { status: "rejected", message: declineReason.trim() },
    });
    toast.success("Case declined — partner has been notified.");
    resetForms();
    onClose();
  }

  function handleRequestMoreInfo() {
    if (!moreInfoMessage.trim()) {
      toast.error("Add a note about what's missing.");
      return;
    }
    updateBooking(booking!.id, {
      status: "More Information Required",
      hospitalResponse: { status: "more_info", message: moreInfoMessage.trim() },
    });
    toast.success("Request sent — awaiting updated info.");
    resetForms();
    onClose();
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link).then(() => toast.success("Link copied to clipboard."));
  }

  return (
    <Sheet open={!!booking} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 flex flex-col h-full bg-[#f8fafc]">
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-slate-200 shrink-0">
          <SheetHeader className="flex flex-row items-center justify-between space-y-0 text-left">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl shrink-0">
                {booking.patientName.charAt(0)}
              </div>
              <div>
                <SheetTitle className="text-xl font-bold text-slate-800 leading-tight">{booking.patientName}</SheetTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-slate-500 font-medium flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {booking.countryFlag} {booking.country || "—"}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-400">Submitted {format(new Date(booking.createdAt), "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>
            <Badge className="bg-slate-100 text-slate-700 font-semibold px-3 py-1 text-xs border border-slate-200 shrink-0">
              {booking.status}
            </Badge>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Prior clinic response, if any */}
          {booking.hospitalResponse && (booking.status === "Rejected" || booking.status === "More Information Required") && (
            <div className={cn(
              "rounded-xl border p-4 text-sm flex items-start gap-2.5",
              booking.status === "Rejected" ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-800"
            )}>
              {booking.status === "Rejected" ? <XCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold mb-0.5">{booking.status === "Rejected" ? "You declined this case" : "You requested more information"}</p>
                <p>{booking.hospitalResponse.message}</p>
              </div>
            </div>
          )}

          {/* Contact & Procedure */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Contact</p>
              <a href={`mailto:${booking.patientEmail}`} className="flex items-center gap-2 text-[13px] text-blue-600 hover:underline">
                <Mail className="h-3.5 w-3.5 shrink-0" /> {booking.patientEmail}
              </a>
              {booking.patientPhone && (
                <a href={`tel:${booking.patientPhone}`} className="flex items-center gap-2 text-[13px] text-slate-600 hover:text-slate-900">
                  <Phone className="h-3.5 w-3.5 shrink-0" /> {booking.patientPhone}
                </a>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Procedure</p>
              <p className="flex items-center gap-2 text-[13px] text-slate-700 font-medium">
                <Stethoscope className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {procedure?.name ?? booking.procedureId}
              </p>
              {booking.preferredDateStart && (
                <p className="flex items-center gap-2 text-[13px] text-slate-600">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {format(new Date(booking.preferredDateStart), "MMM d")} – {format(new Date(booking.preferredDateEnd), "MMM d, yyyy")}
                </p>
              )}
              {booking.budget && (
                <p className="flex items-center gap-2 text-[13px] text-slate-600">
                  <Banknote className="h-3.5 w-3.5 shrink-0 text-slate-400" /> Budget: <span className="font-medium text-slate-800">{booking.budget}</span>
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <StickyNote className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[13px] text-slate-700">{booking.notes}</p>
            </div>
          )}

          {/* Documents */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Documents</p>
              <Badge variant="secondary">{booking.uploadedFiles.length}</Badge>
            </div>
            {booking.uploadedFiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {booking.uploadedFiles.map((f, i) => {
                  const mismatch = f.verified === false;
                  return (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 border rounded-lg transition-colors",
                        mismatch ? "border-red-200 bg-red-50 hover:bg-red-100/60" : "border-slate-200 hover:border-primary/30 hover:bg-primary/5"
                      )}
                    >
                      <div className={cn("w-7 h-7 rounded flex items-center justify-center shrink-0", mismatch ? "bg-red-100" : "bg-primary/10")}>
                        {mismatch ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> : <FileText className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-[12.5px] font-medium truncate", mismatch ? "text-red-700" : "text-slate-700")}>{f.type}</p>
                        {mismatch && f.verifyReason
                          ? <p className="text-[10.5px] text-red-500 truncate">⚠ {f.verifyReason}</p>
                          : <p className="text-[10.5px] text-slate-400 truncate">{f.name}</p>}
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-3">No documents uploaded.</p>
            )}
          </div>

          {/* Doctor & Availability */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Doctor &amp; Availability</p>

            {booking.hospitalResponse?.status === "proposed" && !alreadyScheduled && (
              <div className="flex items-start gap-2 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2.5 text-[12.5px] text-violet-700">
                <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>AI pre-selected this doctor and slot based on the request — review and confirm, or change anything below.</span>
              </div>
            )}

            <Select value={doctorId} onValueChange={(v) => { setSelectedDoctorId(v); setSelectedTime(""); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {clinicDoctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name} — {d.specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {doctor && booking.preferredDateStart && (
              matchesPreferredWindow ? (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5 text-[12.5px] text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{doctor.name} has open slots within the patient's requested window ({format(new Date(booking.preferredDateStart), "MMM d")}–{format(new Date(booking.preferredDateEnd), "MMM d")}).</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2.5 text-[12.5px] text-orange-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    {doctor.name} is fully booked during the patient's requested window.
                    {nextFree ? <> Next available: <strong>{format(new Date(nextFree.date), "MMM d")} at {nextFree.time}</strong>.</> : " No open slots found in the next 3 weeks."}
                  </span>
                </div>
              )
            )}

            {/* Date strip */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 block">Date</label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.freeCount === 0}
                    onClick={() => { setSelectedDate(opt.value); setSelectedTime(""); }}
                    className={cn(
                      "px-3 py-2 rounded-xl text-[12.5px] font-medium border transition-all shrink-0 text-center",
                      activeDate === opt.value
                        ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                        : opt.freeCount === 0
                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time grid */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 block">Time</label>
              <div className="flex flex-wrap gap-2">
                {CONSULTATION_SLOTS.map((t) => {
                  const free = freeTimesToday.includes(t);
                  const busyWith = !free ? whoIsBusy(busySlots, activeDate, t) : null;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!free}
                      title={busyWith ? `Busy — ${busyWith}` : undefined}
                      onClick={() => setSelectedTime(t)}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-[13px] font-medium border transition-all",
                        selectedTime === t
                          ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                          : !free
                          ? "bg-slate-50 text-slate-300 border-slate-100 line-through cursor-not-allowed"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {alreadyScheduled && booking.consultationLink && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-blue-900 mb-0.5 flex items-center gap-1.5">
                      <Video className="h-3.5 w-3.5" /> Currently scheduled
                    </p>
                    {booking.consultationScheduledAt && (
                      <p className="text-[12px] text-blue-700">{format(new Date(booking.consultationScheduledAt), "EEEE, MMMM d 'at' HH:mm")}</p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => copyLink(booking.consultationLink!)}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
              </div>
            )}

            <Button className="w-full rounded-xl bg-blue-500 hover:bg-blue-600" onClick={handleConfirmSchedule} disabled={!selectedTime || isScheduling}>
              {isScheduling ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : alreadyScheduled ? (
                <CalendarClock className="h-4 w-4 mr-1.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
              )}
              {isScheduling ? "Creating video room…" : alreadyScheduled ? "Reschedule Consultation" : "Confirm & Schedule"}
            </Button>
          </div>

          {/* Decline / More info */}
          <div className="flex gap-2">
            <Button
              variant={showMoreInfo ? "default" : "outline"}
              className={cn(
                "flex-1 rounded-xl",
                showMoreInfo ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-amber-700 border-amber-200 hover:bg-amber-50"
              )}
              onClick={() => { setShowMoreInfo((v) => !v); setShowDecline(false); }}
            >
              <HelpCircle className="h-4 w-4 mr-1.5" /> Request More Info
            </Button>
            <Button
              variant={showDecline ? "destructive" : "outline"}
              className={cn("flex-1 rounded-xl", !showDecline && "text-red-600 border-red-200 hover:bg-red-50")}
              onClick={() => { setShowDecline((v) => !v); setShowMoreInfo(false); }}
            >
              <XCircle className="h-4 w-4 mr-1.5" /> Decline Case
            </Button>
          </div>

          {showMoreInfo && (
            <div ref={moreInfoFormRef} className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2.5 scroll-mt-4">
              <Textarea
                value={moreInfoMessage}
                onChange={(e) => setMoreInfoMessage(e.target.value)}
                placeholder="What's missing? e.g. Need updated blood test results before we can confirm."
                rows={3}
                className="bg-white"
                autoFocus
              />
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={handleRequestMoreInfo}>Send Request</Button>
            </div>
          )}

          {showDecline && (
            <div ref={declineFormRef} className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2.5 scroll-mt-4">
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for declining — shared with the partner/patient."
                rows={3}
                className="bg-white"
                autoFocus
              />
              <Button size="sm" variant="destructive" onClick={handleDecline}>Confirm Decline</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
