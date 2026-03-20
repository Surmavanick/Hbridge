import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Is it safe to get medical treatment in Georgia?", a: "Yes. Georgia has internationally accredited hospitals (JCI, ISO) with experienced doctors trained in Europe and the US. We only partner with verified, top-rated facilities." },
  { q: "How much can I save compared to my home country?", a: "Patients typically save 50–70% compared to US and Western European prices, without compromising on quality. Exact savings depend on the procedure." },
  { q: "What documents do I need?", a: "At minimum, you'll need a valid passport and relevant medical records. Each procedure has specific document requirements which are shown during the booking process." },
  { q: "How long does the process take?", a: "From submission to confirmed appointment, it typically takes 5–10 business days. Treatment can usually be scheduled within 2–4 weeks." },
  { q: "Do you help with flights and hotels?", a: "Yes. After your hospital appointment is confirmed, our travel coordination team helps arrange flights, hotel accommodation, and airport transfers." },
  { q: "Can I choose my hospital or doctor?", a: "You can indicate a hospital preference. Our team also recommends the best options based on your procedure and medical history." },
  { q: "What happens if the hospital needs more information?", a: "We'll notify you immediately and guide you on what additional documents or tests are needed. You can upload them through our platform." },
  { q: "Is my data secure?", a: "All uploaded documents are stored securely and only shared with the assigned hospital. We follow strict data protection practices." },
];

export default function FAQPage() {
  return (
    <div className="container-max section-padding py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-foreground text-center mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground text-center mb-8">Everything you need to know about medical travel to Georgia</p>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="bg-card rounded-lg border border-border px-4">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
