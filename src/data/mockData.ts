export interface Procedure {
  id: string;
  name: string;
  category: string;
  description: string;
  priceRange: string;
  priceMin: number;
  priceMax: number;
  avgCost: string;
  hospitalizationDays: string;
  minStayDays: number; // minimum days patient must stay (hosp + min recovery)
  duration: string;
  recoveryTime: string;
  requiredDocuments: string[];
  optionalDocuments: string[];
  image?: string;
}

export interface PatientReview {
  name: string;
  country: string;
  flag: string;
  rating: number;
  text: string;
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  accreditations: string[];
  description: string;
  contactEmail: string;
  image?: string;
  address?: string;
  mapEmbedUrl?: string;
  services?: { category: string; items: string[] }[];
  faq?: { question: string; answer: string }[];
  reviews?: PatientReview[];
}

export type BookingStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "More Information Required"
  | "Sent to Hospital"
  | "Awaiting Hospital Response"
  | "Hospital Confirmed"
  | "Appointment Scheduled"
  | "Travel Coordination in Progress"
  | "Completed"
  | "Rejected"
  // Lead pipeline (website → arrival)
  | "Lead - Step 1: Awaiting Email Verification"
  | "Lead - Step 2: Profile Completed"
  | "Lead - Step 3: Clinic Confirmation"
  | "Lead - Step 4: Travel Booked"
  | "Lead - Step 5: Awaiting Arrival"
  | "In Treatment";

export interface BookingSession {
  date: string;        // "2026-03-12"
  time: string;        // "09:00"
  durationMin: number; // 60
  title: string;       // "Consultation", "Blood Test", etc.
  doctorId: string;
  hospitalId: string;
  location?: string;   // address
}

export interface UploadedDocument {
  name: string;
  type: string;
  url: string;
  // AI content-verification result (PDFs only) — undefined means not yet checked.
  verified?: boolean;
  verifyReason?: string;
  verifySkipped?: boolean;
}

export interface BookingRequest {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  country: string;
  countryFlag?: string;
  procedureId: string;
  hospitalId?: string;
  preferredDateStart: string;
  preferredDateEnd: string;
  status: BookingStatus;
  uploadedFiles: UploadedDocument[];
  notes: string;
  createdAt: string;
  hospitalResponse?: {
    confirmedDate?: string;
    confirmedTime?: string;
    message?: string;
    status: "accepted" | "rejected" | "pending" | "more_info";
  };
  doctorId?: string;
  sessions?: BookingSession[];
  referralCode?: string;
  assignedPartnerId?: string | null;
  budget?: string;
  consultationLink?: string;
  consultationScheduledAt?: string;
}

export interface Doctor {
  id: string;
  name: string;
  hospitalId: string;
  specialty: string;
  avatar?: string;
}

export const countries = [
  "Russia", "Armenia", "Kazakhstan", "Germany", "Israel",
  "Australia", "United States", "China", "United Kingdom", "France",
  "UAE", "Saudi Arabia", "Ukraine", "Azerbaijan", "Canada", "India", "Turkey"
];

// ── Flight cost estimates: top 3 largest cities per country → Tbilisi (TBS) ──
// Round-trip, economy class, approximate USD ranges. Estimates only — actual
// fares vary by season, airline, and booking window.
export interface FlightEstimate {
  city: string;
  iata?: string; // nearest served airport code, for live price lookups
  priceMin: number;
  priceMax: number;
}

export const flightEstimates: Record<string, FlightEstimate[]> = {
  "Russia": [
    { city: "Moscow", iata: "MOW", priceMin: 150, priceMax: 280 },
    { city: "Saint Petersburg", iata: "LED", priceMin: 200, priceMax: 350 },
    { city: "Novosibirsk", iata: "OVB", priceMin: 300, priceMax: 450 },
  ],
  "Armenia": [
    { city: "Yerevan", iata: "EVN", priceMin: 80, priceMax: 150 },
    { city: "Gyumri", iata: "LWN", priceMin: 100, priceMax: 180 },
    { city: "Vanadzor", priceMin: 100, priceMax: 180 },
  ],
  "Kazakhstan": [
    { city: "Almaty", iata: "ALA", priceMin: 250, priceMax: 400 },
    { city: "Astana", iata: "NQZ", priceMin: 280, priceMax: 430 },
    { city: "Shymkent", iata: "CIT", priceMin: 300, priceMax: 450 },
  ],
  "Germany": [
    { city: "Berlin", iata: "BER", priceMin: 180, priceMax: 320 },
    { city: "Hamburg", iata: "HAM", priceMin: 220, priceMax: 400 },
    { city: "Munich", iata: "MUC", priceMin: 190, priceMax: 340 },
  ],
  "Israel": [
    { city: "Jerusalem", iata: "TLV", priceMin: 180, priceMax: 320 },
    { city: "Tel Aviv", iata: "TLV", priceMin: 150, priceMax: 300 },
    { city: "Haifa", iata: "HFA", priceMin: 200, priceMax: 350 },
  ],
  "Australia": [
    { city: "Sydney", iata: "SYD", priceMin: 900, priceMax: 1500 },
    { city: "Melbourne", iata: "MEL", priceMin: 950, priceMax: 1550 },
    { city: "Brisbane", iata: "BNE", priceMin: 1000, priceMax: 1600 },
  ],
  "United States": [
    { city: "New York", iata: "NYC", priceMin: 600, priceMax: 1000 },
    { city: "Los Angeles", iata: "LAX", priceMin: 750, priceMax: 1200 },
    { city: "Chicago", iata: "CHI", priceMin: 650, priceMax: 1050 },
  ],
  "China": [
    { city: "Shanghai", iata: "SHA", priceMin: 500, priceMax: 850 },
    { city: "Beijing", iata: "BJS", priceMin: 450, priceMax: 800 },
    { city: "Guangzhou", iata: "CAN", priceMin: 500, priceMax: 850 },
  ],
  "United Kingdom": [
    { city: "London", iata: "LON", priceMin: 220, priceMax: 400 },
    { city: "Birmingham", iata: "BHX", priceMin: 250, priceMax: 430 },
    { city: "Manchester", iata: "MAN", priceMin: 250, priceMax: 430 },
  ],
  "France": [
    { city: "Paris", iata: "PAR", priceMin: 220, priceMax: 400 },
    { city: "Marseille", iata: "MRS", priceMin: 260, priceMax: 440 },
    { city: "Lyon", iata: "LYS", priceMin: 260, priceMax: 440 },
  ],
  "UAE": [
    { city: "Dubai", iata: "DXB", priceMin: 180, priceMax: 320 },
    { city: "Abu Dhabi", iata: "AUH", priceMin: 190, priceMax: 330 },
    { city: "Sharjah", iata: "SHJ", priceMin: 170, priceMax: 300 },
  ],
  "Saudi Arabia": [
    { city: "Riyadh", iata: "RUH", priceMin: 280, priceMax: 450 },
    { city: "Jeddah", iata: "JED", priceMin: 300, priceMax: 470 },
    { city: "Mecca", iata: "JED", priceMin: 300, priceMax: 470 },
  ],
  "Ukraine": [
    { city: "Kyiv", iata: "IEV", priceMin: 150, priceMax: 280 },
    { city: "Kharkiv", iata: "HRK", priceMin: 180, priceMax: 320 },
    { city: "Odesa", iata: "ODS", priceMin: 180, priceMax: 320 },
  ],
  "Azerbaijan": [
    { city: "Baku", iata: "GYD", priceMin: 80, priceMax: 150 },
    { city: "Ganja", iata: "KVD", priceMin: 100, priceMax: 180 },
    { city: "Sumqayit", iata: "GYD", priceMin: 100, priceMax: 180 },
  ],
  "Canada": [
    { city: "Toronto", iata: "YTO", priceMin: 700, priceMax: 1150 },
    { city: "Montreal", iata: "YMQ", priceMin: 700, priceMax: 1150 },
    { city: "Vancouver", iata: "YVR", priceMin: 850, priceMax: 1350 },
  ],
  "India": [
    { city: "Mumbai", iata: "BOM", priceMin: 300, priceMax: 500 },
    { city: "Delhi", iata: "DEL", priceMin: 280, priceMax: 480 },
    { city: "Bangalore", iata: "BLR", priceMin: 350, priceMax: 550 },
  ],
  "Turkey": [
    { city: "Istanbul", iata: "IST", priceMin: 100, priceMax: 200 },
    { city: "Ankara", iata: "ESB", priceMin: 130, priceMax: 230 },
    { city: "Izmir", iata: "ADB", priceMin: 150, priceMax: 260 },
  ],
};

export const procedures: Procedure[] = [
  // ── I. Cardiology ────────────────────────────────────────────────────
  {
    id: "p-cabg", name: "Cardiac Bypass Surgery (CABG)", category: "Cardiology",
    description: "Coronary artery bypass grafting to restore blood flow to the heart using vessels from other parts of the body.",
    priceRange: "$2,000 – $3,000", priceMin: 2000, priceMax: 3000, avgCost: "~$2,500",
    hospitalizationDays: "5–10 days", minStayDays: 14,
    duration: "4–6 hours", recoveryTime: "6–8 weeks",
    requiredDocuments: ["Passport", "Cardiac ECG", "Echocardiography Report", "Blood Test Results", "Medical History"],
    optionalDocuments: ["Previous Cardiac Records", "Medication List"],
  },
  {
    id: "p-stent", name: "Coronary Stenting", category: "Cardiology",
    description: "Minimally invasive procedure to open blocked arteries and improve blood flow to the heart.",
    priceRange: "$2,500 – $6,000+", priceMin: 2500, priceMax: 6000, avgCost: "~$4,250",
    hospitalizationDays: "5–10 days", minStayDays: 12,
    duration: "1–2 hours", recoveryTime: "2–4 weeks",
    requiredDocuments: ["Passport", "Cardiac ECG", "Coronary Angiography", "Blood Test Results"],
    optionalDocuments: ["Previous Cardiac Records", "Medication List"],
  },
  {
    id: "p-valve", name: "Heart Valve Plasty", category: "Cardiology",
    description: "Surgical repair or replacement of heart valves; complexity and price depend on the extent of the intervention.",
    priceRange: "$9,500 – $16,000", priceMin: 9500, priceMax: 16000, avgCost: "~$12,750",
    hospitalizationDays: "5–10 days", minStayDays: 18,
    duration: "3–5 hours", recoveryTime: "6–12 weeks",
    requiredDocuments: ["Passport", "Cardiac ECG", "Echocardiography Report", "Blood Test Results", "Medical History"],
    optionalDocuments: ["Previous Cardiac Records", "Medication List"],
  },
  // ── I. Orthopedics ───────────────────────────────────────────────────
  {
    id: "p-knee", name: "Knee Replacement (Partial)", category: "Orthopedics",
    description: "Partial knee endoprosthetics — replacing damaged compartment of the knee joint with a prosthesis.",
    priceRange: "~$3,500", priceMin: 3000, priceMax: 4000, avgCost: "~$3,500",
    hospitalizationDays: "3–5 days", minStayDays: 10,
    duration: "1.5–2 hours", recoveryTime: "4–6 weeks",
    requiredDocuments: ["Passport", "Knee MRI", "Blood Test Results", "Medical History"],
    optionalDocuments: ["Physical Therapy Records", "Previous Knee X-Ray"],
  },
  {
    id: "p-hip", name: "Hip Replacement (Full)", category: "Orthopedics",
    description: "Total hip endoprosthetics — replacing the hip joint with a high-quality prosthesis for pain-free mobility.",
    priceRange: "~$8,500", priceMin: 7500, priceMax: 9500, avgCost: "~$8,500",
    hospitalizationDays: "3–5 days", minStayDays: 12,
    duration: "2–3 hours", recoveryTime: "6–12 weeks",
    requiredDocuments: ["Passport", "Hip X-Ray / MRI", "Blood Test Results", "Medical History"],
    optionalDocuments: ["Physical Therapy Records"],
  },
  // ── I. Oncology ──────────────────────────────────────────────────────
  {
    id: "p-chemo", name: "Chemotherapy (per cycle)", category: "Oncology",
    description: "Systemic cancer treatment; cost per cycle depends on the drug protocol prescribed by the oncologist.",
    priceRange: "$1,000 – $3,500", priceMin: 1000, priceMax: 3500, avgCost: "~$2,250",
    hospitalizationDays: "1–3 days per cycle", minStayDays: 5,
    duration: "3–8 hours per session", recoveryTime: "1–2 weeks per cycle",
    requiredDocuments: ["Passport", "Oncology Diagnosis Report", "Blood Test Results", "Medical History"],
    optionalDocuments: ["Previous Treatment Records", "Pathology Results"],
  },
  {
    id: "p-radiation", name: "Radiation Therapy", category: "Oncology",
    description: "High-precision radiotherapy for cancer treatment using linear accelerators.",
    priceRange: "$5,000 – $12,000", priceMin: 5000, priceMax: 12000, avgCost: "~$8,500",
    hospitalizationDays: "Outpatient (daily sessions)", minStayDays: 21,
    duration: "15–30 min per session", recoveryTime: "2–6 weeks",
    requiredDocuments: ["Passport", "Oncology Diagnosis Report", "CT / MRI Scan", "Medical History"],
    optionalDocuments: ["Previous Radiation Records", "Pathology Results"],
  },
  {
    id: "p-mastectomy", name: "Mastectomy (Surgical Oncology)", category: "Oncology",
    description: "Surgical removal of breast tissue for cancer treatment, performed by oncological surgeons.",
    priceRange: "$3,500 – $6,500", priceMin: 3500, priceMax: 6500, avgCost: "~$5,000",
    hospitalizationDays: "~4 days", minStayDays: 10,
    duration: "2–4 hours", recoveryTime: "3–6 weeks",
    requiredDocuments: ["Passport", "Biopsy/Pathology Report", "Mammography", "Blood Test Results"],
    optionalDocuments: ["Genetic Testing Results", "Previous Treatment Records"],
  },
  {
    id: "p-abdominal", name: "Complex Abdominal Surgery", category: "Oncology",
    description: "Major abdominal oncological operations including liver, colon, or pancreatic surgeries.",
    priceRange: "$15,000 – $27,000", priceMin: 15000, priceMax: 27000, avgCost: "~$21,000",
    hospitalizationDays: "10–21 days", minStayDays: 28,
    duration: "3–8 hours", recoveryTime: "6–12 weeks",
    requiredDocuments: ["Passport", "Oncology Diagnosis Report", "CT / MRI Scan", "Blood Test Results", "Medical History"],
    optionalDocuments: ["Pathology Results", "Previous Surgery Records"],
  },
  // ── I. Diagnostics ───────────────────────────────────────────────────
  {
    id: "p-ct", name: "CT Scan", category: "Diagnostics",
    description: "Computed tomography imaging — fast, detailed cross-sectional images for diagnosis. No hospitalization required.",
    priceRange: "$100 – $300", priceMin: 100, priceMax: 300, avgCost: "~$200",
    hospitalizationDays: "No hospitalization", minStayDays: 1,
    duration: "30–60 min", recoveryTime: "None",
    requiredDocuments: ["Passport", "Medical History"],
    optionalDocuments: ["Previous Imaging", "Referral Letter"],
  },
  {
    id: "p-mri", name: "MRI Scan", category: "Diagnostics",
    description: "Magnetic resonance imaging providing detailed soft-tissue visualization. No hospitalization required.",
    priceRange: "$150 – $450", priceMin: 150, priceMax: 450, avgCost: "~$300",
    hospitalizationDays: "No hospitalization", minStayDays: 1,
    duration: "30–90 min", recoveryTime: "None",
    requiredDocuments: ["Passport", "Medical History"],
    optionalDocuments: ["Previous Imaging", "Referral Letter"],
  },
  {
    id: "p-petct", name: "PET-CT Scan", category: "Diagnostics",
    description: "Combination positron emission tomography and CT for precise oncology and cardiology diagnostics.",
    priceRange: "$1,500 – $2,000", priceMin: 1500, priceMax: 2000, avgCost: "~$1,750",
    hospitalizationDays: "No hospitalization", minStayDays: 1,
    duration: "2–3 hours", recoveryTime: "None",
    requiredDocuments: ["Passport", "Oncology/Cardiology Referral", "Medical History"],
    optionalDocuments: ["Previous PET-CT Results"],
  },
  // ── II. Reproductive Health ──────────────────────────────────────────
  {
    id: "p-ivf", name: "IVF — Own Biological Material", category: "Reproductive Health",
    description: "In vitro fertilization using the patient's own eggs and sperm. High success rates with personalized protocols.",
    priceRange: "$3,000 – $6,000 per cycle", priceMin: 3000, priceMax: 6000, avgCost: "~$4,500",
    hospitalizationDays: "Outpatient", minStayDays: 7,
    duration: "1 week – several months", recoveryTime: "1–2 days",
    requiredDocuments: ["Passport", "Hormonal Panel", "Ultrasound Results", "Blood Test Results"],
    optionalDocuments: ["Previous IVF Records", "Partner Medical Records", "Genetic Testing"],
  },
  {
    id: "p-ivf-genetic", name: "IVF with Full Genetic Screening (PGT)", category: "Reproductive Health",
    description: "IVF with preimplantation genetic testing — recommended for recurrent miscarriages or genetic conditions.",
    priceRange: "$2,000 – $4,500", priceMin: 2000, priceMax: 4500, avgCost: "~$3,250",
    hospitalizationDays: "Outpatient", minStayDays: 7,
    duration: "1–2 weeks", recoveryTime: "1–2 days",
    requiredDocuments: ["Passport", "Hormonal Panel", "Ultrasound Results", "Genetic Consultation Report"],
    optionalDocuments: ["Previous IVF Records", "Partner Genetic Test"],
  },
  {
    id: "p-donation", name: "Egg Donation", category: "Reproductive Health",
    description: "Egg donation program with thorough donor screening and matching. Duration set by treating physician.",
    priceRange: "$6,000 – $9,500", priceMin: 6000, priceMax: 9500, avgCost: "~$7,750",
    hospitalizationDays: "Outpatient", minStayDays: 7,
    duration: "1 week – 1 month", recoveryTime: "2–5 days",
    requiredDocuments: ["Passport", "Hormonal Panel", "Ultrasound Results", "Medical History"],
    optionalDocuments: ["Genetic Testing", "Partner Medical Records"],
  },
  {
    id: "p-surrogacy-std", name: "Surrogacy (Standard)", category: "Reproductive Health",
    description: "Standard surrogacy program with legal support, surrogate selection, and full medical coordination.",
    priceRange: "$35,000 – $55,000", priceMin: 35000, priceMax: 55000, avgCost: "~$45,000",
    hospitalizationDays: "Outpatient visits", minStayDays: 7,
    duration: "1 week – 1 month (initial visit)", recoveryTime: "N/A",
    requiredDocuments: ["Passport", "Hormonal Panel", "Medical History", "Legal Documentation"],
    optionalDocuments: ["Genetic Testing", "Partner Medical Records"],
  },
  {
    id: "p-surrogacy-guar", name: "Surrogacy (Guaranteed Package)", category: "Reproductive Health",
    description: "Guaranteed surrogacy package — includes multiple embryo transfers until a successful birth is achieved.",
    priceRange: "$65,000 – $80,000", priceMin: 65000, priceMax: 80000, avgCost: "~$72,500",
    hospitalizationDays: "Outpatient visits", minStayDays: 7,
    duration: "Ongoing coordination", recoveryTime: "N/A",
    requiredDocuments: ["Passport", "Hormonal Panel", "Medical History", "Legal Documentation"],
    optionalDocuments: ["Genetic Testing", "Partner Medical Records"],
  },
  // ── III. Aesthetic Medicine ──────────────────────────────────────────
  {
    id: "p-hair", name: "Hair Transplant (FUE / DHI)", category: "Aesthetic Medicine",
    description: "Follicular unit extraction or direct hair implantation. Price depends on number of grafts ($2–$3.5 per graft).",
    priceRange: "$1,500 – $5,000+", priceMin: 1500, priceMax: 5000, avgCost: "~$3,000",
    hospitalizationDays: "No hospitalization", minStayDays: 3,
    duration: "6–10 hours", recoveryTime: "7–14 days",
    requiredDocuments: ["Passport", "Blood Test Results"],
    optionalDocuments: ["Scalp Photos", "Previous Treatment Records"],
  },
  {
    id: "p-rhino", name: "Rhinoplasty (Nose Surgery)", category: "Aesthetic Medicine",
    description: "Nose reshaping by certified plastic surgeons. Visit: 5–14 days for post-op check-up. No hospitalization.",
    priceRange: "$2,000 – $5,500", priceMin: 2000, priceMax: 5500, avgCost: "~$3,750",
    hospitalizationDays: "No hospitalization", minStayDays: 10,
    duration: "2–3 hours", recoveryTime: "2–3 weeks",
    requiredDocuments: ["Passport", "Blood Test Results"],
    optionalDocuments: ["Photos", "Previous Surgery Records"],
  },
  {
    id: "p-bariatric", name: "Bariatric Surgery", category: "Aesthetic Medicine",
    description: "Weight loss surgery ranging from intragastric balloon (outpatient) to sleeve gastrectomy (4-day stay).",
    priceRange: "$2,800 – $7,500", priceMin: 2800, priceMax: 7500, avgCost: "~$5,150",
    hospitalizationDays: "0–4 days", minStayDays: 7,
    duration: "1–3 hours", recoveryTime: "1–4 weeks",
    requiredDocuments: ["Passport", "Blood Test Results", "Medical History", "Nutritional Assessment"],
    optionalDocuments: ["Endoscopy Report", "Psychological Assessment"],
  },
  {
    id: "p-injectable", name: "Injectable Aesthetics (Botox / Fillers / Threads)", category: "Aesthetic Medicine",
    description: "Non-surgical treatments: Botox $100–$260, Fillers $130–$500, Biorevitalization $50–$250, Threads $250–$700. No hospitalization.",
    priceRange: "$50 – $700", priceMin: 50, priceMax: 700, avgCost: "~$300",
    hospitalizationDays: "No hospitalization", minStayDays: 2,
    duration: "30–90 minutes", recoveryTime: "2–7 days",
    requiredDocuments: ["Passport"],
    optionalDocuments: ["Allergy Report", "Previous Aesthetic Procedure Records"],
  },
  // ── IV. Dental ───────────────────────────────────────────────────────
  {
    id: "p-implant", name: "Dental Implants (Premium)", category: "Dental",
    description: "Premium implant placement with internationally certified materials. Per-implant pricing.",
    priceRange: "$800 – $1,300 per implant", priceMin: 800, priceMax: 1300, avgCost: "~$1,050",
    hospitalizationDays: "No hospitalization", minStayDays: 5,
    duration: "1–2 hours per implant", recoveryTime: "3–6 months (osseointegration)",
    requiredDocuments: ["Passport", "Dental X-Ray / Panoramic", "Medical History"],
    optionalDocuments: ["Previous Dental Records", "Allergy Report"],
  },
  {
    id: "p-allon4", name: "All-on-4 / All-on-6 Implants", category: "Dental",
    description: "Full arch restoration on 4 or 6 implants — same-day teeth for fully edentulous patients.",
    priceRange: "$3,500 – $8,500", priceMin: 3500, priceMax: 8500, avgCost: "~$6,000",
    hospitalizationDays: "No hospitalization", minStayDays: 7,
    duration: "4–6 hours", recoveryTime: "2–6 months",
    requiredDocuments: ["Passport", "Panoramic X-Ray / CT", "Medical History"],
    optionalDocuments: ["Previous Dental Records"],
  },
  {
    id: "p-smile", name: "Hollywood Smile", category: "Dental",
    description: "Full aesthetic dental restoration with veneers and zirconia-ceramic crowns.",
    priceRange: "$6,000 – $12,000", priceMin: 6000, priceMax: 12000, avgCost: "~$9,000",
    hospitalizationDays: "No hospitalization", minStayDays: 10,
    duration: "Multiple sessions", recoveryTime: "1–2 weeks",
    requiredDocuments: ["Passport", "Dental X-Ray", "Medical History"],
    optionalDocuments: ["Smile Design Photos"],
  },
  // ── V. Balneological & Rehabilitation ────────────────────────────────
  {
    id: "p-balneo", name: "Balneological & Rehabilitation Treatment", category: "Balneology & Rehab",
    description: "Medical spa and rehabilitation programs. Day treatment from $100; full 14–21 day package $1,500–$2,800.",
    priceRange: "$100 – $2,800", priceMin: 100, priceMax: 2800, avgCost: "~$1,500",
    hospitalizationDays: "Residential stay 14–21 days", minStayDays: 14,
    duration: "14–21 days", recoveryTime: "None",
    requiredDocuments: ["Passport", "Medical History"],
    optionalDocuments: ["Previous Treatment Records", "Specialist Referral"],
  },
];

export const hospitals: Hospital[] = [
  {
    id: "h1", name: "Leadermed",
    city: "Tbilisi", rating: 4.8, reviewCount: 320,
    specialties: ["Gynecology", "Plastic Surgery", "In Vitro Fertilization"],
    accreditations: ["ISO 9001"],
    address: "14 Tsinamdzghvrishvili St, Tbilisi 0179, Georgia",
    mapEmbedUrl: "https://www.openstreetmap.org/export/embed.html?bbox=44.75%2C41.69%2C44.85%2C41.73&layer=mapnik&marker=41.714%2C44.794",
    description: "Leadermed is one of Tbilisi's premier specialized clinics, offering internationally recognized standards of care across reproductive medicine, aesthetic surgery, and women's health. Founded by a team of highly qualified specialists trained in leading European institutions, the clinic integrates state-of-the-art diagnostic equipment with a deeply personalized approach to patient care. The IVF laboratory operates under strict embryological protocols with success rates that consistently exceed the European average. The aesthetic surgery department is led by board-certified plastic surgeons who combine technical precision with an artistic eye for natural-looking results. Every patient receives a customized treatment plan developed through a multidisciplinary team review.",
    services: [
      { category: "Reproductive Medicine", items: ["IVF (In Vitro Fertilization)", "ICSI procedure", "Embryo cryopreservation", "Preimplantation genetic testing", "Egg donation programme", "Hormonal panel diagnostics"] },
      { category: "Gynecology", items: ["Laparoscopic surgery", "Hysteroscopy", "Colposcopy", "Cervical biopsy", "Polycystic ovary treatment", "Endometriosis management"] },
      { category: "Plastic Surgery", items: ["Rhinoplasty", "Breast augmentation", "Abdominoplasty", "Blepharoplasty", "Liposuction", "Facelift"] },
      { category: "Diagnostics", items: ["Ultrasound (3D/4D)", "Colposcopy", "Full hormonal bloodwork", "Genetic testing", "Pelvic MRI"] },
    ],
    faq: [
      { question: "Do you offer IVF for international patients?", answer: "Yes. We have a dedicated international patient coordinator who assists with travel planning, treatment scheduling, and translation services. We have treated patients from over 30 countries." },
      { question: "How long does an IVF cycle take?", answer: "A standard IVF cycle takes approximately 3–5 weeks from the start of stimulation to the embryo transfer. We can tailor timelines for patients travelling from abroad." },
      { question: "Is plastic surgery consultation available in English?", answer: "Yes. Our plastic surgeons and patient coordinators communicate fluently in English, Russian, and Georgian. Interpretation into other languages can be arranged upon request." },
      { question: "What documents do I need to bring?", answer: "For IVF: hormone panel results, pelvic ultrasound, and a complete medical history. For plastic surgery: pre-op blood work and any relevant previous medical records. We can advise you in detail after an initial online consultation." },
    ],
    reviews: [
      { name: "Sarah M.", country: "United Kingdom", flag: "🇬🇧", rating: 5, text: "I had my IVF treatment at Leadermed and the experience was truly life-changing. The embryologists were incredibly precise and the whole team was warm and supportive throughout every step. I'm now 8 weeks pregnant. Cannot thank them enough." },
      { name: "Aisha K.", country: "UAE", flag: "🇦🇪", rating: 5, text: "Flew from Dubai specifically for the gynaecology consultation. The doctor spent over an hour with me, explained everything in detail, and the diagnosis was spot on. Clinic is very clean and modern. Highly recommend." },
      { name: "Natalia V.", country: "Ukraine", flag: "🇺🇦", rating: 4, text: "Had rhinoplasty here. The surgeon was experienced and honest about expectations. Recovery was smooth and the follow-up care was excellent. Results are natural-looking and exactly what I wanted." },
    ],
    contactEmail: "info@leadermed.ge",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "h2", name: "Todua Clinic",
    city: "Tbilisi", rating: 4.9, reviewCount: 542,
    specialties: ["Oncology", "Radiology", "Surgery", "Cardiology"],
    accreditations: ["ISO 9001"],
    address: "29 Tseretheli Ave, Tbilisi 0154, Georgia",
    mapEmbedUrl: "https://www.openstreetmap.org/export/embed.html?bbox=44.76%2C41.70%2C44.82%2C41.74&layer=mapnik&marker=41.720%2C44.790",
    description: "Todua Clinic stands as Georgia's most comprehensive multi-profile medical center, anchored by a world-class oncology and radiology department. Equipped with a PET/CT scanner, a CyberKnife radiosurgery system, and a full nuclear medicine unit, the clinic delivers cancer diagnostics and treatment at a level comparable to leading European institutions — at a fraction of the cost. The oncology team works in true multidisciplinary fashion: radiologists, medical oncologists, surgeons, and pathologists review every complex case together before a treatment plan is finalized. The cardiology wing offers catheterization laboratory services and minimally invasive cardiac interventions. International patients receive a dedicated case manager and full English-language medical documentation.",
    services: [
      { category: "Oncology", items: ["PET/CT scanning", "CyberKnife radiosurgery", "Medical oncology consultations", "Biopsy & histopathology", "Chemotherapy administration", "Tumour board case review"] },
      { category: "Radiology & Imaging", items: ["3-Tesla MRI", "64-slice CT scan", "Digital X-Ray", "Interventional radiology", "Nuclear medicine scans", "Mammography"] },
      { category: "Cardiology", items: ["Echocardiography", "Coronary angiography", "Cardiac catheterization", "Holter monitoring", "Stress ECG", "Arrhythmia management"] },
      { category: "Surgery", items: ["Laparoscopic surgery", "Robotic-assisted procedures", "General surgery", "Thoracic surgery", "Day surgery unit"] },
    ],
    faq: [
      { question: "Can I get a second opinion on a cancer diagnosis?", answer: "Yes. Our oncology team specializes in reviewing cases from abroad. You can send your scans and pathology reports digitally and we will provide a full written assessment within 3–5 business days." },
      { question: "How quickly can a PET/CT scan be arranged?", answer: "For international patients we typically schedule a PET/CT within 1–3 days of arrival. We require a referral from your treating physician or oncologist." },
      { question: "Do you offer treatment packages for international patients?", answer: "Yes. We offer all-inclusive packages that cover consultation, diagnostics, treatment, and follow-up, coordinated by a dedicated international patient manager." },
      { question: "Is the clinic accessible for patients with limited mobility?", answer: "The clinic is fully wheelchair accessible with dedicated elevators, ramps, and patient transport services available on request." },
    ],
    contactEmail: "info@toduaclinic.ge",
    image: "https://toduaclinic.ge/storage/photos/3/64e86adea8b2e.jpg",
    reviews: [
      { name: "David L.", country: "Israel", flag: "🇮🇱", rating: 5, text: "My father came here after being told by three hospitals in Israel that his cancer was inoperable. The oncology team at Todua re-evaluated his case and performed a targeted radiosurgery. Six months later his tumour has shrunk significantly. The level of care is world-class." },
      { name: "Elena R.", country: "Russia", flag: "🇷🇺", rating: 5, text: "PET/CT scanning done same day, results explained thoroughly by a specialist. No waiting, no bureaucracy. In Moscow this would have taken weeks. The radiologists here are outstanding professionals." },
      { name: "Mohammed F.", country: "Saudi Arabia", flag: "🇸🇦", rating: 5, text: "Came for a second opinion on cardiac surgery. The cardiologist reviewed all my previous scans and provided a detailed alternative treatment plan. Very knowledgeable team who treat every patient with dignity. Price was a fraction of what we were quoted in Germany." },
    ],
  },
  {
    id: "h3", name: "New Hospitals",
    city: "Tbilisi", rating: 4.7, reviewCount: 310,
    specialties: ["Ophthalmology", "Cardiac Surgery", "Pediatrics", "Neurology"],
    accreditations: ["ISO 9001"],
    address: "13 Pekini Ave, Tbilisi 0160, Georgia",
    mapEmbedUrl: "https://www.openstreetmap.org/export/embed.html?bbox=44.77%2C41.71%2C44.83%2C41.75&layer=mapnik&marker=41.730%2C44.800",
    description: "New Hospitals is a 264-bed private multi-profile medical center built to European construction and equipment standards, designed to serve both local and international patients across a broad spectrum of specialties. The ophthalmology unit is equipped with the ZEISS VisuMax laser platform for refractive and corneal surgeries, while the cardiac surgery theatre performs open-heart and minimally invasive valve procedures. The dedicated paediatric ward features child-friendly design, separate medical staff, and 24-hour parental access. The neurology department operates an advanced epilepsy monitoring unit and provides comprehensive stroke care with a fast-track admission protocol. All inpatient rooms have private bathrooms and are equipped with patient entertainment systems.",
    services: [
      { category: "Ophthalmology", items: ["LASIK laser vision correction", "Cataract surgery (phacoemulsification)", "Retinal detachment surgery", "Glaucoma treatment", "Corneal transplant", "Paediatric ophthalmology"] },
      { category: "Cardiac Surgery", items: ["Open-heart surgery", "Coronary artery bypass grafting (CABG)", "Valve repair & replacement", "Minimally invasive cardiac surgery", "Pacemaker implantation", "Post-operative cardiac rehab"] },
      { category: "Pediatrics", items: ["Neonatal intensive care", "Paediatric surgery", "Child neurology", "Vaccinations", "Growth & development consultations", "Paediatric cardiology"] },
      { category: "Neurology", items: ["Stroke assessment & treatment", "Epilepsy monitoring (EEG)", "Brain MRI & fMRI", "Multiple sclerosis management", "Parkinson's disease care", "Headache clinic"] },
    ],
    faq: [
      { question: "How do I arrange paediatric surgery from abroad?", answer: "Contact our international patient office with your child's medical records and we will organize a remote consultation within 48 hours. Emergency cases are given highest priority." },
      { question: "Is LASIK available for patients over 50?", answer: "Yes, depending on the corneal thickness and overall eye health. Our ophthalmologists will perform a full preoperative assessment to determine suitability before recommending any procedure." },
      { question: "Can a companion stay with me during my hospital stay?", answer: "Yes. All private rooms accommodate one accompanying person. We provide a fold-out bed, meals, and private bathroom for companions at no additional charge." },
      { question: "Do you provide airport transfers for international patients?", answer: "Yes. We offer a complimentary airport pickup service for international patients admitted for surgery or extended inpatient treatment." },
    ],
    contactEmail: "info@newhospitals.ge",
    image: "https://www.newhospitals.ge/res/upload/news/b5a94534ded6822912fe7953ea6be130.png",
    reviews: [
      { name: "Thomas B.", country: "Germany", flag: "🇩🇪", rating: 5, text: "My son needed urgent paediatric surgery and we were desperate. New Hospitals accepted us within 48 hours, the paediatric surgeon was exceptional. The nurses took care of my son around the clock and communicated in English throughout. We are very grateful." },
      { name: "Yuki T.", country: "Japan", flag: "🇯🇵", rating: 4, text: "Had cataract surgery on both eyes. The ophthalmology department uses the latest phacoemulsification technology. Very impressed with the precision and the aftercare instructions were thorough. Vision is now 100%." },
      { name: "Irina S.", country: "Kazakhstan", flag: "🇰🇿", rating: 5, text: "Neurology consultation for chronic migraines. The neurologist ordered an MRI on the same visit and discussed the results immediately. Finally received a proper diagnosis after years of suffering. The clinic is well-organized and the staff are very professional." },
    ],
  },
  {
    id: "h4", name: "S. Khechinashvili University Clinic",
    city: "Tbilisi", rating: 4.6, reviewCount: 280,
    specialties: ["Traumatology", "Otorhinolaryngology", "Urology", "Cardiology"],
    accreditations: ["National Accreditation"],
    address: "5 Bodbeli St, Tbilisi 0141, Georgia",
    mapEmbedUrl: "https://www.openstreetmap.org/export/embed.html?bbox=44.78%2C41.69%2C44.84%2C41.73&layer=mapnik&marker=41.710%2C44.810",
    description: "S. Khechinashvili University Clinic is one of Georgia's oldest and most respected academic medical centers, combining decades of clinical experience with modern diagnostic and surgical infrastructure. The traumatology department manages complex fractures, ligament reconstructions, and spinal injuries, serving as the regional reference center for orthopaedic trauma. The ENT (otorhinolaryngology) unit offers full endoscopic sinus surgery, cochlear implantation assessment, and voice disorder treatment. Urology covers the entire spectrum from minimally invasive stone fragmentation (ESWL) to laparoscopic radical prostatectomy. The cardiology department features an electrophysiology laboratory for arrhythmia ablation, supported by a dedicated coronary care unit. The clinic's academic affiliation ensures continuous staff development and access to the latest evidence-based protocols.",
    services: [
      { category: "Traumatology & Orthopaedics", items: ["Complex fracture surgery", "Knee ligament reconstruction (ACL/PCL)", "Hip & knee replacement", "Spinal surgery", "Sports medicine consultations", "Post-operative physiotherapy"] },
      { category: "ENT (Ear, Nose & Throat)", items: ["Endoscopic sinus surgery (FESS)", "Tonsillectomy & adenoidectomy", "Cochlear implant assessment", "Vocal cord microsurgery", "Hearing aids fitting", "Thyroid & parathyroid surgery"] },
      { category: "Urology", items: ["ESWL kidney stone fragmentation", "Laparoscopic prostatectomy", "Cystoscopy", "Urological oncology", "Bladder reconstruction", "Incontinence treatment"] },
      { category: "Cardiology", items: ["Holter monitoring", "Electrophysiology studies", "Arrhythmia ablation", "Pacemaker implantation", "Coronary angiography", "Heart failure management"] },
    ],
    faq: [
      { question: "Do you treat sports injuries for professional athletes?", answer: "Yes. Our traumatology team has extensive experience managing elite sports injuries including ACL tears, meniscus damage, and rotator cuff repairs, with tailored rehabilitation programmes." },
      { question: "How long is recovery after laparoscopic prostate surgery?", answer: "Most patients are discharged within 3–5 days and can return to light activities within 2 weeks. Full recovery typically takes 4–6 weeks. We provide detailed aftercare instructions and remote follow-up consultation." },
      { question: "Can you perform cochlear implant surgery?", answer: "We carry out the full assessment, candidacy determination, and implantation procedure. Our ENT team collaborates with European cochlear implant programmes and can source implants from major manufacturers." },
      { question: "Is interpretation available for non-Georgian patients?", answer: "Yes. English and Russian interpretation is available throughout the consultation and treatment process. Other language interpreters can be arranged with advance notice." },
    ],
    contactEmail: "info@khechinashvili.ge",
    image: "https://newshub.ge/uploads/files/2020/06/24/5958/khechinashvilis-klinika_w_h.jpeg",
    reviews: [
      { name: "Artem P.", country: "Ukraine", flag: "🇺🇦", rating: 5, text: "Had knee ligament reconstruction surgery here after a sports injury. The traumatology team was top-notch. The surgeon showed me exactly what he planned to do using 3D imaging before the operation. Recovery with the physio team was faster than expected." },
      { name: "Caroline W.", country: "France", flag: "🇫🇷", rating: 4, text: "ENT specialist diagnosed my chronic sinusitis within one appointment and scheduled surgery for the following week. The procedure was minimally invasive and I returned to normal life in five days. Very reasonable cost compared to France." },
      { name: "Omar H.", country: "Azerbaijan", flag: "🇦🇿", rating: 5, text: "Prostate surgery done laparoscopically. No complications, minimal hospital stay, the urologist communicated everything clearly. The nursing staff were attentive and kind. Very satisfied with the outcome." },
    ],
  },
  {
    id: "h5", name: "Mardaleishvili Medical Center",
    city: "Tbilisi", rating: 4.8, reviewCount: 390,
    specialties: ["Oncology", "Head and Neck Surgery", "Cellular Therapy"],
    accreditations: ["ISO 9001"],
    address: "4 Vazha-Pshavela Ave, Tbilisi 0186, Georgia",
    mapEmbedUrl: "https://www.openstreetmap.org/export/embed.html?bbox=44.74%2C41.72%2C44.80%2C41.76&layer=mapnik&marker=41.740%2C44.770",
    description: "Mardaleishvili Medical Center has built an international reputation as the foremost institution in the Caucasus region for complex oncological and head & neck surgical procedures. The center was founded by Professor Mardaleishvili, a pioneer in cryosurgical techniques in Georgia, and continues to advance the field through cellular and gene therapy research programmes conducted in partnership with European academic institutions. The surgical team performs over 1,200 oncological operations annually, including radical neck dissections, parotidectomies, thyroid and parathyroid surgeries, and laryngeal reconstructions. The center's cellular therapy unit applies autologous stem cell and dendritic cell therapies under strict GMP-compliant laboratory conditions, offering patients access to innovative treatments not yet widely available in Western Europe. A multidisciplinary tumour board meets weekly to review all complex cases.",
    services: [
      { category: "Head & Neck Oncology", items: ["Radical neck dissection", "Parotid gland surgery", "Thyroid & parathyroid surgery", "Laryngeal reconstruction", "Mandibular resection & reconstruction", "Salivary gland tumour surgery"] },
      { category: "Cryosurgery & Laser", items: ["Skin tumour cryodestruction", "CO₂ laser resection", "Laser vocal cord surgery", "Cryosurgery for oral lesions", "Palliative laser debulking"] },
      { category: "Cellular Therapy", items: ["Autologous stem cell therapy", "Dendritic cell immunotherapy", "NK cell therapy", "CAR-T cell therapy (selected cases)", "Bone marrow aspiration & processing"] },
      { category: "Diagnostics & Staging", items: ["Ultrasound-guided fine needle biopsy", "PET/CT referral coordination", "Histopathology & immunohistochemistry", "Second opinion case review", "Genetic tumour profiling"] },
    ],
    faq: [
      { question: "Can I send my medical records for remote review?", answer: "Yes. Our tumour board reviews cases submitted digitally. Send your pathology reports, imaging (DICOM files preferred), and clinical history to our international office and we will respond with a recommendation within 5 working days." },
      { question: "What is cellular therapy and who qualifies?", answer: "Cellular therapy uses the patient's own immune cells, modified and amplified in the laboratory, to target cancer cells. It is offered to patients with solid tumours who have exhausted standard treatment options or as a complement to conventional therapy." },
      { question: "How many oncological surgeries do you perform per year?", answer: "The surgical team performs over 1,200 oncological procedures annually, with a particular focus on head and neck surgeries. Long-term outcome data is available upon request." },
      { question: "Is accommodation assistance available for international patients?", answer: "Yes. We partner with nearby apartments and hotel services to provide affordable accommodation for patients and their families during treatment, coordinated through our patient services office." },
    ],
    contactEmail: "info@mardaleishvili.ge",
    image: "https://www.autism-mmc.com/wp-content/uploads/2019/05/15665504_1265361300186928_8764551076933791309_n.jpg",
    reviews: [
      { name: "Miriam G.", country: "Germany", flag: "🇩🇪", rating: 5, text: "My husband was diagnosed with thyroid cancer. We chose Mardaleishvili after extensive research and it was the right decision. The head and neck surgeon is one of the best I have encountered anywhere in Europe. The laser surgery left almost no scar and recovery was smooth." },
      { name: "Timur A.", country: "Kazakhstan", flag: "🇰🇿", rating: 5, text: "Came for cellular therapy as a last resort after conventional treatment failed. The team was honest, explained the procedure risks clearly, and the results three months later have been genuinely remarkable. Staff feel like family." },
      { name: "Patricia H.", country: "United States", flag: "🇺🇸", rating: 5, text: "I was quoted $95,000 for the same procedure in Arizona. Mardaleishvili did it for a fraction of the cost with no compromise in quality. The clinic is modern, the doctors speak excellent English and the outcome exceeded my expectations." },
    ],
  },
  {
    id: "h6", name: "Premium Medservice",
    city: "Tbilisi", rating: 4.7, reviewCount: 210,
    specialties: ["Proctology", "Dermatology", "Endocrinology", "Pediatrics"],
    reviews: [
      { name: "Lena M.", country: "Russia", flag: "🇷🇺", rating: 5, text: "Visited the endocrinology department for thyroid problems. The doctor was very thorough and ordered a full hormonal panel. The treatment plan she prescribed has made a huge difference to my quality of life. Friendly clinic, no long waits." },
      { name: "Selin A.", country: "Turkey", flag: "🇹🇷", rating: 5, text: "Brought my daughter for a paediatric check-up. The doctor was incredibly patient with her and explained everything to us parents clearly. The children's area is welcoming and child-friendly. Highly recommend for families." },
    ],
    accreditations: ["National Accreditation"],
    description: "Premium Medservice is a multi-disciplinary clinic dedicated to providing high-quality diagnostic and treatment services across multiple medical specialties, emphasizing patient care and safety.",
    contactEmail: "info@premiummed.ge",
    image: "https://images.unsplash.com/photo-1519494080410-f9aa76cb4283?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "h7", name: "Enmedici",
    city: "Tbilisi", rating: 4.8, reviewCount: 265,
    specialties: ["Endocrinology", "Gynecology", "Ophthalmology", "Dentistry"],
    accreditations: ["ISO 9001"],
    description: "Enmedici Clinic specializes in endocrinology and comprehensive multi-profile medical care, bringing together experienced specialists to offer advanced diagnostic and therapeutic solutions.",
    contactEmail: "info@enmedici.ge",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "h8", name: "Innova Medical Center",
    city: "Tbilisi", rating: 4.7, reviewCount: 156,
    specialties: ["Traumatology", "General Surgery", "Gynecology", "Orthopedics"],
    accreditations: ["ISO 9001"],
    description: "Innova Medical Center is distinguished by its team of true professionals and the newest European and US standards for diagnostics and treatment.",
    contactEmail: "info@innovamed.ge",
    image: "https://cdn.worldclinics.net/clinic/large/jpg/innova-medical-center-1.jpg",
  },
  {
    id: "h9", name: "Chapidze Emergency Cardiology Center",
    city: "Tbilisi", rating: 4.9, reviewCount: 421,
    specialties: ["Cardiovascular Surgery", "Cardiology", "Emergency Care"],
    accreditations: ["JCI Accredited", "German EuroCert"],
    description: "A premier facility strictly focused on cardiovascular health, offering urgent and planned cardiological surgeries, minimally invasive procedures, and a high-tech ICU.",
    contactEmail: "info@chapidzereferal.ge",
    image: "https://scontent.ftbs6-2.fna.fbcdn.net/v/t39.30808-6/476612834_1170526121191944_6337369350644129346_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=2a1932&_nc_ohc=HJ_Hvs0UaKwQ7kNvwHDxIVj&_nc_oc=Adoz8lBEIYYQodkUVEhOKZkbnWxwS1DAJ0r944eKjqvzBibX0es1ZJR-vBrISjSUNxE&_nc_zt=23&_nc_ht=scontent.ftbs6-2.fna&_nc_gid=t16PyjPcuTuO8eNrpk-E0Q&_nc_ss=7a32e&oh=00_Afx9dG-OlJMYJr8P1VijNTNqrb09ZozIXVEGvw73ql21Ng&oe=69C4E532",
  },
  {
    id: "h10", name: "MediClub Georgia",
    city: "Tbilisi", rating: 4.8, reviewCount: 289,
    specialties: ["Family Medicine", "Pediatrics", "Surgery", "Diagnostics"],
    accreditations: ["ISO 9001", "TEMOS Certified"],
    description: "Internationally focused private clinic popular with expat patients, offering modern inpatient and outpatient care across multiple specialties.",
    contactEmail: "info@mediclub.ge",
    image: "https://www.mediclub.az/storage/uploads/rich_text/vMbOEcCIwpC6T5TB1644305598_1920x1080.jpg",
  },
  {
    id: "h11", name: "Aversi Clinic",
    city: "Tbilisi", rating: 4.8, reviewCount: 890,
    specialties: ["Multiprofile Laboratory", "Imaging", "Surgery"],
    accreditations: ["ISO 9001", "ISO 15189"],
    description: "A reliable nationwide network of clinics and laboratories, known for highly accurate diagnostics, modern scanning technology, and a well-respected surgical hub.",
    contactEmail: "info@aversiclinic.ge",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "h12", name: "Gormedi - Gori Central Hospital",
    city: "Gori", rating: 4.5, reviewCount: 167,
    specialties: ["Cardiology", "Emergency", "Surgery"],
    accreditations: ["National License"],
    description: "The primary medical institution in the Shida Kartli region, providing critical care, trauma management, and extensive cardiological services to the local population.",
    contactEmail: "info@gormedi.ge",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "h13", name: "Geo Hospitals",
    city: "Tbilisi", rating: 4.6, reviewCount: 312,
    specialties: ["Multiprofile", "Diagnostics", "Therapy"],
    accreditations: ["ISO 9001"],
    description: "Geo Hospitals is an extensive network of medical centers around Georgia covering complete ambulatory and inpatient treatments.",
    contactEmail: "info@geohospitals.ge",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "h14", name: "Zhordania Clinic",
    city: "Tbilisi", rating: 4.8, reviewCount: 204,
    specialties: ["Reproductive Health", "IVF", "Gynecology"],
    accreditations: ["European IVF Standards"],
    description: "A leading specialized medical center for reproductive medicine and genetics. Famous for advanced fertility treatments and in vitro fertilization success rates.",
    contactEmail: "info@zhordaniaclinic.ge",
    image: "https://framerusercontent.com/images/5bFd8W0eZD553luTXd4LxS7nR8.webp?width=2560&height=1706",
  },
  {
    id: "h15", name: "Curatio Clinic",
    city: "Tbilisi", rating: 4.7, reviewCount: 198,
    specialties: ["Outpatient Services", "Pediatrics", "Family Medicine"],
    accreditations: ["ISO 9001"],
    description: "Focused primarily on family medicine and pediatrics, Curatio offers highly personalized outpatient services and continuous patient care protocols.",
    contactEmail: "info@curatioclinic.ge",
    image: "https://images.unsplash.com/photo-1519494080410-f9aa76cb4283?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "h16", name: "Al. Tsulukidze National Center of Urology",
    city: "Tbilisi", rating: 4.9, reviewCount: 310,
    specialties: ["Urology", "Surgery", "Onco-urology"],
    accreditations: ["National License"],
    description: "The foremost institution in Georgia for all complex urological and onco-urological treatments, pioneering minimally invasive strategies.",
    contactEmail: "info@urology.ge",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "h17", name: "Gudushauri National Medical Center",
    city: "Tbilisi", rating: 4.5, reviewCount: 540,
    specialties: ["Trauma", "Orthopedics", "Maternity", "Surgery"],
    accreditations: ["Regional Reference Hospital"],
    description: "One of the largest medical hubs in the country, managing significant emergency trauma cases, high-risk maternity, and advanced orthopedics.",
    contactEmail: "info@gudushauri.ge",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "h18", name: "Tbilisi Central Hospital",
    city: "Tbilisi", rating: 4.7, reviewCount: 422,
    specialties: ["Diagnostics", "Gynecology", "General Hospital"],
    accreditations: ["ISO 9001"],
    description: "Strategically located multiprofile hospital supplying superior diagnostic scans and high-tech surgeries via expert physicians.",
    contactEmail: "info@tch.ge",
    image: "https://vian.health/static/media/202403265139-iashvili-1920-axali.webp",
  },
  {
    id: "h19", name: "Javrishvili Clinic (Ophthalmij)",
    city: "Tbilisi", rating: 4.8, reviewCount: 180,
    specialties: ["Ophthalmology", "Vision Correction"],
    accreditations: ["Specialized ISO"],
    description: "Advanced ophthalmic care featuring laser vision correction, cataract surgery, and treatments for complex retinal diseases.",
    contactEmail: "info@ophthalmij.ge",
    image: "https://scontent.ftbs4-2.fna.fbcdn.net/v/t1.6435-9/57935945_2328186443868576_8712393648731324416_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=13d280&_nc_ohc=GdlBD7uejy0Q7kNvwF-YW8w&_nc_oc=AdqmzI9nL5d9RvOXRFP3hbDVa0S1G-x0-mQUWRTdd9V0HbvIFRC88TdLODRVxY3tPXY&_nc_zt=23&_nc_ht=scontent.ftbs4-2.fna&_nc_gid=HaG40jjocUcpNzneKvKTtw&_nc_ss=7a32e&oh=00_AfxsXakHittkRQRmQ_hEs-wRWWtgoZRGZhF5KhO8Uqidqg&oe=69E66F63",
  },
  {
    id: "h20", name: "Gia Gvaramia Clinic",
    city: "Tbilisi", rating: 4.6, reviewCount: 155,
    specialties: ["Gynecology", "Plastic Surgery", "Esthetics"],
    accreditations: ["National License"],
    description: "A well-known destination for aesthetic medicine, specialized gynecological surgeries, and cosmetic reconstructions.",
    contactEmail: "info@gvaramiaclinic.ge",
    image: "https://images.unsplash.com/photo-1572297870735-065d402f7b29?auto=format&fit=crop&w=800&q=80",
  }
];

export const mockDoctors: Doctor[] = [
  { id: "d1", name: "Dr. Giorgi Beridze",      hospitalId: "h2", specialty: "Dental Surgery",   avatar: "https://i.pravatar.cc/150?u=d1" },
  { id: "d2", name: "Dr. Nino Kapanadze",      hospitalId: "h2", specialty: "Plastic Surgery",  avatar: "https://i.pravatar.cc/150?u=d2" },
  { id: "d3", name: "Dr. Levan Tsiklauri",     hospitalId: "h1", specialty: "Orthopedics",      avatar: "https://i.pravatar.cc/150?u=d3" },
  { id: "d4", name: "Dr. Tamara Javakhishvili",hospitalId: "h1", specialty: "Cardiology",       avatar: "https://i.pravatar.cc/150?u=d4" },
  { id: "d5", name: "Dr. Dato Mchedlidze",     hospitalId: "h1", specialty: "Hair Transplant",  avatar: "https://i.pravatar.cc/150?u=d5" },
  { id: "d6", name: "Dr. Maia Kvaratskhelia",  hospitalId: "h3", specialty: "Ophthalmology",    avatar: "https://i.pravatar.cc/150?u=d6" },
  { id: "d7", name: "Dr. Irakli Gorgadze",     hospitalId: "h3", specialty: "Neurology",        avatar: "https://i.pravatar.cc/150?u=d7" },
  { id: "d8", name: "Dr. Ana Chkhartishvili",  hospitalId: "h2", specialty: "Oncology",         avatar: "https://i.pravatar.cc/150?u=d8" },
];

export const mockBookings: BookingRequest[] = [
  // ── March 12 ──
  {
    id: "b1", patientName: "John Smith", patientEmail: "john@example.com",
    patientPhone: "+1-555-0123", country: "United States", countryFlag: "🇺🇸", procedureId: "p-implant",
    hospitalId: "h2", doctorId: "d1", preferredDateStart: "2026-03-12", preferredDateEnd: "2026-03-20",
    status: "Appointment Scheduled",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "dental-xray.jpg", type: "Dental X-Ray", url: "#" },
    ],
    notes: "Patient prefers morning appointments.", createdAt: "2026-03-05",
    hospitalResponse: { confirmedDate: "2026-03-12", confirmedTime: "10:00", message: "Patient accepted.", status: "accepted" },
    referralCode: "HB-PARTNER", assignedPartnerId: "partner-demo",
    sessions: [
      { date: "2026-03-12", time: "09:00", durationMin: 30, title: "Consultation", doctorId: "d1", hospitalId: "h2", location: "29 Tseretheli Ave, Room 201" },
      { date: "2026-03-12", time: "10:00", durationMin: 60, title: "Dental X-Ray & Prep", doctorId: "d1", hospitalId: "h2", location: "29 Tseretheli Ave, Imaging" },
      { date: "2026-03-12", time: "14:00", durationMin: 120, title: "Dental Implant Surgery", doctorId: "d1", hospitalId: "h2", location: "29 Tseretheli Ave, OR-3" },
      { date: "2026-03-13", time: "10:00", durationMin: 30, title: "Post-Op Check", doctorId: "d1", hospitalId: "h2", location: "29 Tseretheli Ave, Room 201" },
    ],
  },
  {
    id: "b2", patientName: "Anna Mueller", patientEmail: "anna@example.de",
    patientPhone: "+49-170-1234567", country: "Germany", countryFlag: "🇩🇪", procedureId: "p-rhino",
    hospitalId: "h2", doctorId: "d2", preferredDateStart: "2026-03-12", preferredDateEnd: "2026-03-20",
    status: "Hospital Confirmed",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "blood-test.pdf", type: "Blood Test Results", url: "#" },
      { name: "ct-scan.dcm", type: "CT Scan", url: "#" },
    ],
    notes: "", createdAt: "2026-03-01",
    hospitalResponse: { confirmedDate: "2026-03-13", confirmedTime: "13:00", message: "Patient accepted.", status: "accepted" },
    sessions: [
      { date: "2026-03-12", time: "09:30", durationMin: 30, title: "Blood Test", doctorId: "d2", hospitalId: "h2", location: "29 Tseretheli Ave, Lab" },
      { date: "2026-03-13", time: "11:00", durationMin: 60, title: "Pre-Op Consultation", doctorId: "d2", hospitalId: "h2", location: "29 Tseretheli Ave, Room 305" },
      { date: "2026-03-13", time: "13:00", durationMin: 180, title: "Rhinoplasty Surgery", doctorId: "d2", hospitalId: "h2", location: "29 Tseretheli Ave, OR-1" },
      { date: "2026-03-14", time: "09:00", durationMin: 30, title: "Post-Op Check", doctorId: "d2", hospitalId: "h2", location: "29 Tseretheli Ave, Room 305" },
    ],
  },
  {
    id: "b3", patientName: "Ahmed Al-Rashid", patientEmail: "ahmed@example.sa",
    patientPhone: "+966-50-1234567", country: "Saudi Arabia", countryFlag: "🇸🇦", procedureId: "p-knee",
    hospitalId: "h1", doctorId: "d3", preferredDateStart: "2026-03-12", preferredDateEnd: "2026-03-20",
    status: "Lead - Step 1: Awaiting Email Verification",
    uploadedFiles: [{ name: "passport.pdf", type: "Passport", url: "#" }],
    notes: "Missing MRI and blood test results.", createdAt: "2026-03-08",
    referralCode: "HB-PARTNER", assignedPartnerId: "partner-demo",
    sessions: [
      { date: "2026-03-14", time: "15:30", durationMin: 30, title: "Initial Consultation", doctorId: "d3", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Room 102" },
    ],
  },
  {
    id: "b4", patientName: "Elena Petrova", patientEmail: "elena@example.ru",
    patientPhone: "+7-900-1234567", country: "Russia", countryFlag: "🇷🇺", procedureId: "p-stent",
    hospitalId: "h1", doctorId: "d4", preferredDateStart: "2026-03-12", preferredDateEnd: "2026-03-16",
    status: "In Treatment",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "medical-history.pdf", type: "Medical History", url: "#" },
    ],
    notes: "", createdAt: "2026-02-28",
    hospitalResponse: { confirmedDate: "2026-03-12", confirmedTime: "09:00", message: "Confirmed for full cardiac check-up.", status: "accepted" },
    sessions: [
      { date: "2026-03-12", time: "09:00", durationMin: 60, title: "ECG + Echocardiography", doctorId: "d4", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Cardio Wing" },
      { date: "2026-03-12", time: "11:00", durationMin: 30, title: "Stress Test", doctorId: "d4", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Exercise Lab" },
      { date: "2026-03-12", time: "14:00", durationMin: 30, title: "Results Review", doctorId: "d4", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Room 102" },
      { date: "2026-03-13", time: "09:00", durationMin: 60, title: "Follow-Up ECG", doctorId: "d4", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Cardio Wing" },
    ],
  },
  // ── March 13 ──
  {
    id: "b5", patientName: "Marcus Williams", patientEmail: "marcus@example.com",
    patientPhone: "+1-555-9876", country: "United States", countryFlag: "🇺🇸", procedureId: "p-hair",
    hospitalId: "h1", doctorId: "d5", preferredDateStart: "2026-03-13", preferredDateEnd: "2026-03-18",
    status: "Appointment Scheduled",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "blood-test.pdf", type: "Blood Test Results", url: "#" },
    ],
    notes: "FUE 3000 grafts planned.", createdAt: "2026-03-04",
    hospitalResponse: { confirmedDate: "2026-03-13", confirmedTime: "09:00", message: "Confirmed.", status: "accepted" },
    sessions: [
      { date: "2026-03-13", time: "09:00", durationMin: 30, title: "Pre-Op Briefing", doctorId: "d5", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Room 201" },
      { date: "2026-03-13", time: "10:00", durationMin: 480, title: "Hair Transplant (FUE)", doctorId: "d5", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, OR-2" },
      { date: "2026-03-14", time: "10:00", durationMin: 30, title: "Day-1 Bandage Check", doctorId: "d5", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Room 201" },
      { date: "2026-03-16", time: "11:00", durationMin: 30, title: "Day-3 Follow-Up", doctorId: "d5", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Room 201" },
    ],
  },
  {
    id: "b6", patientName: "Sophie Laurent", patientEmail: "sophie@example.fr",
    patientPhone: "+33-6-12345678", country: "France", countryFlag: "🇫🇷", procedureId: "p-mri",
    hospitalId: "h3", doctorId: "d6", preferredDateStart: "2026-03-13", preferredDateEnd: "2026-03-15",
    status: "In Treatment",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "eye-exam.pdf", type: "Eye Examination Report", url: "#" },
    ],
    notes: "", createdAt: "2026-03-02",
    hospitalResponse: { confirmedDate: "2026-03-13", confirmedTime: "10:00", message: "Confirmed for LASIK.", status: "accepted" },
    sessions: [
      { date: "2026-03-13", time: "10:00", durationMin: 60, title: "Eye Exam & Mapping", doctorId: "d6", hospitalId: "h3", location: "13 Pekini Ave, Ophthalmology Wing" },
      { date: "2026-03-13", time: "11:30", durationMin: 30, title: "LASIK Surgery", doctorId: "d6", hospitalId: "h3", location: "13 Pekini Ave, Laser Suite" },
      { date: "2026-03-13", time: "13:00", durationMin: 30, title: "Post-Op Check", doctorId: "d6", hospitalId: "h3", location: "13 Pekini Ave, Room 108" },
      { date: "2026-03-14", time: "10:00", durationMin: 30, title: "Day-1 Vision Test", doctorId: "d6", hospitalId: "h3", location: "13 Pekini Ave, Room 108" },
    ],
  },
  // ── March 14 ──
  {
    id: "b7", patientName: "Kenji Tanaka", patientEmail: "kenji@example.jp",
    patientPhone: "+81-90-12345678", country: "Japan", countryFlag: "🇯🇵", procedureId: "p-petct",
    hospitalId: "h3", doctorId: "d7", preferredDateStart: "2026-03-14", preferredDateEnd: "2026-03-15",
    status: "Appointment Scheduled",
    uploadedFiles: [{ name: "passport.pdf", type: "Passport", url: "#" }],
    notes: "Full body check-up requested.", createdAt: "2026-03-06",
    hospitalResponse: { confirmedDate: "2026-03-14", confirmedTime: "09:00", message: "All day checkup confirmed.", status: "accepted" },
    sessions: [
      { date: "2026-03-14", time: "09:00", durationMin: 60, title: "Blood Work & Urine", doctorId: "d7", hospitalId: "h3", location: "13 Pekini Ave, Lab" },
      { date: "2026-03-14", time: "10:30", durationMin: 30, title: "Ultrasound Abdomen", doctorId: "d7", hospitalId: "h3", location: "13 Pekini Ave, Imaging" },
      { date: "2026-03-14", time: "11:30", durationMin: 30, title: "Neurology Screening", doctorId: "d7", hospitalId: "h3", location: "13 Pekini Ave, Neuro Wing" },
      { date: "2026-03-14", time: "14:00", durationMin: 60, title: "Final Consult & Report", doctorId: "d7", hospitalId: "h3", location: "13 Pekini Ave, Room 302" },
    ],
  },
  {
    id: "b10", patientName: "David Chen", patientEmail: "david@example.cn",
    patientPhone: "+86-138-12345678", country: "China", countryFlag: "🇨🇳", procedureId: "p-rhino",
    hospitalId: "h2", doctorId: "d2", preferredDateStart: "2026-03-14", preferredDateEnd: "2026-03-18",
    status: "In Treatment",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "blood-test.pdf", type: "Blood Test Results", url: "#" },
      { name: "ct-scan.dcm", type: "CT Scan", url: "#" },
    ],
    notes: "", createdAt: "2026-03-03",
    hospitalResponse: { confirmedDate: "2026-03-14", confirmedTime: "09:00", message: "Ready for surgery.", status: "accepted" },
    referralCode: "HB-PARTNER", assignedPartnerId: "partner-demo",
    sessions: [
      { date: "2026-03-14", time: "09:00", durationMin: 30, title: "Pre-Op Vitals", doctorId: "d2", hospitalId: "h2", location: "29 Tseretheli Ave, Prep Room" },
      { date: "2026-03-14", time: "13:00", durationMin: 120, title: "Rhinoplasty Surgery", doctorId: "d2", hospitalId: "h2", location: "29 Tseretheli Ave, OR-1" },
      { date: "2026-03-15", time: "09:00", durationMin: 30, title: "Post-Op Check", doctorId: "d2", hospitalId: "h2", location: "29 Tseretheli Ave, Room 305" },
    ],
  },
  // ── March 15 ──
  {
    id: "b11", patientName: "Fatima Al-Salem", patientEmail: "fatima@example.kw",
    patientPhone: "+965-9123-4567", country: "Kuwait", countryFlag: "🇰🇼", procedureId: "p-implant",
    hospitalId: "h2", doctorId: "d1", preferredDateStart: "2026-03-15", preferredDateEnd: "2026-03-18",
    status: "Appointment Scheduled",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "dental-xray.pdf", type: "Dental X-Ray", url: "#" },
      { name: "medical-history.pdf", type: "Medical History", url: "#" },
    ],
    notes: "", createdAt: "2026-03-07",
    hospitalResponse: { confirmedDate: "2026-03-15", confirmedTime: "09:00", message: "Confirmed.", status: "accepted" },
    sessions: [
      { date: "2026-03-15", time: "09:00", durationMin: 30, title: "Consultation", doctorId: "d1", hospitalId: "h2", location: "29 Tseretheli Ave, Room 201" },
      { date: "2026-03-15", time: "10:00", durationMin: 60, title: "Dental Panoramic X-Ray", doctorId: "d1", hospitalId: "h2", location: "29 Tseretheli Ave, Imaging" },
      { date: "2026-03-15", time: "14:00", durationMin: 90, title: "Dental Implant Surgery", doctorId: "d1", hospitalId: "h2", location: "29 Tseretheli Ave, OR-3" },
      { date: "2026-03-16", time: "10:00", durationMin: 30, title: "Post-Op Check", doctorId: "d1", hospitalId: "h2", location: "29 Tseretheli Ave, Room 201" },
    ],
  },
  {
    id: "b14", patientName: "Arjun Patel", patientEmail: "arjun@example.in",
    patientPhone: "+91-98765-43210", country: "India", countryFlag: "🇮🇳", procedureId: "p-stent",
    hospitalId: "h1", doctorId: "d4", preferredDateStart: "2026-03-15", preferredDateEnd: "2026-03-16",
    status: "Appointment Scheduled",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "medical-history.pdf", type: "Medical History", url: "#" },
    ],
    notes: "History of hypertension.", createdAt: "2026-03-04",
    hospitalResponse: { confirmedDate: "2026-03-15", confirmedTime: "11:00", message: "Confirmed.", status: "accepted" },
    sessions: [
      { date: "2026-03-15", time: "11:00", durationMin: 60, title: "Cardiac Consultation", doctorId: "d4", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Cardio Wing" },
      { date: "2026-03-15", time: "13:00", durationMin: 30, title: "ECG Recording", doctorId: "d4", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, ECG Lab" },
      { date: "2026-03-15", time: "15:00", durationMin: 30, title: "Holter Monitor Setup", doctorId: "d4", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Cardio Wing" },
      { date: "2026-03-16", time: "09:00", durationMin: 30, title: "Holter Remove & Review", doctorId: "d4", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Cardio Wing" },
    ],
  },
  // ── March 16 ──
  {
    id: "b16", patientName: "Carlos Mendez", patientEmail: "carlos@example.mx",
    patientPhone: "+52-55-12345678", country: "Mexico", countryFlag: "🇲🇽", procedureId: "p-knee",
    hospitalId: "h1", doctorId: "d3", preferredDateStart: "2026-03-16", preferredDateEnd: "2026-03-22",
    status: "Appointment Scheduled",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "knee-mri.dcm", type: "Knee MRI", url: "#" },
      { name: "blood-test.pdf", type: "Blood Test Results", url: "#" },
    ],
    notes: "Complete ACL reconstruction.", createdAt: "2026-03-06",
    hospitalResponse: { confirmedDate: "2026-03-16", confirmedTime: "09:00", message: "Surgery day.", status: "accepted" },
    sessions: [
      { date: "2026-03-16", time: "09:00", durationMin: 30, title: "Pre-Op Briefing", doctorId: "d3", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Room 102" },
      { date: "2026-03-16", time: "10:00", durationMin: 30, title: "Anesthesia Consult", doctorId: "d3", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Room 105" },
      { date: "2026-03-16", time: "13:00", durationMin: 180, title: "Knee ACL Surgery", doctorId: "d3", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, OR-1" },
    ],
  },
  {
    id: "b17", patientName: "Olga Ivanova", patientEmail: "olga@example.ru",
    patientPhone: "+7-916-1234567", country: "Russia", countryFlag: "🇷🇺", procedureId: "p-ivf",
    hospitalId: "h1", doctorId: "d3", preferredDateStart: "2026-03-16", preferredDateEnd: "2026-03-20",
    status: "Lead - Step 3: Clinic Confirmation",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "hormones.pdf", type: "Hormonal Panel", url: "#" },
    ],
    notes: "First IVF consultation.", createdAt: "2026-03-10",
    sessions: [
      { date: "2026-03-16", time: "15:00", durationMin: 60, title: "IVF Consultation", doctorId: "d3", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Fertility Wing" },
    ],
  },
  // ── March 25 (future — pending leads) ──
  {
    id: "b8", patientName: "Omar Hassan", patientEmail: "omar@example.ae",
    patientPhone: "+971-50-1234567", country: "UAE", countryFlag: "🇦🇪", procedureId: "p-stent",
    hospitalId: "h2", doctorId: "d8", preferredDateStart: "2026-03-25", preferredDateEnd: "2026-03-30",
    status: "Lead - Step 3: Clinic Confirmation",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "medical-history.pdf", type: "Medical History", url: "#" },
    ],
    notes: "Wants comprehensive cardiac screening.", createdAt: "2026-03-10",
    sessions: [
      { date: "2026-03-25", time: "09:00", durationMin: 60, title: "Consultation (Pending)", doctorId: "d8", hospitalId: "h2", location: "29 Tseretheli Ave, Room 102" },
      { date: "2026-03-25", time: "11:00", durationMin: 60, title: "ECG & Echo (Pending)", doctorId: "d8", hospitalId: "h2", location: "29 Tseretheli Ave, Cardio Lab" },
    ],
  },
  {
    id: "b9", patientName: "Maria Gonzalez", patientEmail: "maria@example.es",
    patientPhone: "+34-612-345678", country: "Spain", countryFlag: "🇪🇸", procedureId: "p-ivf",
    hospitalId: "h1", doctorId: "d3", preferredDateStart: "2026-03-25", preferredDateEnd: "2026-04-05",
    status: "Lead - Step 4: Travel Booked",
    uploadedFiles: [{ name: "passport.pdf", type: "Passport", url: "#" }],
    notes: "Patient needs to submit hormonal panel and ultrasound.", createdAt: "2026-03-09",
    referralCode: "HB-PARTNER", assignedPartnerId: "partner-demo",
    sessions: [
      { date: "2026-03-25", time: "10:00", durationMin: 60, title: "IVF Initial Consult (Pending)", doctorId: "d3", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Fertility Wing" },
    ],
  },
  {
    id: "b12", patientName: "Alexander Volkov", patientEmail: "alex@example.ru",
    patientPhone: "+7-925-1234567", country: "Russia", countryFlag: "🇷🇺", procedureId: "p-knee",
    hospitalId: "h1", doctorId: "d3", preferredDateStart: "2026-03-25", preferredDateEnd: "2026-04-01",
    status: "Lead - Step 4: Travel Booked",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "knee-mri.dcm", type: "Knee MRI", url: "#" },
      { name: "blood-test.pdf", type: "Blood Test Results", url: "#" },
    ],
    notes: "Remote consultation done. In-person follow-up scheduled.", createdAt: "2026-03-06",
    sessions: [
      { date: "2026-03-25", time: "09:00", durationMin: 60, title: "In-Person Consultation", doctorId: "d3", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Room 102" },
      { date: "2026-03-25", time: "10:30", durationMin: 30, title: "New MRI Scan", doctorId: "d3", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Imaging" },
      { date: "2026-03-25", time: "14:00", durationMin: 30, title: "Surgery Planning Review", doctorId: "d3", hospitalId: "h1", location: "14 Tsinamdzghvrishvili St, Room 201" },
    ],
  },
  {
    id: "b13", patientName: "Lina Müller", patientEmail: "lina@example.de",
    patientPhone: "+49-176-9876543", country: "Germany", countryFlag: "🇩🇪", procedureId: "p-mri",
    hospitalId: "h3", doctorId: "d6", preferredDateStart: "2026-03-25", preferredDateEnd: "2026-03-28",
    status: "Lead - Step 2: Profile Completed",
    uploadedFiles: [],
    notes: "Online inquiry. No documents submitted yet.", createdAt: "2026-03-11",
    sessions: [],
  },
  {
    id: "b15", patientName: "Yuki Tanaka", patientEmail: "yuki@example.jp",
    patientPhone: "+81-80-98765432", country: "Japan", countryFlag: "🇯🇵", procedureId: "p-rhino",
    hospitalId: "h2", doctorId: "d2", preferredDateStart: "2026-03-25", preferredDateEnd: "2026-03-30",
    status: "Awaiting Hospital Response",
    uploadedFiles: [
      { name: "passport.pdf", type: "Passport", url: "#" },
      { name: "blood-test.pdf", type: "Blood Test Results", url: "#" },
    ],
    notes: "Patient sent all documents. Waiting for clinic confirmation.", createdAt: "2026-03-10",
    sessions: [
      { date: "2026-03-25", time: "11:00", durationMin: 60, title: "Rhinoplasty Consult (Pending)", doctorId: "d2", hospitalId: "h2", location: "29 Tseretheli Ave, Room 305" },
    ],
  },
];

