/**
 * EmailJS Configuration
 * ─────────────────────────────────────────────────────────
 * 1. გადადი https://www.emailjs.com და შექმენი account (უფასოა, 200 მეილი/თვე)
 * 2. "Email Services" → Add New Service → Gmail (ან სხვა)
 *    └─ Service ID-ს დაინახავ → ჩაწერე VITE_EMAILJS_SERVICE_ID-ში
 * 3. "Email Templates" → Create New Template
 *    Subject: Booking Confirmation - {{procedure_name}}
 *    Body:
 *      Hello {{patient_name}},
 *      Your booking request for {{procedure_name}} has been submitted.
 *      Preferred dates: {{date_from}} – {{date_to}}
 *      We'll review and contact you within 24-48 hours.
 *      — Health Bridge Team
 *    Template ID → ჩაწერე VITE_EMAILJS_TEMPLATE_ID-ში
 * 4. "Account" → Public Key → ჩაწერე VITE_EMAILJS_PUBLIC_KEY-ში
 * 5. .env ფაილში ჩაამატე:
 *      VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
 *      VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
 *      VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
 * ─────────────────────────────────────────────────────────
 */

export const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID as string,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string,
};

export const isEmailJSConfigured = () =>
  Boolean(
    EMAILJS_CONFIG.serviceId &&
    EMAILJS_CONFIG.templateId &&
    EMAILJS_CONFIG.publicKey
  );
