import { useState } from "react";
import { BookingRequest, BookingSession, BookingStatus, hospitals, mockDoctors, procedures } from "@/data/mockData";
import { useBookings } from "@/store/bookingStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, Stethoscope, FileText, ArrowRight, MessageSquare, Download, Plus, Trash2, Search, Check, Building2, X as XIcon, ChevronRight, Video, Copy, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ALL_STATUSES: BookingStatus[] = [
  "Lead - Step 1: Awaiting Email Verification",
  "Lead - Step 2: Profile Completed",
  "Lead - Step 3: Clinic Confirmation",
  "Lead - Step 4: Travel Booked",
  "Lead - Step 5: Awaiting Arrival",
  "In Treatment",
  "Submitted",
  "Under Review",
  "More Information Required",
  "Sent to Hospital",
  "Awaiting Hospital Response",
  "Hospital Confirmed",
  "Appointment Scheduled",
  "Travel Coordination in Progress",
  "Completed",
  "Rejected",
];

interface PatientDrawerProps {
  booking: BookingRequest | null;
  onClose: () => void;
}

export function PatientDrawer({ booking, onClose }: PatientDrawerProps) {
  const { updateStatus, updateBooking } = useBookings();

  // Dialog states
  const [statusOpen, setStatusOpen] = useState(false);
  const [clinicOpen, setClinicOpen] = useState(false);
  const [clinicSearch, setClinicSearch] = useState("");
  const [doctorOpen, setDoctorOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Temp selection state
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | "">("");
  const [selectedClinic, setSelectedClinic] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");

  // New session form
  const [newSession, setNewSession] = useState<Partial<BookingSession>>({
    date: "", time: "09:00", durationMin: 60, title: "", location: "",
  });

  if (!booking) return null;

  const proc = procedures.find((p) => p.id === booking.procedureId);
  const hospital = hospitals.find((h) => h.id === booking.hospitalId);
  const doctor = mockDoctors.find((d) => d.id === booking.doctorId);

  // Required/optional docs cross-referenced against what's actually uploaded,
  // so a document the patient never provided shows up as "Missing", not just omitted.
  const docChecklist = (() => {
    const required = proc?.requiredDocuments ?? [];
    const optional = proc?.optionalDocuments ?? [];
    const known = new Set([...required, ...optional]);
    const rows: { type: string; required: boolean; file: (typeof booking.uploadedFiles)[number] | null }[] = [];

    for (const type of required) {
      rows.push({ type, required: true, file: booking.uploadedFiles.find((f) => f.type === type) ?? null });
    }
    for (const type of optional) {
      rows.push({ type, required: false, file: booking.uploadedFiles.find((f) => f.type === type) ?? null });
    }
    for (const file of booking.uploadedFiles) {
      if (!known.has(file.type)) rows.push({ type: file.type, required: false, file });
    }

    const missingRequired = required.filter((type) => !booking.uploadedFiles.some((f) => f.type === type));
    return {
      rows,
      requiredCount: required.length,
      uploadedRequiredCount: required.length - missingRequired.length,
      missingRequired,
    };
  })();

  // Doctors filtered by selected clinic (or current hospital)
  const clinicForDoctors = selectedClinic || booking.hospitalId || "";
  const availableDoctors = mockDoctors.filter((d) => d.hospitalId === clinicForDoctors);

  function handleUpdateStatus() {
    if (selectedStatus) {
      updateStatus(booking!.id, selectedStatus);
      setStatusOpen(false);
      setSelectedStatus("");
    }
  }

  function handleAssignClinic() {
    if (selectedClinic) {
      updateBooking(booking!.id, { hospitalId: selectedClinic, doctorId: undefined });
      setClinicOpen(false);
      setSelectedClinic("");
    }
  }

  function handleAssignDoctor() {
    if (selectedDoctor) {
      updateBooking(booking!.id, { doctorId: selectedDoctor });
      setDoctorOpen(false);
      setSelectedDoctor("");
    }
  }

  function handleAddSession() {
    if (!newSession.date || !newSession.title) return;
    const session: BookingSession = {
      date: newSession.date!,
      time: newSession.time || "09:00",
      durationMin: newSession.durationMin || 60,
      title: newSession.title!,
      location: newSession.location || "",
      doctorId: booking.doctorId || "",
      hospitalId: booking.hospitalId || "",
    };
    updateBooking(booking.id, {
      sessions: [...(booking.sessions || []), session],
    });
    setNewSession({ date: "", time: "09:00", durationMin: 60, title: "", location: "" });
  }

  function handleDeleteSession(idx: number) {
    const updated = (booking.sessions || []).filter((_, i) => i !== idx);
    updateBooking(booking.id, { sessions: updated });
  }

  function handleDownload(file: { name: string; url: string }) {
    if (file.url && file.url !== "#") {
      window.open(file.url, "_blank");
    } else {
      // Mock: just show file name in alert for demo
      alert(`ფაილი: ${file.name}\n(რეალურ გარემოში ჩამოიტვირთება)`);
    }
  }

  return (
    <>
      <Sheet open={!!booking} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl p-0 flex flex-col h-full bg-[#f8fafc]">

          {/* Header */}
          <div className="bg-white px-6 py-5 border-b border-slate-200 shrink-0">
            <SheetHeader className="flex flex-row items-center justify-between space-y-0 text-left">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0 shadow-sm border border-primary/20">
                  {booking.patientName.charAt(0)}
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold text-slate-800 leading-tight">
                    {booking.patientName}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-500 font-medium flex items-center gap-1">
                      {booking.countryFlag} {booking.country}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400">Created: {format(new Date(booking.createdAt), "MMM dd, yyyy")}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className="bg-slate-100/80 text-primary hover:bg-slate-200/80 font-semibold px-3 py-1 text-xs border border-slate-200">
                  {booking.status}
                </Badge>
                <Button size="sm" className="h-8 text-xs font-semibold shadow-sm" onClick={() => {
                  setSelectedStatus(booking.status);
                  setStatusOpen(true);
                }}>
                  Update Status
                </Button>
              </div>
            </SheetHeader>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 px-6 py-6" style={{ height: "calc(100vh - 100px)" }}>
            <div className="space-y-6 pb-20">

              {/* Contact & Procedure */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Contact & Procedure</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase text-slate-400 font-semibold">Email</p>
                      <a href={`mailto:${booking.patientEmail}`} className="text-sm font-medium text-sky-700 truncate hover:underline">{booking.patientEmail}</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase text-slate-400 font-semibold">Phone</p>
                      <a href={`tel:${booking.patientPhone}`} className="text-sm font-medium text-slate-700 truncate hover:underline">{booking.patientPhone}</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100">
                      <FileText className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase text-slate-400 font-semibold">Procedure</p>
                      <p className="text-sm font-semibold text-sky-800 truncate">{proc?.name || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase text-slate-400 font-semibold">Preferred Dates</p>
                      <p className="text-sm font-medium text-emerald-800 truncate">
                        {format(new Date(booking.preferredDateStart), "MMM d")} - {format(new Date(booking.preferredDateEnd), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hospital & Doctor */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Assigned Clinic</h4>
                {hospital ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="border border-slate-200 rounded-2xl bg-white p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        {hospital.image
                          ? <img src={hospital.image} alt={hospital.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-50 shadow-sm shrink-0" />
                          : <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">{hospital.name.charAt(0)}</div>
                        }
                        <div>
                          <p className="text-sm font-bold text-slate-900">{hospital.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {hospital.city}, Georgia
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedClinic(booking.hospitalId || ""); setClinicOpen(true); }}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {doctor ? (
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                          <Stethoscope className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Primary Doctor</p>
                            <p className="text-sm font-semibold text-slate-700">{doctor.name}</p>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="text-xs border-dashed text-slate-500"
                          onClick={() => { setSelectedDoctor(""); setDoctorOpen(true); }}>
                          Assign Doctor
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => { setSelectedClinic(""); setClinicOpen(true); }}
                    className="group cursor-pointer border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-5 flex items-center justify-between transition-all hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Building2 className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Choose a clinic</p>
                        <p className="text-xs text-slate-400 mt-0.5">Select a medical center for this patient</p>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Consultation Info */}
              {booking.consultationLink && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" /> Consultation Scheduled
                  </h4>
                  <div className="space-y-2">
                    {booking.consultationScheduledAt && (
                      <div className="flex items-center gap-2 text-sm text-blue-800 font-medium">
                        <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        {format(new Date(booking.consultationScheduledAt), "EEEE, MMMM d 'at' HH:mm")}
                      </div>
                    )}
                    <p className="text-xs text-blue-600 font-mono break-all">{booking.consultationLink}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(booking.consultationLink!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-200 text-blue-700 hover:bg-blue-100 bg-white transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy Link
                      </button>
                      <a href={booking.consultationLink} target="_blank" rel="noopener noreferrer">
                        <button
                          type="button"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                          <Video className="h-3.5 w-3.5" /> Join Meet
                        </button>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Documents</h4>
                  <Badge variant={docChecklist.missingRequired.length > 0 ? "destructive" : "secondary"}>
                    {docChecklist.uploadedRequiredCount}/{docChecklist.requiredCount} required
                  </Badge>
                </div>
                {docChecklist.rows.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {docChecklist.rows.map((row, i) => {
                      if (!row.file) {
                        return (
                          <div key={i} className={`flex items-center gap-3 p-3 border rounded-lg ${
                            row.required ? "border-red-200 bg-red-50" : "border-dashed border-slate-200"
                          }`}>
                            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${row.required ? "bg-red-100" : "bg-slate-100"}`}>
                              <AlertTriangle className={`h-4 w-4 ${row.required ? "text-red-500" : "text-slate-300"}`} />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${row.required ? "text-red-700" : "text-slate-400"}`}>{row.type}</p>
                              <p className={`text-[10px] ${row.required ? "text-red-500" : "text-slate-400"}`}>
                                {row.required ? "Missing" : "Optional — not uploaded"}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      const mismatch = row.file.verified === false;
                      return (
                        <button key={i} onClick={() => handleDownload(row.file!)}
                          className={`flex items-center justify-between p-3 border rounded-lg transition-colors group cursor-pointer w-full text-left ${
                            mismatch
                              ? "border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100/60"
                              : "border-slate-200 hover:border-primary/30 hover:bg-primary/5"
                          }`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${mismatch ? "bg-red-100" : "bg-primary/10"}`}>
                              {mismatch
                                ? <AlertTriangle className="h-4 w-4 text-red-500" />
                                : <FileText className="h-4 w-4 text-primary" />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${mismatch ? "text-red-700" : "text-slate-700"}`}>{row.type}</p>
                              <p className="text-[10px] text-slate-400 truncate">{row.file.name}</p>
                              {mismatch && row.file.verifyReason && (
                                <p className="text-[10px] text-red-500 mt-0.5">⚠ {row.file.verifyReason}</p>
                              )}
                            </div>
                          </div>
                          <Download className={`h-4 w-4 shrink-0 ml-2 ${mismatch ? "text-red-300 group-hover:text-red-500" : "text-slate-300 group-hover:text-primary"}`} />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4 border border-dashed rounded-lg border-slate-200">No documents uploaded.</p>
                )}
              </div>

              {/* Schedule */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Sessions</h4>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary"
                    onClick={() => setScheduleOpen(true)}>
                    Manage Schedule <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                {booking.sessions && booking.sessions.length > 0 ? (
                  <div className="relative border-l-2 border-slate-200 ml-4 pl-6 pb-2 space-y-6">
                    {[...booking.sessions].sort((a, b) => a.date.localeCompare(b.date)).map((session, idx) => {
                      const isPast = new Date(session.date) < new Date();
                      return (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[31px] w-3.5 h-3.5 rounded-full border-2 border-white ${isPast ? "bg-slate-300" : "bg-primary"} shadow-sm top-1`} />
                          <div className={`bg-white border p-4 rounded-xl shadow-sm ${isPast ? "border-slate-200 opacity-60" : "border-primary/20 bg-primary/[0.02]"}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <h5 className="font-bold text-slate-800 text-sm">{session.title}</h5>
                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100 w-fit">
                                <Calendar className="h-3 w-3" /> {format(new Date(session.date), "MMM d")}
                                <span className="mx-1">•</span>
                                <Clock className="h-3 w-3" /> {session.time} ({session.durationMin}m)
                              </div>
                            </div>
                            {session.location && (
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                                <MapPin className="h-3 w-3 text-slate-400" /> {session.location}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 text-center">
                    <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">No sessions scheduled</p>
                    <p className="text-xs text-slate-400 mt-1 mb-3">Therapy plan has not been finalized yet.</p>
                    <Button size="sm" variant="outline" className="bg-white" onClick={() => setScheduleOpen(true)}>
                      Create Schedule
                    </Button>
                  </div>
                )}
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Admin Notes
                  </h4>
                  <p className="text-sm text-amber-900 leading-relaxed font-medium">{booking.notes}</p>
                </div>
              )}

            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* ── Update Status Dialog ── */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Update Status</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label className="text-xs text-slate-500 mb-2 block">Current: <span className="font-semibold text-slate-700">{booking.status}</span></Label>
            <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as BookingStatus)}>
              <SelectTrigger><SelectValue placeholder="Select new status..." /></SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={!selectedStatus || selectedStatus === booking.status}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Select Clinic Dialog ── */}
      <Dialog open={clinicOpen} onOpenChange={(v) => { setClinicOpen(v); if (!v) setClinicSearch(""); }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-[28px] gap-0">

          {/* Header */}
          <div className="px-6 pt-7 pb-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight text-left">Choose a clinic</DialogTitle>
            </DialogHeader>
            <div className="relative mt-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search clinics..."
                value={clinicSearch}
                onChange={(e) => setClinicSearch(e.target.value)}
                className="pl-11 rounded-2xl bg-gray-50 border-gray-200 focus:border-gray-900 focus:bg-white h-11"
              />
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[340px] px-6 pb-2 space-y-2">
            {(() => {
              const filtered = hospitals.filter((h) =>
                h.name.toLowerCase().includes(clinicSearch.toLowerCase()) ||
                h.city.toLowerCase().includes(clinicSearch.toLowerCase())
              );
              if (filtered.length === 0) return (
                <div className="text-center py-10">
                  <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">No clinics found</p>
                  <p className="text-xs text-gray-400 mt-1">Try a different keyword</p>
                </div>
              );
              return filtered.map((h) => {
                const isSelected = selectedClinic === h.id;
                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedClinic(h.id)}
                    className={`relative flex items-start gap-3 p-4 rounded-[18px] cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "bg-green-50 border-2 border-green-500"
                        : "bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {h.image
                      ? <img src={h.image} alt={h.name} className="w-11 h-11 rounded-full object-cover shrink-0 mt-0.5" />
                      : <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold shrink-0 mt-0.5">{h.name.charAt(0)}</div>
                    }
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-sm font-bold text-gray-900">{h.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{h.description}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 flex gap-3">
            <button
              onClick={() => { setClinicOpen(false); setClinicSearch(""); }}
              className="flex-1 py-3 text-sm font-bold text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignClinic}
              disabled={!selectedClinic}
              className={`flex-[2] py-3 text-sm font-bold rounded-full transition-all ${
                selectedClinic
                  ? "bg-gray-900 text-white hover:bg-black"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Assign Clinic
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Assign Doctor Dialog ── */}
      <Dialog open={doctorOpen} onOpenChange={setDoctorOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Assign Doctor</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            {availableDoctors.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No doctors found for this clinic.</p>
            ) : availableDoctors.map((d) => (
              <button key={d.id} onClick={() => setSelectedDoctor(d.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${selectedDoctor === d.id ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"}`}>
                <img src={d.avatar} alt={d.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.specialty}</p>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDoctorOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignDoctor} disabled={!selectedDoctor}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manage Schedule Dialog ── */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Manage Schedule</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-3 -mr-3">
            <div className="space-y-2 mb-5">
              {(booking.sessions || []).length === 0 && (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl py-6 text-center">
                  <Calendar className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-sm text-slate-400">No sessions yet.</p>
                </div>
              )}
              {(booking.sessions || [])
                .map((s, originalIndex) => ({ s, originalIndex }))
                .sort((a, b) => (a.s.date + a.s.time).localeCompare(b.s.date + b.s.time))
                .map(({ s, originalIndex }) => {
                  const isPast = new Date(`${s.date}T${s.time}`) < new Date();
                  return (
                    <div key={originalIndex} className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                      isPast ? "border-slate-200 bg-slate-50/60 opacity-70" : "border-primary/20 bg-primary/[0.02]"
                    )}>
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        isPast ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary"
                      )}>
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{s.title}</p>
                        <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(s.date), "EEE, MMM d")}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.time} · {s.durationMin}m</span>
                          {s.location && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" /> {s.location}</span>}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 shrink-0"
                        onClick={() => handleDeleteSession(originalIndex)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Session
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Title</Label>
                  <Input className="bg-white" placeholder="e.g. Consultation" value={newSession.title}
                    onChange={(e) => setNewSession((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(
                        "w-full justify-start text-left font-normal bg-white",
                        !newSession.date && "text-muted-foreground"
                      )}>
                        <Calendar className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">{newSession.date ? format(new Date(newSession.date), "MMM d, yyyy") : "Pick a date"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newSession.date ? new Date(newSession.date) : undefined}
                        onSelect={(d) => d && setNewSession((p) => ({ ...p, date: format(d, "yyyy-MM-dd") }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs">Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <Input type="time" className="bg-white pl-9" value={newSession.time}
                      onChange={(e) => setNewSession((p) => ({ ...p, time: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Duration (min)</Label>
                  <Input className="bg-white" type="number" value={newSession.durationMin}
                    onChange={(e) => setNewSession((p) => ({ ...p, durationMin: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs">Location</Label>
                  <Input className="bg-white" placeholder="Room / address" value={newSession.location}
                    onChange={(e) => setNewSession((p) => ({ ...p, location: e.target.value }))} />
                </div>
              </div>
              <Button className="mt-3 w-full" size="sm" onClick={handleAddSession}
                disabled={!newSession.title || !newSession.date}>
                <Plus className="h-4 w-4 mr-1" /> Add Session
              </Button>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setScheduleOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
