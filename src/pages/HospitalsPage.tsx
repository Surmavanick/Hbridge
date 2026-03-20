import { Card, CardContent } from "@/components/ui/card";
import { hospitals } from "@/data/mockData";
import { Star, MapPin, BadgeCheck } from "lucide-react";

export default function HospitalsPage() {
  return (
    <div className="container-max section-padding py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">Partner Hospitals & Clinics</h1>
        <p className="text-muted-foreground mt-1">Internationally accredited medical facilities across Georgia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {hospitals.map((h) => (
          <Card key={h.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              {h.image && (
                <img
                  src={h.image}
                  alt={h.name}
                  className="mb-4 h-40 w-full rounded-md object-cover"
                  loading="lazy"
                />
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">{h.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" /> {h.city}, Georgia
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-warning/10 px-2.5 py-1 rounded-full">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  <span className="text-sm font-semibold">{h.rating}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{h.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {h.accreditations.map((a) => (
                  <span key={a} className="trust-badge"><BadgeCheck className="h-3 w-3" /> {a}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {h.specialties.map((s) => (
                  <span key={s} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
