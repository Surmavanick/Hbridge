import { useState, useRef } from "react";
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

  const selectedProcedure = procedures.find((p) => p.id === procedureId);

  const handleFileUpload = (docType: string) => {
    setUploadingDoc(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDoc) return;
    const url = URL.createObjectURL(file);
    setFiles((prev) => {
      const filtered = prev.filter((f) => f.type !== uploadingDoc);
      return [...filtered, { name: file.name, type: uploadingDoc, url }];
    });
    toast.success(`${uploadingDoc} uploaded successfully`);
    setUploadingDoc(null);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    const file = files[index];
    if (file?.url) URL.revokeObjectURL(file.url);
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
          <p className="text-muted-foreground mb-6">
            Thank you, {name}. We've received your booking request for{" "}
            <strong>{selectedProcedure?.name}</strong>. Our team will review your documents and get back to you within 24–48 hours.
          </p>
          <p className="text-sm text-muted-foreground mb-6">A confirmation email has been sent to <strong>{email}</strong>.</p>
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
              <h2 className="font-heading font-semibold text-foreground">Your Information</h2>
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

        {/* Step 3 */}
        {step === 3 && selectedProcedure && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <h2 className="font-heading font-semibold text-foreground">Review Your Request</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground block">{name}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground block">{email}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-foreground block">{phone}</span></div>
                  <div><span className="text-muted-foreground">Country:</span> <span className="font-medium text-foreground block">{country}</span></div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Procedure:</span>
                    <span className="font-medium text-foreground block">{selectedProcedure.name}</span>
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-muted-foreground">Preferred Dates:</span>
                    <span className="font-medium text-foreground block">
                      {dateRange.from && dateRange.to
                        ? `${format(dateRange.from, "MMMM d, yyyy")} – ${format(dateRange.to, "MMMM d, yyyy")}`
                        : "Not selected"}
                    </span>
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-muted-foreground">Price Range:</span>
                    <span className="font-semibold text-foreground block">{selectedProcedure.priceRange}</span>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="text-muted-foreground">Average Cost:</span>
                    <span className="font-semibold text-primary block">{selectedProcedure.avgCost}</span>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="text-muted-foreground">Hospitalization:</span>
                    <span className="font-medium text-foreground block">{selectedProcedure.hospitalizationDays}</span>
                  </div>
                  {budget.trim() && (
                    <div className="text-sm mt-1">
                      <span className="text-muted-foreground">Your Budget:</span>
                      <span className="font-medium text-foreground block">{budget.trim()}</span>
                    </div>
                  )}
                  {referralCode.trim() && (
                    <div className="text-sm mt-2">
                      <span className="text-muted-foreground">Referral Code:</span>
                      <span className="font-medium text-foreground block">{referralCode.trim()}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Uploaded Documents ({files.length})</p>
                  {files.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {files.map((f, i) => (
                        <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{f.type}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-warning">No documents uploaded. You may be asked for documents later.</p>
                  )}
                </div>

                {notes && (
                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground">{notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
