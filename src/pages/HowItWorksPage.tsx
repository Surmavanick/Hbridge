import { Search, Upload, CalendarCheck, Plane } from "lucide-react";

const steps = [
  {
    icon: Search, title: "Choose Your Treatment",
    desc: "Browse our catalog of treatments, select your preferred dates, and tell us where you're traveling from.",
  },
  {
    icon: Upload, title: "Upload Your Documents",
    desc: "Securely upload your passport, medical reports, and any required test results for your selected procedure.",
  },
  {
    icon: CalendarCheck, title: "Get Your Appointment",
    desc: "Our team reviews your request, coordinates with the hospital, and confirms your appointment date and time.",
  },
  {
    icon: Plane, title: "Travel & Treatment",
    desc: "We help coordinate your flights, hotel, and airport transfers. You arrive, get treated, and recover in beautiful Georgia.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container-max section-padding py-10">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-3xl font-heading font-bold text-foreground">How It Works</h1>
        <p className="text-muted-foreground mt-2">Four simple steps to your medical journey in Georgia</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-0">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-6 relative">
            {/* Line */}
            {i < steps.length - 1 && (
              <div className="absolute left-[23px] top-14 bottom-0 w-px bg-border" />
            )}
            <div className="shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground relative z-10">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="pb-10">
              <p className="text-xs font-semibold text-primary mb-1">Step {i + 1}</p>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
