import { Link } from "react-router-dom";
import { useRef, useCallback } from "react";
import { Shield, Clock, DollarSign, Globe, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import HeroSearchBox from "@/components/HeroSearchBox";
import { procedures, hospitals } from "@/data/mockData";
import heroImage from "@/assets/hero-tbilisi.jpg";

const trustSignals = [
  { icon: Shield, label: "JCI Accredited Hospitals", desc: "Internationally certified facilities" },
  { icon: DollarSign, label: "Up to 70% Savings", desc: "Compared to US & EU prices" },
  { icon: Globe, label: "Full Travel Support", desc: "Flights, hotels & transfers" },
  { icon: Clock, label: "Fast Scheduling", desc: "Treatment within 2–4 weeks" },
];

const stats = [
  { value: "2,500+", label: "Patients Treated" },
  { value: "50+", label: "Partner Hospitals" },
  { value: "15+", label: "Countries Served" },
  { value: "4.8★", label: "Average Rating" },
];

export default function HomePage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grabbing';
      // Disable snap during drag so movement is free
      scrollRef.current.style.scrollSnapType = 'none';
    }
  }, []);

  const snapToNearest = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Re-enable snap — browser will snap to nearest child
    el.style.scrollSnapType = 'x mandatory';
    el.style.cursor = 'grab';
    isDragging.current = false;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft ?? 0);
    const walk = (x - startX.current) * 0.8;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[560px] md:min-h-[620px] flex items-center">
        <img src={heroImage} alt="Tbilisi, Georgia" className="absolute inset-0 w-full h-full object-cover" />
        <div className="hero-gradient absolute inset-0" />
        <div className="relative z-10 container-max section-padding w-full py-16 md:py-24">
          <div className="max-w-2xl mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-primary-foreground leading-tight mb-4">
              World-Class Medical Care in Georgia
            </h1>
            <p className="text-base md:text-lg text-primary-foreground/80 leading-relaxed">
              Access affordable, high-quality healthcare in one of Europe's most beautiful countries. We handle everything — from booking to recovery.
            </p>
          </div>
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <HeroSearchBox />
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="bg-card border-b border-border">
        <div className="container-max section-padding py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trustSignals.map((t) => (
              <div key={t.label} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <t.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-sm text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-max section-padding py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-heading font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular treatments */}
      <section className="bg-card border-y border-border">
        <div className="container-max section-padding py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Popular Treatments</h2>
              <p className="text-muted-foreground mt-1">Most sought-after procedures by international patients</p>
            </div>
            <Link to="/treatments" className="hidden md:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {procedures.slice(0, 4).map((p) => (
              <Card key={p.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit mb-3">{p.category}</div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">{p.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">{p.priceRange}</span>
                    <Link to={`/book?procedure=${p.id}`}>
                      <Button size="sm" variant="ghost" className="text-xs">Book →</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Link to="/treatments" className="md:hidden flex items-center justify-center gap-1 text-sm font-medium text-primary mt-6">
            View all treatments <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Top hospitals */}
      <section className="container-max section-padding py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Trusted Hospitals</h2>
            <p className="text-muted-foreground mt-1">Internationally accredited partner facilities</p>
          </div>
          <Link to="/hospitals" className="hidden md:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {/* Horizontal Scroll Container */}
        <div className="scroll-fade-wrapper">
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseLeave={snapToNearest}
          onMouseUp={snapToNearest}
          onMouseMove={onMouseMove}
          className="scroll-container flex overflow-x-auto gap-4 select-none pb-4"
          style={{ cursor: 'grab', WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
        >
          {hospitals.slice(0, 15).map((h) => (
            <Link key={h.id} to={`/hospitals/${h.id}`} className="shrink-0 snap-start min-w-[280px] md:min-w-[320px] max-w-[320px]">
            <Card className="w-full h-full hover:shadow-lg transition-all duration-300 border border-border group cursor-pointer">
              <CardContent className="p-0 flex flex-col h-full">
                {h.image ? (
                  <div className="overflow-hidden rounded-t-xl">
                    <img
                      src={h.image}
                      alt={h.name}
                      className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="h-40 w-full bg-muted rounded-t-xl flex items-center justify-center">
                    <span className="text-muted-foreground">No image available</span>
                  </div>
                )}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                      <Star className="h-3.5 w-3.5 fill-warning" />
                      <span className="text-xs font-bold">{h.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">({h.reviewCount} reviews)</span>
                  </div>
                  <h3 className="font-heading font-bold text-foreground mb-1 text-lg line-clamp-1" title={h.name}>{h.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{h.city}, Georgia</p>
                  
                  {h.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed flex-grow">
                      {h.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-border/50">
                    {h.accreditations.slice(0, 2).map((a) => (
                      <span key={a} className="text-[10px] font-medium bg-primary/5 text-primary px-2 py-1 rounded-md border border-primary/10">
                        {a}
                      </span>
                    ))}
                    {h.accreditations.length > 2 && (
                       <span className="text-[10px] font-medium bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-md">
                         +{h.accreditations.length - 2}
                       </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
        </div>
        <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground md:hidden">
            <span>Swipe to see more</span>
            <Link to="/hospitals" className="flex items-center gap-1 text-primary">View all <ArrowRight className="h-3 w-3" /></Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary">
        <div className="container-max section-padding py-14 text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-primary-foreground mb-3">
            Ready to Start Your Medical Journey?
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Submit your request today and our team will coordinate everything — hospital, travel, and accommodation.
          </p>
          <Link to="/book">
            <Button variant="secondary" size="lg" className="font-semibold">
              Book With Us
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
