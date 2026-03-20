import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { hospitals } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  BadgeCheck,
  ArrowLeft,
  Stethoscope,
  CalendarCheck,
  ShieldCheck,
  Clock,
  Users,
  Award,
  ChevronRight,
  Check,
  MessageCircleQuestion,
  ChevronDown,
} from "lucide-react";

export default function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hospital = hospitals.find((h) => h.id === id);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!hospital) {
    return (
      <div className="container-max section-padding py-20 text-center">
        <p className="text-muted-foreground text-lg">Hospital not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/hospitals")}>
          Back to Hospitals
        </Button>
      </div>
    );
  }

  // Generate a set of placeholder thumbnail images from Unsplash with different params
  const thumbnailSeeds = [
    "?auto=format&fit=crop&w=400&q=80",
    "?auto=format&fit=crop&w=400&q=80&sat=-20",
    "?auto=format&fit=crop&w=400&q=80&bri=10",
    "?auto=format&fit=crop&w=400&q=80&con=10",
  ];
  const baseImg = hospital.image?.split("?")[0] ?? "";
  const thumbnails = baseImg
    ? thumbnailSeeds.map((s) => baseImg + s)
    : [];

  const highlights = [
    { icon: ShieldCheck, label: "Internationally Accredited", sub: hospital.accreditations.join(", ") },
    { icon: Users, label: `${hospital.reviewCount}+ Reviews`, sub: "Verified patient feedback" },
    { icon: Clock, label: "Fast Scheduling", sub: "Appointments within 2–4 weeks" },
    { icon: Award, label: `${hospital.rating} Rating`, sub: "Top rated facility in Georgia" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Back breadcrumb bar ── */}
      <div className="border-b border-border bg-card">
        <div className="container-max section-padding py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/hospitals" className="hover:text-primary transition-colors">Hospitals</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{hospital.name}</span>
        </div>
      </div>

      <div className="container-max section-padding py-8 max-w-6xl">

        {/* ── Title + rating row ── */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground leading-tight">
              {hospital.name}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {hospital.city}, Georgia
              </span>
              {hospital.accreditations.slice(0, 2).map((a) => (
                <span key={a} className="trust-badge text-xs">
                  <BadgeCheck className="h-3 w-3" /> {a}
                </span>
              ))}
            </div>
          </div>
          {/* Rating box (Booking.com style) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground">
                {hospital.rating >= 4.8 ? "Exceptional" : hospital.rating >= 4.5 ? "Excellent" : "Very Good"}
              </p>
              {/* Stars next to label, yellow, accurate count */}
              <div className="flex items-center justify-end gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 ${
                      star <= Math.floor(hospital.rating)
                        ? "fill-warning text-warning"
                        : star - 0.5 <= hospital.rating
                        ? "fill-warning/50 text-warning"
                        : "fill-muted text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{hospital.reviewCount} reviews</p>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-md">
              {hospital.rating}
            </div>
          </div>
        </div>

        {/* ── Photo grid (Booking.com style) ── */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-64 md:h-[420px] rounded-2xl overflow-hidden mb-8">
          {/* Main large image */}
          <div className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden">
            {hospital.image ? (
              <img
                src={hospital.image}
                alt={hospital.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No image</span>
              </div>
            )}
          </div>
          {/* 4 thumbnails */}
          {thumbnails.slice(0, 4).map((src, i) => (
            <div key={i} className="relative group cursor-pointer overflow-hidden bg-muted">
              <img
                src={src}
                alt={`${hospital.name} view ${i + 2}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
              />
              {/* "Show all photos" overlay on last thumbnail */}
              {i === 3 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">View all photos</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Main content + sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            <section>
              <h2 className="text-xl font-heading font-bold text-foreground mb-3">About</h2>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                {hospital.description}
              </p>
            </section>

            <hr className="border-border" />

            {/* Specialties */}
            <section>
              <h2 className="text-xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Medical Specialties
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hospital.specialties.map((s) => (
                  <div
                    key={s}
                    className="flex items-center gap-2 text-sm text-foreground bg-secondary/60 rounded-lg px-3 py-2.5 border border-border/60"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </section>

            {/* Patient Reviews */}
            {hospital.reviews && hospital.reviews.length > 0 && (
              <>
                <hr className="border-border" />
                <section>
                  <h2 className="text-xl font-heading font-bold text-foreground mb-5 flex items-center gap-2">
                    <Star className="h-5 w-5 text-warning fill-warning" />
                    What Patients Say
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hospital.reviews.map((r, i) => (
                      <div key={i} className="bg-secondary/40 border border-border/60 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                            {r.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.flag} {r.country}</p>
                          </div>
                          <div className="ml-auto flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-warning text-warning" : "fill-muted text-muted-foreground/20"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                          "{r.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Services Checklist */}
            {hospital.services && hospital.services.length > 0 && (
              <>
                <hr className="border-border" />
                <section>
                  <h2 className="text-xl font-heading font-bold text-foreground mb-5 flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Services & Procedures
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {hospital.services.map((cat) => (
                      <div key={cat.category}>
                        <h3 className="text-sm font-semibold text-foreground mb-2 pb-1 border-b border-border">{cat.category}</h3>
                        <ul className="space-y-1.5">
                          {cat.items.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* FAQ Accordion */}
            {hospital.faq && hospital.faq.length > 0 && (
              <>
                <hr className="border-border" />
                <section>
                  <h2 className="text-xl font-heading font-bold text-foreground mb-5 flex items-center gap-2">
                    <MessageCircleQuestion className="h-5 w-5 text-primary" />
                    Patients Are Asking
                  </h2>
                  <div className="space-y-2">
                    {hospital.faq.map((item, i) => (
                      <div key={i} className="border border-border rounded-xl overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-secondary/40 transition-colors"
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        >
                          <span className="text-sm font-medium text-foreground pr-4">{item.question}</span>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                        </button>
                        {openFaq === i && (
                          <div className="px-4 pb-4 pt-1">
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

          </div>

          {/* Right sidebar */}
          <div className="space-y-4">

            {/* Book CTA card */}
            <div className="border border-border rounded-2xl p-5 shadow-sm bg-card sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Rating</p>
                <div className="flex items-center gap-1.5 bg-warning/10 text-warning px-2.5 py-1 rounded-full">
                  <Star className="h-3.5 w-3.5 fill-warning" />
                  <span className="font-bold text-sm">{hospital.rating}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Based on <span className="font-semibold text-foreground">{hospital.reviewCount}</span> verified patient reviews
              </p>
              <Link to={`/book?hospital=${hospital.id}`}>
                <Button className="w-full gap-2 h-11 text-sm font-semibold shadow-md" size="lg">
                  <CalendarCheck className="h-4 w-4" />
                  Book Appointment
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Free consultation · No hidden fees
              </p>
            </div>

            {/* Highlights */}
            <div className="border border-border rounded-2xl p-5 bg-card">
              <h3 className="font-heading font-bold text-foreground mb-4 text-sm uppercase tracking-wide">
                Facility Highlights
              </h3>
              <div className="space-y-4">
                {highlights.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map widget */}
            {hospital.mapEmbedUrl && (
              <div className="border border-border rounded-2xl overflow-hidden bg-card">
                <div className="px-4 pt-4 pb-2">
                  <h3 className="font-heading font-bold text-foreground text-sm uppercase tracking-wide mb-0.5">Location</h3>
                  {hospital.address && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                      {hospital.address}
                    </p>
                  )}
                </div>
                <iframe
                  src={hospital.mapEmbedUrl}
                  width="100%"
                  height="180"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  title={`${hospital.name} location map`}
                />
                <div className="px-4 py-3">
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(hospital.name + ' ' + hospital.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Show on Google Maps →
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
