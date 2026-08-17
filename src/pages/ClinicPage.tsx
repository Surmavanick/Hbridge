import { useState } from "react";
import { useBookings } from "@/store/bookingStore";
import { useAuth } from "@/store/authStore";
import { procedures, hospitals } from "@/data/mockData";
import type { BookingRequest } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  CalendarDays, MapPin, Clock, Video, Copy, CheckCircle2,
  Users, Hourglass, Stethoscope, ChevronRight, XCircle, HelpCircle, Building2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ClinicPatientDrawer } from "@/components/clinic/ClinicPatientDrawer";
import { findVisitSession } from "@/lib/doctorAvailability";

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

// ── Patient Card ──────────────────────────────────────────────────────────────

interface PatientCardProps {
  booking: BookingRequest;
  onOpen: () => void;
  onCopyLink: (link: string) => void;
}

function PatientCard({ booking, onOpen, onCopyLink }: PatientCardProps) {
  const procedure = procedures.find((p) => p.id === booking.procedureId);
  const colors = getStatusColors(booking.status);
  const hasConsultation = !!booking.consultationLink;
  const visitSession = findVisitSession(booking.sessions);
  const hasMismatchedDoc = booking.uploadedFiles.some((f) => f.verified === false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="bg-white rounded-[20px] border border-border shadow-sm overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
    >
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg flex-shrink-0 mt-0.5">
            {booking.patientName.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h2 className="text-[16px] font-semibold text-slate-900">{booking.patientName}</h2>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                {booking.status}
              </span>
              {hasMismatchedDoc && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">
                  ⚠ Document issue
                </span>
              )}
            </div>

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

          <ChevronRight className="h-5 w-5 text-slate-300 flex-shrink-0 mt-2" />
        </div>
      </div>

      {/* ── Consultation quick-glance ── */}
      {hasConsultation && booking.consultationLink && (
        <div className="mx-6 mb-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Video className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-blue-900 mb-0.5">Consultation Scheduled</p>
                {booking.consultationScheduledAt && (
                  <p className="text-[12px] text-blue-700 flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(new Date(booking.consultationScheduledAt), "EEEE, MMMM d 'at' HH:mm")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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

      {/* ── Physical visit quick-glance ── */}
      {visitSession && (
        <div className="mx-6 mb-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-indigo-900 mb-0.5">In-Person Visit Scheduled</p>
              <p className="text-[12px] text-indigo-700 flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(new Date(`${visitSession.date}T${visitSession.time}:00`), "EEEE, MMMM d 'at' HH:mm")}
              </p>
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
  const { bookings } = useBookings();
  const [profileTarget, setProfileTarget] = useState<BookingRequest | null>(null);

  const clinicHospitalId = getClinicHospitalId;
  const hospital = hospitals.find((h) => h.id === clinicHospitalId);

  const clinicBookings = bookings.filter((b) => b.hospitalId === clinicHospitalId);

  const pendingCount = clinicBookings.filter((b) => !b.consultationLink && b.status !== "Rejected" && b.status !== "More Information Required").length;
  const confirmedCount = clinicBookings.filter((b) => !!b.consultationLink).length;
  const visitScheduledCount = clinicBookings.filter((b) => !!findVisitSession(b.sessions)).length;
  const needsAttentionCount = clinicBookings.filter((b) => b.status === "More Information Required").length;
  const declinedCount = clinicBookings.filter((b) => b.status === "Rejected").length;

  // Keep the drawer's data fresh as `bookings` updates (e.g. after scheduling).
  const liveProfileTarget = profileTarget ? clinicBookings.find((b) => b.id === profileTarget.id) ?? null : null;

  function copyLink(link: string) {
    navigator.clipboard.writeText(link).then(() => {
      toast.success("Link copied to clipboard.");
    });
  }

  return (
    <div className="min-h-screen bg-slate-50/60">
      <ClinicPatientDrawer booking={liveProfileTarget} onClose={() => setProfileTarget(null)} />

      <div className="container-max section-padding py-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clinic Dashboard</h1>
            {hospital && (
              <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {hospital.name} — {hospital.city}, Georgia
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 flex items-center gap-2">
              <Hourglass className="h-4 w-4 text-orange-500" />
              <span className="text-[13px] font-semibold text-orange-700">{pendingCount} Pending</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-[13px] font-semibold text-green-700">{confirmedCount} Confirmed</span>
            </div>
            {visitScheduledCount > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-500" />
                <span className="text-[13px] font-semibold text-indigo-700">{visitScheduledCount} Visit Scheduled</span>
              </div>
            )}
            {needsAttentionCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-500" />
                <span className="text-[13px] font-semibold text-amber-700">{needsAttentionCount} Awaiting Info</span>
              </div>
            )}
            {declinedCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-[13px] font-semibold text-red-700">{declinedCount} Declined</span>
              </div>
            )}
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
              onOpen={() => setProfileTarget(booking)}
              onCopyLink={copyLink}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
