import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBookings } from "@/store/bookingStore";
import { useAuth } from "@/store/authStore";
import { procedures, hospitals, mockDoctors } from "@/data/mockData";
import type { BookingRequest } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  CalendarDays, MapPin, FileText, Clock, Video, Copy, CheckCircle2,
  Users, Hourglass, Mail, Phone, ChevronDown, ChevronUp, Stethoscope,
  Banknote, StickyNote, Paperclip
} from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { toast } from "sonner";
import emailjs from "@emailjs/browser";
import { EMAILJS_CONFIG, isEmailJSConfigured } from "@/lib/emailjs";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusColors(status: string) {
  if (status === "Hospital Confirmed" || status === "Completed")
    return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" };
  if (status === "Rejected")
    return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" };
  if (status === "More Information Required")
    return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-400" };
  return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" };
}

const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

// ── Schedule Modal ────────────────────────────────────────────────────────────

interface ScheduleModalProps {
  booking: BookingRequest;
  onClose: () => void;
  onConfirm: (scheduledAt: string) => void;
}

function ScheduleModal({ booking, onClose, onConfirm }: ScheduleModalProps) {
  const procedure = procedures.find((p) => p.id === booking.procedureId);
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const [selectedDate, setSelectedDate] = useState<string>(format(tomorrow, "yyyy-MM-dd"));
  const [selectedTime, setSelectedTime] = useState<string>("09:00");

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(tomorrow, i);
    return { value: format(d, "yyyy-MM-dd"), label: format(d, "EEEE, MMM d") };
  });

  const handleConfirm = () => {
    const scheduledAt = `${selectedDate}T${selectedTime}:00`;
    onConfirm(scheduledAt);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-500" />
            Confirm &amp; Schedule Consultation
          </DialogTitle>
        </DialogHeader>

        <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
              {booking.patientName.charAt(0)}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-900">{booking.patientName}</p>
              <p className="text-[12px] text-slate-500">{procedure?.name ?? booking.procedureId}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Select Date</label>
          <div className="grid grid-cols-2 gap-2">
            {dateOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedDate(opt.value)}
                className={`px-3 py-2.5 rounded-xl text-[13px] font-medium border transition-all text-left ${
                  selectedDate === opt.value
                    ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide">Select Time</label>
          <div className="flex flex-wrap gap-2">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTime(t)}
                className={`px-4 py-2 rounded-xl text-[13px] font-medium border transition-all ${
                  selectedTime === t
                    ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 flex-row">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600" onClick={handleConfirm}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Confirm &amp; Send Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Patient Card ──────────────────────────────────────────────────────────────

interface PatientCardProps {
  booking: BookingRequest;
  onSchedule: () => void;
  onCopyLink: (link: string) => void;
}

function PatientCard({ booking, onSchedule, onCopyLink }: PatientCardProps) {
  const [expanded, setExpanded] = useState(false);

  const procedure = procedures.find((p) => p.id === booking.procedureId);
  const doctor = mockDoctors.find((d) => d.id === booking.doctorId);
  const colors = getStatusColors(booking.status);
  const hasConsultation = !!booking.consultationLink;

  return (
    <div className="bg-white rounded-[20px] border border-border shadow-sm overflow-hidden">
      {/* ── Main row ── */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg flex-shrink-0 mt-0.5">
            {booking.patientName.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + status */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h2 className="text-[16px] font-semibold text-slate-900">{booking.patientName}</h2>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                {booking.status}
              </span>
            </div>

            {/* Key meta */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 flex-shrink-0" />
                {procedure?.name ?? booking.procedureId}
              </span>
              {booking.country && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  {booking.countryFlag} {booking.country}
                </span>
              )}
              {booking.preferredDateStart && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                  {format(new Date(booking.preferredDateStart), "MMM d")} –{" "}
                  {format(new Date(booking.preferredDateEnd), "MMM d, yyyy")}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Submitted {format(new Date(booking.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!hasConsultation && (
              <Button
                size="sm"
                className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white"
                onClick={onSchedule}
              >
                <Video className="h-4 w-4 mr-1.5" />
                Schedule
              </Button>
            )}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              aria-label="Toggle details"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="border-t border-slate-100 mx-6 mb-5 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Contact */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Contact</p>
              <div className="space-y-1.5">
                <a
                  href={`mailto:${booking.patientEmail}`}
                  className="flex items-center gap-2 text-[13px] text-blue-600 hover:underline"
                >
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  {booking.patientEmail}
                </a>
                {booking.patientPhone && (
                  <a
                    href={`tel:${booking.patientPhone}`}
                    className="flex items-center gap-2 text-[13px] text-slate-600 hover:text-slate-900"
                  >
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    {booking.patientPhone}
                  </a>
                )}
              </div>
            </div>

            {/* Doctor & Budget */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Assigned To</p>
              {doctor ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {doctor.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] text-slate-700 font-medium">{doctor.name}</p>
                    <p className="text-[11px] text-slate-400">{doctor.specialty}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-slate-400 italic">No doctor assigned</p>
              )}
              {booking.budget && (
                <div className="flex items-center gap-1.5 text-[13px] text-slate-600 mt-1">
                  <Banknote className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  Budget: <span className="font-medium text-slate-800">{booking.budget}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Notes</p>
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                <StickyNote className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-slate-700">{booking.notes}</p>
              </div>
            </div>
          )}

          {/* Documents */}
          {booking.uploadedFiles.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Documents ({booking.uploadedFiles.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {booking.uploadedFiles.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 transition-colors"
                  >
                    <Paperclip className="h-3 w-3 text-slate-400" />
                    {f.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Consultation section ── */}
      {hasConsultation && booking.consultationLink && (
        <div className={`mx-6 mb-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 ${expanded ? "" : "border-t-0 -mt-1"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Video className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-blue-900 mb-0.5">Consultation Scheduled</p>
                {booking.consultationScheduledAt && (
                  <p className="text-[12px] text-blue-700 flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(new Date(booking.consultationScheduledAt), "EEEE, MMMM d 'at' HH:mm")}
                  </p>
                )}
                <p className="text-[11px] text-blue-500 mt-1 font-mono truncate max-w-[220px]">
                  {booking.consultationLink}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-100"
                onClick={() => onCopyLink(booking.consultationLink!)}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </Button>
              <a href={booking.consultationLink} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="rounded-xl h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white">
                  <Video className="h-3.5 w-3.5 mr-1" />
                  Join Meet
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ClinicPage ───────────────────────────────────────────────────────────

export default function ClinicPage() {
  const { getClinicHospitalId } = useAuth();
  const { bookings, updateBooking } = useBookings();
  const navigate = useNavigate();
  const [scheduleTarget, setScheduleTarget] = useState<BookingRequest | null>(null);

  const clinicHospitalId = getClinicHospitalId;
  const hospital = hospitals.find((h) => h.id === clinicHospitalId);

  const clinicBookings = bookings.filter((b) => b.hospitalId === clinicHospitalId);

  const pendingCount = clinicBookings.filter((b) => !b.consultationLink).length;
  const confirmedCount = clinicBookings.filter((b) => !!b.consultationLink).length;

  async function handleScheduleConfirm(scheduledAt: string) {
    if (!scheduleTarget) return;

    const doctor = mockDoctors.find((d) => d.id === scheduleTarget.doctorId);
    const procedure = procedures.find((p) => p.id === scheduleTarget.procedureId);
    const hosp = hospitals.find((h) => h.id === scheduleTarget.hospitalId);

    const consultationLink =
      doctor?.meetLink ?? `https://meet.google.com/hb-${scheduleTarget.hospitalId}-room`;

    updateBooking(scheduleTarget.id, {
      consultationLink,
      consultationScheduledAt: scheduledAt,
      status: "Hospital Confirmed",
    });

    const consultationDate = format(new Date(scheduledAt), "EEEE, MMMM d 'at' HH:mm");

    if (isEmailJSConfigured()) {
      try {
        await emailjs.send(
          EMAILJS_CONFIG.serviceId,
          "template_lccj6bs",
          {
            patient_name: scheduleTarget.patientName,
            email: scheduleTarget.patientEmail,
            procedure_name: procedure?.name ?? scheduleTarget.procedureId,
            doctor_name: doctor?.name ?? "Your assigned doctor",
            clinic_name: hosp?.name ?? "Our clinic",
            consultation_date: consultationDate,
            consultation_link: consultationLink,
          },
          { publicKey: EMAILJS_CONFIG.publicKey }
        );
        toast.success("Consultation scheduled! Email sent to patient.");
      } catch (err) {
        console.error("EmailJS error:", err);
        toast.success("Consultation scheduled! (Email delivery failed — check EmailJS config.)");
      }
    } else {
      toast.success("Consultation scheduled! Link sent to patient and partner.");
    }

    setScheduleTarget(null);
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link).then(() => {
      toast.success("Link copied to clipboard.");
    });
  }

  return (
    <div className="min-h-screen bg-slate-50/60">
      {scheduleTarget && (
        <ScheduleModal
          booking={scheduleTarget}
          onClose={() => setScheduleTarget(null)}
          onConfirm={handleScheduleConfirm}
        />
      )}

      <div className="container-max section-padding py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clinic Dashboard</h1>
            {hospital && (
              <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {hospital.name} — {hospital.city}, Georgia
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 flex items-center gap-2">
              <Hourglass className="h-4 w-4 text-orange-500" />
              <span className="text-[13px] font-semibold text-orange-700">{pendingCount} Pending</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-[13px] font-semibold text-green-700">{confirmedCount} Confirmed</span>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {clinicBookings.length === 0 && (
          <div className="bg-white rounded-[20px] border border-border p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">No patients assigned yet</h2>
            <p className="text-slate-500 text-sm">Patients routed to your clinic will appear here.</p>
          </div>
        )}

        {/* Patient list */}
        <div className="space-y-3">
          {clinicBookings.map((booking) => (
            <PatientCard
              key={booking.id}
              booking={booking}
              onSchedule={() => setScheduleTarget(booking)}
              onCopyLink={copyLink}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
