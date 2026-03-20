import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import TreatmentsPage from "@/pages/TreatmentsPage";
import HospitalsPage from "@/pages/HospitalsPage";
import HospitalDetailPage from "@/pages/HospitalDetailPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import FAQPage from "@/pages/FAQPage";
import ContactPage from "@/pages/ContactPage";
import BookPage from "@/pages/BookPage";
import AdminPage from "@/pages/AdminPage";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import ClinicPage from "@/pages/ClinicPage";
import NotFound from "@/pages/NotFound";
import { BookingProvider } from "@/store/bookingStore";
import { AuthProvider } from "@/store/authStore";
import ProtectedAdminRoute from "@/components/auth/ProtectedAdminRoute";
import ProtectedClinicRoute from "@/components/auth/ProtectedClinicRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <BookingProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/treatments" element={<TreatmentsPage />} />
              <Route path="/hospitals" element={<HospitalsPage />} />
              <Route path="/hospitals/:id" element={<HospitalDetailPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/book" element={<BookPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin" element={<ProtectedAdminRoute><AdminPage /></ProtectedAdminRoute>} />
              <Route path="/clinic" element={<ProtectedClinicRoute><ClinicPage /></ProtectedClinicRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
    </BookingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
