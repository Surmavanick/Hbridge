import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo.svg";

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container-max section-padding py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Health Bridge" className="h-6 w-auto brightness-0 invert" />
              <span className="text-lg" style={{ fontFamily: "'Agbalumo', cursive" }}>Health Bridge</span>
            </div>
            <p className="text-sm opacity-70 leading-relaxed">
              Your trusted partner for medical travel to Georgia. World-class healthcare at affordable prices.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm opacity-70">
              <Link to="/treatments" className="hover:opacity-100 transition-opacity">Treatments</Link>
              <Link to="/hospitals" className="hover:opacity-100 transition-opacity">Hospitals</Link>
              <Link to="/how-it-works" className="hover:opacity-100 transition-opacity">How It Works</Link>
              <Link to="/book" className="hover:opacity-100 transition-opacity">Book With Us</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4">Support</h4>
            <div className="flex flex-col gap-2 text-sm opacity-70">
              <Link to="/faq" className="hover:opacity-100 transition-opacity">FAQ</Link>
              <Link to="/contact" className="hover:opacity-100 transition-opacity">Contact Us</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4">Contact</h4>
            <div className="flex flex-col gap-3 text-sm opacity-70">
              <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> healtbridge@gmail.com</span>
              <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> +995 032 152 856</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Tbilisi, Georgia</span>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-xs opacity-50">
          © 2026 Health Bridge. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
