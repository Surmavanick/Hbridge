import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { procedures } from "@/data/mockData";
import { Clock, ChevronRight, Search } from "lucide-react";

export default function TreatmentsPage() {
  const categories = [...new Set(procedures.map((p) => p.category))];
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered =
    activeCategory === "All"
      ? procedures
      : procedures.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border">
        <div className="container-max section-padding py-14">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold tracking-widest text-primary uppercase mb-3">
              Our Services
            </span>
            <h1 className="text-4xl font-heading font-bold text-foreground mb-3">
              Treatments & Procedures
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Browse our full range of world-class medical services performed by
              certified specialists in Georgia — at a fraction of Western costs.
            </p>
          </div>
        </div>
      </div>

      <div className="container-max section-padding py-10">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Procedure Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Top colored accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />

              <div className="p-6 flex flex-col h-full">
                {/* Category tag */}
                <span className="text-[11px] font-semibold uppercase tracking-widest text-primary/70 mb-2">
                  {p.category}
                </span>

                <h3 className="font-heading font-bold text-foreground text-lg mb-2 leading-tight">
                  {p.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed flex-grow">
                  {p.description}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5 border-t border-border/50 pt-4">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary/60" />
                    {p.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-border" />
                    Recovery: {p.recoveryTime}
                  </span>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Starting from</p>
                    <p className="text-lg font-bold text-primary">{p.priceRange}</p>
                  </div>
                  <Link to={`/book?procedure=${p.id}`}>
                    <Button size="sm" className="rounded-full gap-1 text-xs px-4">
                      Book Now <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No procedures found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
