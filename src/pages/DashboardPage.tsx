import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/authStore";
import { useBookings } from "@/store/bookingStore";
import { procedures } from "@/data/mockData";
import type { BookingStatus, BookingRequest } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarDays, MapPin, Stethoscope, Clock, CheckCircle2,
  Circle, ChevronRight, FileText, DollarSign, Timer, FileCheck,
  FilePlus, MessageSquare, X, AlertTriangle, Lock, Video, Copy
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";

const STEPS: { label: string; statuses: BookingStatus[] }[] = [
  { label: "Submitted",      statuses: ["Lead - Step 1: Awaiting Email Verification", "Submitted", "Draft"] },
  { label: "Under Review",   statuses: ["Under Review", "Lead - Step 2: Profile Completed", "More Information Required"] },
  { label: "Clinic Matched", statuses: ["Lead - Step 3: Clinic Confirmation", "Sent to Hospital", "Awaiting Hospital Response", "Hospital Confirmed", "Appointment Scheduled"] },
  { label: "Travel Ready",   statuses: ["Lead - Step 4: Travel Booked", "Travel Coordination in Progress"] },
  { label: "Treatment",      statuses: ["Lead - Step 5: Awaiting Arrival", "In Treatment"] },
  { label: "Completed",      statuses: ["Completed"] },
];

function getStepIndex(status: BookingStatus) {
  const idx = STEPS.findIndex((s) => s.statuses.includes(status));
  return idx === -1 ? 0 : idx;
}

function getStatusColor(status: BookingStatus) {
  if (status === "Completed") return { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", border: "border-green-200" };
  if (status === "Rejected")  return { bg: "bg-red-50",   text: "text-red-700",   dot: "bg-red-500",   border: "border-red-200" };
  if (status === "More Information Required") return { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400", border: "border-orange-200" };
  return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-200" };
}

function getStatusLabel(status: BookingStatus): string {
  const map: Partial<Record<BookingStatus, string>> = {
    "Lead - Step 1: Awaiting Email Verification": "Awaiting Review",
    "Lead - Step 2: Profile Completed": "Under Review",
    "Lead - Step 3: Clinic Confirmation": "Clinic Matching",
    "Lead - Step 4: Travel Booked": "Travel Arranged",
    "Lead - Step 5: Awaiting Arrival": "Awaiting Arrival",
    "In Treatment": "In Treatment",
  };
  return map[status] ?? status;
}

// ── Cancel Modal ──────────────────────────────────────────────────────
function CancelModal({
  booking,
  stepIndex,
  onConfirm,
  onClose,
  userPassword,
}: {
  booking: BookingRequest;
  stepIndex: number;
  onConfirm: () => void;
  onClose: () => void;
  userPassword: string;
}) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const hasPenalty = stepIndex >= 1;

  const handleSubmit = () => {
    if (pass !== userPassword) {
      setError("Incorrect password. Please try again.");
      return;
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[420px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasPenalty ? "bg-orange-100" : "bg-red-100"}`}>
              <AlertTriangle className={`h-5 w-5 ${hasPenalty ? "text-orange-500" : "text-red-500"}`} />
            </div>
            <h2 className="text-[17px] font-semibold text-slate-900">Cancel Request</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">

          {/* Penalty warning */}
          {hasPenalty && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-2">
              <p className="text-[13.5px] font-semibold text-orange-800">Cancellation Policy</p>
              <p className="text-[13px] text-orange-700 leading-relaxed">
                Since your request has already been processed beyond the initial stage:
              </p>
              <ul className="text-[13px] text-orange-700 space-y-1 list-disc pl-4">
                <li><strong>20% of the booking amount is non-refundable.</strong></li>
                <li>The remaining balance will be refunded within <strong>30 calendar working days</strong>.</li>
              </ul>
            </div>
          )}

          {!hasPenalty && (
            <p className="text-[14px] text-slate-500">
              Are you sure you want to cancel your <strong className="text-slate-700">
                {procedures.find(p => p.id === booking.procedureId)?.name ?? booking.procedureId}
              </strong> request? This action cannot be undone.
            </p>
          )}

          {/* Password */}
          <div>
            <label className="text-[13px] font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Enter your password to confirm
            </label>
            <Input
              type="password"
              value={pass}
              onChange={(e) => { setPass(e.target.value); setError(""); }}
              placeholder="Your password"
              className={`rounded-[14px] h-11 px-4 text-[14px] bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 ${error ? "border-red-300 bg-red-50" : ""}`}
            />
            {error && <p className="text-[12.5px] text-red-500 mt-1.5 px-1">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Keep Booking</Button>
            <Button
              className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white"
              onClick={handleSubmit}
            >
              Cancel Request
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { bookings, deleteBooking } = useBookings();
  const navigate = useNavigate();
  const [cancelTarget, setCancelTarget] = useState<BookingRequest | null>(null);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  if (!user) return null;

  const myBookings = bookings.filter(
    (b) => b.patientEmail.toLowerCase() === user.email.toLowerCase()
  );

  // Get the stored password for the current user from localStorage
  const storedAccounts = JSON.parse(localStorage.getItem("healthbridge_mock_accounts") ?? "[]");
  const userAccount = storedAccounts.find((a: { email: string; role: string }) =>
    a.email.toLowerCase() === user.email.toLowerCase() && a.role === "user"
  );
  const userPassword: string = userAccount?.password ?? "";

  return (
    <div className="min-h-screen bg-slate-50/60">
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          stepIndex={getStepIndex(cancelTarget.status)}
          userPassword={userPassword}
          onConfirm={() => { deleteBooking(cancelTarget.id); setCancelTarget(null); }}
          onClose={() => setCancelTarget(null)}
        />
      )}

      <div className="container-max section-padding py-8">

        {/* Welcome */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hello, {user.name.split(" ")[0]} 👋</h1>
            <p className="text-slate-500 text-sm mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Left: bookings ── */}
          <div className="flex-1 min-w-0">

            {myBookings.length === 0 && (
              <div className="bg-white rounded-[20px] border border-border p-10 text-center shadow-sm">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="h-7 w-7 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 mb-1">No bookings yet</h2>
                <p className="text-slate-500 text-sm mb-5">Start your medical journey with Health Bridge.</p>
                <Button className="rounded-xl" onClick={() => navigate("/book")}>Book a Procedure</Button>
              </div>
            )}

            <div className="space-y-5">
              {myBookings.map((booking) => {
                const procedure = procedures.find((p) => p.id === booking.procedureId);
                const stepIndex = getStepIndex(booking.status);
                const colors = getStatusColor(booking.status);
                const isRejected = booking.status === "Rejected";
                const uploadedTypes = booking.uploadedFiles.map((f) => f.type);
                const requiredDocs = procedure?.requiredDocuments ?? [];
                const optionalDocs = procedure?.optionalDocuments ?? [];

                return (
                  <div key={booking.id} className="bg-white rounded-[20px] border border-border shadow-sm overflow-hidden">

                    {/* Header */}
                    <div className="px-6 pt-5 pb-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h2 className="text-[17px] font-semibold text-slate-900">
                              {procedure?.name ?? booking.procedureId}
                            </h2>
                            <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                              {getStatusLabel(booking.status)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-500">
                            {booking.preferredDateStart && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {format(new Date(booking.preferredDateStart), "MMM d")} – {format(new Date(booking.preferredDateEnd), "MMM d, yyyy")}
                              </span>
                            )}
                            {booking.country && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {booking.country}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {format(new Date(booking.createdAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    {!isRejected && (
                      <div className="px-6 pb-4">
                        <div className="flex items-center">
                          {STEPS.map((step, i) => {
                            const done   = i < stepIndex;
                            const active = i === stepIndex;
                            const last   = i === STEPS.length - 1;
                            return (
                              <div key={step.label} className="flex items-center flex-1 min-w-0">
                                <div className="flex flex-col items-center flex-shrink-0">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                    done ? "bg-blue-500" : active ? "bg-blue-500 ring-4 ring-blue-100" : "bg-slate-100"
                                  }`}>
                                    {done   ? <CheckCircle2 className="h-4 w-4 text-white" />
                                    : active ? <Circle className="h-3 w-3 text-white fill-white" />
                                    :          <Circle className="h-3 w-3 text-slate-300" />}
                                  </div>
                                  <span className={`text-[10px] mt-1 font-medium text-center leading-tight max-w-[52px] ${
                                    active ? "text-blue-600" : done ? "text-slate-500" : "text-slate-300"
                                  }`}>{step.label}</span>
                                </div>
                                {!last && (
                                  <div className={`h-[2px] flex-1 mx-1 rounded-full mb-4 ${i < stepIndex ? "bg-blue-500" : "bg-slate-100"}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isRejected && (
                      <div className="mx-6 mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
                        Your request was not approved. Please contact us for more details.
                      </div>
                    )}

                    {/* Info chips */}
                    <div className="px-6 pb-4 grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 rounded-2xl p-3.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Est. Cost</span>
                        </div>
                        <p className="text-[13px] font-semibold text-slate-800">{procedure?.priceRange ?? "—"}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Timer className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Duration</span>
                        </div>
                        <p className="text-[13px] font-semibold text-slate-800">{procedure?.duration ?? "—"}</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Stethoscope className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Recovery</span>
                        </div>
                        <p className="text-[13px] font-semibold text-slate-800">{procedure?.recoveryTime ?? "—"}</p>
                      </div>
                    </div>

                    {/* Documentation — always visible */}
                    <div className="px-6 pb-4 border-t border-slate-50 pt-4 space-y-4">
                      <div>
                        <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Documentation</p>
                        <div className="space-y-1.5">
                          {requiredDocs.map((doc) => {
                            const uploaded = uploadedTypes.includes(doc);
                            return (
                              <div key={doc} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] ${uploaded ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-500"}`}>
                                {uploaded
                                  ? <FileCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  : <FileText className="h-4 w-4 text-slate-300 flex-shrink-0" />}
                                <span className="flex-1">{doc}</span>
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${uploaded ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                                  {uploaded ? "Uploaded" : "Required"}
                                </span>
                              </div>
                            );
                          })}
                          {optionalDocs.map((doc) => {
                            const uploaded = uploadedTypes.includes(doc);
                            return (
                              <div key={doc} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] ${uploaded ? "bg-green-50 text-green-700" : "bg-slate-50/60 text-slate-400"}`}>
                                {uploaded
                                  ? <FileCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  : <FilePlus className="h-4 w-4 text-slate-300 flex-shrink-0" />}
                                <span className="flex-1">{doc}</span>
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${uploaded ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                                  {uploaded ? "Uploaded" : "Optional"}
                                </span>
                              </div>
                            );
                          })}
                          {requiredDocs.length === 0 && optionalDocs.length === 0 && (
                            <p className="text-[13px] text-slate-400 px-3">No documents required.</p>
                          )}
                        </div>
                      </div>

                      {booking.notes && (
                        <div>
                          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Your Notes</p>
                          <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl px-3 py-3">
                            <MessageSquare className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <p className="text-[13px] text-slate-600 leading-relaxed">{booking.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Consultation Scheduled */}
                    {booking.consultationLink && (
                      <div className="mx-6 mb-4 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-2xl p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Video className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-green-900">Consultation Scheduled</p>
                            <p className="text-[12px] text-green-700 mt-0.5">
                              Your doctor is ready for your preliminary consultation.
                            </p>
                            {booking.consultationScheduledAt && (
                              <p className="text-[12px] text-green-800 font-medium mt-1 flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {format(new Date(booking.consultationScheduledAt), "EEEE, MMMM d 'at' HH:mm")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={booking.consultationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <button
                              type="button"
                              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
                            >
                              <Video className="h-4 w-4" />
                              Join Consultation
                            </button>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(booking.consultationLink!);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold border border-green-200 text-green-700 hover:bg-green-100 transition-colors bg-white"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy Link
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/40 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCancelTarget(booking)}
                        className="flex items-center gap-1.5 text-[13px] font-medium text-red-400 hover:text-red-600 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel Request
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/contact")}
                        className="flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Contact us <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {myBookings.length > 0 && (
              <div className="mt-6">
                <Button variant="outline" className="rounded-xl w-full" onClick={() => navigate("/book")}>
                  + Book Another Procedure
                </Button>
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div className="w-72 flex-shrink-0 space-y-4">

            <div className="bg-white rounded-[20px] border border-border shadow-sm p-5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-4">Overview</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-500">Total Bookings</span>
                  <span className="text-[15px] font-bold text-slate-900">{myBookings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-500">Under Review</span>
                  <span className="text-[15px] font-bold text-blue-600">
                    {myBookings.filter(b => !["Completed","Rejected"].includes(b.status)).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-500">Completed</span>
                  <span className="text-[15px] font-bold text-green-600">
                    {myBookings.filter(b => b.status === "Completed").length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[20px] border border-border shadow-sm p-5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-4">What Happens Next</p>
              <div className="space-y-3.5">
                {[
                  { n: "1", text: "Our team reviews your documents within 24–48 hours." },
                  { n: "2", text: "We match you with the best clinic in Georgia." },
                  { n: "3", text: "You receive a treatment plan & cost quote." },
                  { n: "4", text: "We arrange travel, hotel & airport transfer." },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">{n}</div>
                    <p className="text-[13px] text-slate-500 leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-500 rounded-[20px] p-5 text-white">
              <p className="font-semibold text-[15px] mb-1">Need help?</p>
              <p className="text-blue-100 text-[13px] mb-4">Our team is ready to assist you with any questions.</p>
              <Button
                size="sm"
                className="w-full bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-semibold"
                onClick={() => navigate("/contact")}
              >
                Contact Us
              </Button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
