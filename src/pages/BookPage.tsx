import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { countries, procedures, type BookingRequest } from "@/data/mockData";
import { CalendarIcon, Upload, CheckCircle, ArrowLeft, ArrowRight, FileText, X, ChevronLeft, ChevronRight, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import emailjs from "@emailjs/browser";
import { EMAILJS_CONFIG, isEmailJSConfigured } from "@/lib/emailjs";
import { useBookings } from "@/store/bookingStore";
import { useAuth } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

export default function BookPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addBooking } = useBookings();
  const { register, getPartnerByReferralCode } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [country, setCountry] = useState(params.get("country") || "");
  const [procedureId, setProcedureId] = useState(params.get("procedure") || "");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>(() => {
    const f = params.get("from");
    const t = params.get("to");
    return { from: f ? new Date(f) : undefined, to: t ? new Date(t) : undefined };
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [referralCode, setReferralCode] = useState(params.get("ref") || "");
  const [budget, setBudget] = useState("");

  // Step 2
  const [files, setFiles] = useState<{ name: string; type: string; url: string }[]>([]);
  const [notes, setNotes] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3 AI animation
  const [aiStep, setAiStep] = useState(-1);
  const [aiComplete, setAiComplete] = useState(false);

  const aiWorkflow = [
    { title: "Analyzing patient request", subtitle: "Reading procedure, dates, and medical preferences." },
    { title: "Verifying documents", subtitle: "Checking uploaded medical files and records." },
    { title: "Matching clinics", subtitle: "Finding the best facility for your treatment." },
    { title: "Checking availability", subtitle: "Confirming appointment slots and schedules." },
    { title: "Calculating treatment plan", subtitle: "Preparing your personalized medical schedule." },
    { title: "Sending confirmation", subtitle: "Dispatching your booking details to our team." },
  ];

  const aiIcons = ["brain", "shield", "hospital", "calendar", "clipboard", "mail"];
  const DOCS_STEP_INDEX = 1; // "Verifying documents"
  const noDocsUploaded = files.length === 0;

  function aiIconSVG(key: string, cls = "w-5 h-5") {
    const attrs = `viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="${cls}"`;
    const map: Record<string, string> = {
      brain: `<svg ${attrs}><path d="M9.5 3.5a3.5 3.5 0 0 0-3.5 3.5v.5A3 3 0 0 0 3 10.5 3.5 3.5 0 0 0 6.5 14H7v1a3 3 0 0 0 3 3"/><path d="M14.5 3.5A3.5 3.5 0 0 1 18 7v.5a3 3 0 0 1 3 3 3.5 3.5 0 0 1-3.5 3.5H17v1a3 3 0 0 1-3 3"/><path d="M12 6v12"/><path d="M9 8.5c.8.5 1.5.8 3 .8s2.2-.3 3-.8"/><path d="M9 15.5c.8-.5 1.5-.8 3-.8s2.2.3 3 .8"/></svg>`,
      shield: `<svg ${attrs}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9.5 12.5l1.7 1.7 3.8-4.2"/></svg>`,
      hospital: `<svg ${attrs}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`,
      calendar: `<svg ${attrs}><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M9 15l2 2 4-4"/></svg>`,
      clipboard: `<svg ${attrs}><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M8 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>`,
      mail: `<svg ${attrs}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>`,
      checkDouble: `<svg ${attrs}><path d="M7 12l3 3 7-7"/><path d="M3 12l3 3 2-2"/></svg>`,
      check: `<svg ${attrs}><path d="M5 13l4 4L19 7"/></svg>`,
      warning: `<svg ${attrs}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    };
    return map[key] || map.brain;
  }

  useEffect(() => {
    if (step !== 3) {
      setAiStep(-1);
      setAiComplete(false);
      return;
    }
    const LOOP_MS = 1700;
    const HOLD_DONE_MS = 2200;
    const timers: ReturnType<typeof setTimeout>[] = [];

    aiWorkflow.forEach((_, idx) => {
      timers.push(setTimeout(() => setAiStep(idx), idx * LOOP_MS));
    });

    timers.push(setTimeout(() => {
      setAiComplete(true);
      timers.push(setTimeout(() => { handleSubmit(); }, HOLD_DONE_MS));
    }, aiWorkflow.length * LOOP_MS));

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const selectedProcedure = procedures.find((p) => p.id === procedureId);

  const handleFileUpload = (docType: string) => {
    setUploadingDoc(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDoc) return;
    e.target.value = "";

    const ext = file.name.split(".").pop() ?? "bin";
    const safeName = `${Date.now()}_${uploadingDoc.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "")}.${ext}`
    const filePath = safeName;
    const { error } = await supabase.storage.from("documents").upload(filePath, file);
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploadingDoc(null);
      return;
    }
    const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
    setFiles((prev) => {
      const filtered = prev.filter((f) => f.type !== uploadingDoc);
      return [...filtered, { name: file.name, type: uploadingDoc, url: data.publicUrl }];
    });
    toast.success(`${uploadingDoc} uploaded successfully`);
    setUploadingDoc(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fillDemo = () => {
    setName("Alex Johnson");
    setEmail("alex.johnson@gmail.com");
    setPhone("+995 555 123 456");
    setCountry("United Kingdom");
    setProcedureId("p-radiation");
    const from = addDays(new Date(), 16);
    const to = addDays(new Date(), 37);
    setDateRange({ from, to });
    setBudget("$8,500");
    setNotes("Demo patient — testing the booking flow. No real medical data.");
    setFiles([
      { name: "passport_demo.pdf", type: "Passport", url: "#demo" },
      { name: "oncology_report_demo.pdf", type: "Oncology Diagnosis Report", url: "#demo" },
      { name: "ct_scan_demo.jpg", type: "CT / MRI Scan", url: "#demo" },
      { name: "medical_history_demo.pdf", type: "Medical History", url: "#demo" },
      { name: "radiation_records_demo.pdf", type: "Previous Radiation Records", url: "#demo" },
    ]);
    toast.success("Demo data filled! You can now proceed through all steps.");
  };

  const canProceedStep1 = country && procedureId && dateRange.from && dateRange.to && name && email && phone;

  const handleSubmit = async () => {
    if (!selectedProcedure) return;
    setSubmitting(true);

    // ── 0. Validate referral code if provided ──────────────────────────
    let assignedPartnerId: string | undefined = undefined;
    if (referralCode.trim()) {
      const partner = getPartnerByReferralCode(referralCode.trim());
      if (!partner) {
        toast.error("Invalid referral code. Please check and try again.");
        setSubmitting(false);
        return;
      }
      assignedPartnerId = partner.id;
    }

    // ── 1. Build the new BookingRequest and add to the store ───────────
    const newBooking: BookingRequest = {
      id: `booking-${Date.now()}`,
      patientName: name,
      patientEmail: email,
      patientPhone: phone,
      country,
      countryFlag: "",
      procedureId,
      status: "Lead - Step 1: Awaiting Email Verification",
      preferredDateStart: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : "",
      preferredDateEnd: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : "",
      uploadedFiles: files.map((f) => ({ name: f.name, type: f.type, url: f.url })),
      notes,
      createdAt: new Date().toISOString(),
      referralCode: referralCode.trim() || undefined,
      assignedPartnerId,
      budget: budget.trim() || undefined,
    };

    addBooking(newBooking);

    // ── 2. Create patient account with temp password ───────────────────
    const tempPassword = Math.random().toString(36).slice(-8);
    register(name, email, tempPassword);

    // ── 3. Send confirmation email via EmailJS ─────────────────────────
    if (isEmailJSConfigured()) {
      try {
        await emailjs.send(
          EMAILJS_CONFIG.serviceId,
          EMAILJS_CONFIG.templateId,
          {
            name,
            email,
            patient_name: name,
            patient_email: email,
            procedure_name: selectedProcedure.name,
            date_from: dateRange.from ? format(dateRange.from, "MMMM d, yyyy") : "",
            date_to: dateRange.to ? format(dateRange.to, "MMMM d, yyyy") : "",
            price_range: selectedProcedure.priceRange,
            notes: notes || "—",
            temp_password: tempPassword,
          },
          { publicKey: EMAILJS_CONFIG.publicKey }
        );
      } catch (err) {
        // email failure shouldn't block the booking confirmation
        console.error("EmailJS error:", err);
      }
    } else {
      console.warn("EmailJS not configured — no confirmation email sent. See src/lib/emailjs.ts for setup.");
    }

    setSubmitting(false);
    toast.success("Your booking request has been submitted! We'll be in touch within 24–48 hours.");
    setStep(4);
  };

  if (step === 4) {
    return (
      <div className="container-max section-padding py-20 text-center">
        <div className="max-w-md mx-auto">
          <CheckCircle className="h-16 w-16 text-trust mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Request Submitted!</h1>
          <p className="text-muted-foreground mb-3">
            Our AI has processed your data for <strong>{selectedProcedure?.name}</strong> and submitted your request to our medical team.
          </p>
          <p className="text-muted-foreground mb-6">
            You will receive your authorization code and all relevant booking information at <strong>{email}</strong>.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => navigate("/dashboard")} className="rounded-xl">View My Booking Status</Button>
            <Button onClick={() => navigate("/")} variant="outline" className="rounded-xl">Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max section-padding py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Book With Us</h1>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {step > s ? <CheckCircle className="h-4 w-4" /> : s}
              </div>
              <span className="text-xs font-medium text-muted-foreground hidden sm:block">
                {s === 1 ? "Details" : s === 2 ? "Documents" : "Review"}
              </span>
              {s < 3 && <div className={cn("flex-1 h-px", step > s ? "bg-primary" : "bg-border")} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-foreground">Your Information</h2>
                <Button size="sm" variant="outline" onClick={fillDemo} className="text-xs gap-1.5 border-dashed">
                  Fill Demo
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Full Name *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Email *</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Phone *</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Country *</label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <h2 className="font-heading font-semibold text-foreground pt-2">Treatment</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Procedure *</label>
                  <Select value={procedureId} onValueChange={setProcedureId}>
                    <SelectTrigger><SelectValue placeholder="Select procedure" /></SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(procedures.map((p) => p.category))).map((cat) => (
                        <div key={cat}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat}</div>
                          {procedures.filter((p) => p.category === cat).map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Preferred Dates *</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (dateRange.to ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}` : format(dateRange.from, "PPP")) : "Select 15–30 day range"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange as import("react-day-picker").DateRange}
                        onSelect={(range: import("react-day-picker").DateRange | undefined) => {
                          if (range?.from && range?.to) {
                            const diff = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
                            if (diff > 30) { setDateRange({ from: range.from, to: addDays(range.from, 30) }); return; }
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
              </div>

              {selectedProcedure && (() => {
                const stayDays = dateRange.from && dateRange.to
                  ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const tooShort = stayDays !== null && stayDays < selectedProcedure.minStayDays;
                const earliestReturn = dateRange.from ? addDays(dateRange.from, selectedProcedure.minStayDays) : null;
                return (
                  <div className="space-y-3">
                    {/* Procedure info card */}
                    <div className="bg-secondary/50 rounded-lg p-4 text-sm space-y-2">
                      <p className="font-medium text-foreground">{selectedProcedure.name}</p>
                      <p className="text-muted-foreground">{selectedProcedure.description}</p>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Price range</p>
                            <p className="font-semibold text-foreground">{selectedProcedure.priceRange}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Average cost</p>
                            <p className="font-semibold text-primary">{selectedProcedure.avgCost}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Hospitalization</p>
                            <p className="font-medium text-foreground">{selectedProcedure.hospitalizationDays}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Min. stay required</p>
                            <p className="font-medium text-foreground">{selectedProcedure.minStayDays} days</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Date too-short warning */}
                    {tooShort && earliestReturn && (
                      <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-orange-800">Return date is too early</p>
                          <p className="text-orange-700 mt-0.5">
                            For <strong>{selectedProcedure.name}</strong>, the recommended minimum stay is{" "}
                            <strong>{selectedProcedure.minStayDays} days</strong>. We cannot discharge you from the clinic before{" "}
                            <strong>{format(earliestReturn, "MMMM d, yyyy")}</strong>. Please adjust your return date.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Budget input */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        Your Budget <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <Input
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder={`e.g. $${selectedProcedure.priceMin.toLocaleString()} – $${selectedProcedure.priceMax.toLocaleString()}`}
                      />
                      {(() => {
                        const num = parseFloat(budget.replace(/[^0-9.]/g, ""));
                        if (budget.trim() && !isNaN(num) && num < selectedProcedure.priceMin) {
                          return (
                            <p className="text-xs text-destructive mt-1 font-medium">
                              ⚠ This amount is below the recommended minimum (${selectedProcedure.priceMin.toLocaleString()}). We may not be able to find a suitable option within this budget.
                            </p>
                          );
                        }
                        return (
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter your approximate budget so we can find the best match for you.
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Referral Code <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HB-SOPIKO"
                  className="uppercase placeholder:normal-case"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="gap-2">
                  Next: Upload Documents <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && selectedProcedure && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
              <h2 className="font-heading font-semibold text-foreground">Upload Documents</h2>
              <p className="text-sm text-muted-foreground">Please upload the required documents for <strong>{selectedProcedure.name}</strong>.</p>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Required Documents</h3>
                <div className="space-y-2">
                  {selectedProcedure.requiredDocuments.map((doc) => {
                    const uploadedFile = files.find((f) => f.type === doc);
                    return (
                      <div key={doc} className={cn("flex items-center justify-between p-3 rounded-lg border", uploadedFile ? "bg-trust/5 border-trust/20" : "border-border")}>
                        <span className="text-sm font-medium flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{doc}</span>
                          {uploadedFile && <CheckCircle className="h-4 w-4 text-trust shrink-0" />}
                        </span>
                        {!uploadedFile ? (
                          <Button size="sm" variant="outline" onClick={() => handleFileUpload(doc)} className="gap-1 shrink-0 ml-2">
                            <Upload className="h-3.5 w-3.5" /> Upload
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={uploadedFile.name}>{uploadedFile.name}</span>
                            <button onClick={() => removeFile(files.indexOf(uploadedFile))} className="text-muted-foreground hover:text-destructive">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedProcedure.optionalDocuments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Optional Documents</h3>
                  <div className="space-y-2">
                    {selectedProcedure.optionalDocuments.map((doc) => {
                      const uploadedFile = files.find((f) => f.type === doc);
                      return (
                        <div key={doc} className={cn("flex items-center justify-between p-3 rounded-lg border", uploadedFile ? "bg-trust/5 border-trust/20" : "border-border border-dashed")}>
                          <span className="text-sm font-medium flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{doc}</span>
                            <span className="text-xs text-muted-foreground shrink-0">(optional)</span>
                            {uploadedFile && <CheckCircle className="h-4 w-4 text-trust shrink-0" />}
                          </span>
                          {!uploadedFile ? (
                            <Button size="sm" variant="ghost" onClick={() => handleFileUpload(doc)} className="gap-1 shrink-0 ml-2">
                              <Upload className="h-3.5 w-3.5" /> Upload
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={uploadedFile.name}>{uploadedFile.name}</span>
                              <button onClick={() => removeFile(files.indexOf(uploadedFile))} className="text-muted-foreground hover:text-destructive">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {files.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Uploaded Files</h3>
                  <div className="space-y-1">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2">
                        <span className="text-foreground">{f.name}</span>
                        <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Additional Notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any relevant information about your medical history, preferences, etc." rows={3} />
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={() => setStep(3)} className="gap-2">Next: Review <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — AI Processing Animation (matches Healthbridge.html) */}
        {step === 3 && selectedProcedure && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 32, boxShadow: "0 20px 60px rgba(15,23,42,0.06)", overflow: "hidden" }}>
            <div style={{ padding: 28 }}>

              {/* Card top */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "#94a3b8", fontWeight: 600 }}>Live workflow</p>
                  <h2 style={{ margin: "10px 0 0", fontSize: 30, lineHeight: 1.1, letterSpacing: "-0.02em", fontWeight: 700, color: "#0f172a" }}>AI Medical Processing</h2>
                </div>
                <div style={{
                  border: "1px solid #e5e7eb", background: aiComplete ? "#ecfdf5" : "#f8fafc",
                  color: aiComplete ? "#047857" : "#64748b", fontSize: 14, padding: "10px 14px",
                  borderRadius: 999, whiteSpace: "nowrap",
                  ...(aiComplete ? { borderColor: "#bbf7d0" } : {})
                }}>
                  {aiComplete ? "Completed" : "Processing"}
                </div>
              </div>

              {/* Visual box */}
              <div style={{
                position: "relative", minHeight: 330, border: "1px solid #e5e7eb",
                background: "#fbfbfc", borderRadius: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", marginBottom: 28
              }}>
                {/* Rings */}
                <div className="animate-spin" style={{ position: "absolute", width: 360, height: 360, borderRadius: 999, border: "1px solid rgba(203,213,225,0.9)", animationDuration: "18s", opacity: 0.72 }} />
                <div className="animate-spin ai-ring-reverse" style={{ position: "absolute", width: 280, height: 280, borderRadius: 999, border: "1px solid rgba(203,213,225,0.9)", animationDuration: "16s", opacity: 0.82 }} />
                <div className="animate-spin" style={{ position: "absolute", width: 200, height: 200, borderRadius: 999, border: "1px solid rgba(203,213,225,0.9)", animationDuration: "14s", opacity: 0.9 }} />
                {/* Pulse */}
                <div className="ai-animate-pulse" style={{ position: "absolute", width: 120, height: 120, borderRadius: 999, background: "rgba(226,232,240,0.9)", filter: "blur(28px)" }} />

                {/* Center content */}
                {(() => {
                  const showDocsWarning = !aiComplete && aiStep === DOCS_STEP_INDEX && noDocsUploaded;
                  return (
                <div key={aiComplete ? "done" : aiStep} className="ai-animate-fade-scale" style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 500, padding: "0 20px" }}>
                  {/* Icon */}
                  <div
                    className={aiComplete ? "" : "ai-animate-float"}
                    style={{
                      width: 96, height: 96, margin: "0 auto", borderRadius: 28,
                      border: `1px solid ${showDocsWarning ? "#fecaca" : aiComplete ? "#bbf7d0" : "#e5e7eb"}`,
                      background: showDocsWarning ? "#fef2f2" : aiComplete ? "#ecfdf5" : "#fff",
                      boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: showDocsWarning ? "#dc2626" : aiComplete ? "#10b981" : "#334155",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: aiIconSVG(
                        showDocsWarning ? "warning" : aiComplete ? "checkDouble" : (aiStep >= 0 ? aiIcons[aiStep] : "brain"),
                        "w-10 h-10"
                      )
                    }}
                  />
                  {/* Title */}
                  <h3 style={{ margin: "24px 0 0", fontSize: 30, lineHeight: 1.15, letterSpacing: "-0.02em", fontWeight: 700, color: showDocsWarning ? "#b91c1c" : "#0f172a" }}>
                    {showDocsWarning ? "No documents uploaded" : aiComplete ? "Done. Request prepared." : (aiStep >= 0 ? aiWorkflow[aiStep].title : "Starting…")}
                  </h3>
                  {/* Subtitle */}
                  <p style={{ margin: "14px auto 0", maxWidth: 430, fontSize: 14, lineHeight: 1.9, color: showDocsWarning ? "#dc2626" : "#64748b" }}>
                    {showDocsWarning ? "Your request can still be submitted, but our medical team will need documents from you before proceeding." : aiComplete ? "All checks completed. Submitting your request…" : (aiStep >= 0 ? aiWorkflow[aiStep].subtitle : "")}
                  </p>
                  {/* Run pill */}
                  <div style={{
                    marginTop: 18, display: "inline-flex", alignItems: "center", gap: 10,
                    borderRadius: 999, border: `1px solid ${showDocsWarning ? "#fecaca" : aiComplete ? "#bbf7d0" : "#e5e7eb"}`,
                    background: showDocsWarning ? "#fef2f2" : aiComplete ? "#ecfdf5" : "#fff",
                    color: showDocsWarning ? "#b91c1c" : aiComplete ? "#047857" : "#64748b",
                    padding: "10px 14px", fontSize: 14,
                    boxShadow: aiComplete ? "none" : "0 4px 14px rgba(15,23,42,0.03)"
                  }}>
                    {aiComplete ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M5 13l4 4L19 7"/></svg>
                    ) : showDocsWarning ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    ) : (
                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #cbd5e1", borderTopColor: "#111827", animation: "spin 0.8s linear infinite" }} />
                    )}
                    <span>{aiComplete ? "All checks completed" : showDocsWarning ? "Missing documents" : "Running task"}</span>
                    {!aiComplete && !showDocsWarning && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span className="ai-dot" style={{ width: 6, height: 6, borderRadius: 999, background: "#94a3b8", display: "block" }} />
                        <span className="ai-dot" style={{ width: 6, height: 6, borderRadius: 999, background: "#94a3b8", display: "block" }} />
                        <span className="ai-dot" style={{ width: 6, height: 6, borderRadius: 999, background: "#94a3b8", display: "block" }} />
                      </span>
                    )}
                  </div>
                </div>
                  );
                })()}
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, color: "#64748b", marginBottom: 12 }}>
                  <span>Workflow progress</span>
                  <span>{aiComplete ? "100%" : aiStep >= 0 ? `${Math.round(((aiStep + 0.35) / aiWorkflow.length) * 100)}%` : "10%"}</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 999,
                    width: aiComplete ? "100%" : aiStep >= 0 ? `${Math.round(((aiStep + 0.35) / aiWorkflow.length) * 100)}%` : "10%",
                    backgroundColor: aiComplete ? "#10b981" : "#111827",
                    transition: "width 0.55s ease, background-color 0.3s ease"
                  }} />
                </div>
              </div>

              {/* Step list */}
              <div style={{ display: "grid", gap: 12 }}>
                {aiWorkflow.map((wf, idx) => {
                  const done = aiComplete || idx < aiStep;
                  const active = !aiComplete && idx === aiStep;
                  const warn = idx === DOCS_STEP_INDEX && noDocsUploaded && (done || active);
                  return (
                    <div key={idx} className={active && !warn ? "ai-animate-breathe" : ""}
                      style={{
                        display: "flex", alignItems: "center", gap: 14, padding: 16,
                        borderRadius: 20, border: `1px solid ${warn ? "#fecaca" : done ? "#d1fae5" : active ? "#d1d5db" : "#e5e7eb"}`,
                        background: warn ? "rgba(254,242,242,0.75)" : done ? "rgba(236,253,245,0.7)" : active ? "#f8fafc" : "#fff",
                        transition: "0.25s ease"
                      }}>
                      <div
                        style={{
                          width: 44, height: 44, flexShrink: 0, borderRadius: 16,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: warn ? "#fee2e2" : done ? "#d1fae5" : active ? "#111827" : "#f1f5f9",
                          color: warn ? "#dc2626" : done ? "#059669" : active ? "#fff" : "#64748b",
                        }}
                        dangerouslySetInnerHTML={{ __html: aiIconSVG(warn ? "warning" : done ? "check" : aiIcons[idx], "w-5 h-5") }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: warn ? "#b91c1c" : "#0f172a" }}>{wf.title}</span>
                          <span style={{
                            flexShrink: 0, padding: "6px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                            background: warn ? "#fee2e2" : done ? "#d1fae5" : active ? "#111827" : "#f1f5f9",
                            color: warn ? "#b91c1c" : done ? "#047857" : active ? "#fff" : "#64748b",
                          }}>
                            {warn ? "Missing" : done ? "Done" : active ? "Loading" : "Waiting"}
                          </span>
                        </div>
                        <p style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: warn ? "#dc2626" : "#64748b" }}>
                          {warn ? "No documents were uploaded for this request." : wf.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 24 }}>
                <Button variant="outline" onClick={() => setStep(2)} disabled={aiStep > 0} className="gap-2 text-sm">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
