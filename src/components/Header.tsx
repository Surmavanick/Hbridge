import { Link, useLocation, useNavigate } from "react-router-dom";
import { FormEvent, useState } from "react";
import { ChevronDown, LogOut, Menu, Settings, X, User, Shield, ArrowLeft, LayoutDashboard, Banknote, KeyRound, Eye, EyeOff, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logo from "/logo.svg";
import { useAuth } from "@/store/authStore";
import type { UserRole } from "@/store/authStore";
import { useIsMobile } from "@/hooks/use-mobile";
import emailjs from "@emailjs/browser";
import { EMAILJS_CONFIG, isEmailJSConfigured } from "@/lib/emailjs";
import { toast } from "sonner";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/treatments", label: "Treatments" },
  { to: "/hospitals", label: "Hospitals" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Partner modals
  const [showPayout, setShowPayout] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  // User modals
  const [showUserSecurity, setShowUserSecurity] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  // Payout fields
  const [iban, setIban] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  // Account settings fields
  const [newName, setNewName] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, login, logout, resetPassword, updateUser, changePassword, isSopikoPartner } = useAuth();

  const handleInlineLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error("Please select a role first.");
      return;
    }

    const result = login({ email, password, role: selectedRole });
    if (!result.ok) {
      toast.error(result.error || "Login failed");
      return;
    }

    toast.success("Logged in successfully");
    setMenuOpen(false);
    setEmail("");
    setPassword("");
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!recoveryEmail) return;

    if (!isEmailJSConfigured()) {
      toast.error("Email service is not configured.");
      return;
    }

    const newPassword = Math.random().toString(36).slice(-8);
    const success = resetPassword(recoveryEmail, selectedRole, newPassword);

    if (!success) {
      toast.error("No account found with that email address.");
      return;
    }

    try {
      setIsSending(true);
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        {
          patient_name: selectedRole === "user" ? "Patient" : selectedRole === "partner" ? "Partner" : "Clinic",
          procedure_name: "Password Recovery",
          date_from: "N/A",
          message: `Your new password is: ${newPassword}. Please log in and change your password.`,
          reply_to: recoveryEmail,
        },
        EMAILJS_CONFIG.publicKey
      );
      toast.success("New password sent to your email.");
      setIsRecovering(false);
      setRecoveryEmail("");
    } catch (err) {
      toast.error("Failed to send email. Please try again.");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const roleButton = (role: UserRole, label: string) => {
    const isActive = selectedRole === role;
    return (
      <button
        key={role}
        type="button"
        onClick={() => setSelectedRole(role)}
        className={`flex-1 flex items-center justify-center py-2 text-[14px] font-medium rounded-xl transition-all duration-200 ${
          isActive
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <>
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container-max section-padding flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Health Bridge" className="h-9 w-auto" />
          <span className="hidden sm:block text-primary" style={{ fontFamily: "'Agbalumo', cursive", fontSize: "1.47rem", lineHeight: "1" }}>Health Bridge</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === l.to
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 lg:gap-3 ml-auto mr-2 lg:mx-0">
          {!user && (
            <Link to="/book" className="hidden lg:block">
              <Button size="sm">Book With Us</Button>
            </Link>
          )}
          {isSopikoPartner && (
            <Link to="/admin" className="hidden lg:block">
              <Button variant="outline" size="sm">Dashboard</Button>
            </Link>
          )}
          {!user && isMobile ? (
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-[14px] font-medium transition-colors bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/80"
            >
              Log in
            </button>
          ) : (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              {user ? (
                <button
                  type="button"
                  className={`flex items-center gap-2.5 rounded-full border px-1.5 py-1.5 pr-4 transition-colors ${
                    menuOpen ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[13px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-[14px] font-medium text-slate-700 max-w-[160px] truncate">{user.email}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${menuOpen ? "rotate-180 text-slate-900" : "text-slate-400"}`} />
                </button>
              ) : (
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border text-[14px] sm:text-[15px] font-medium transition-colors ${
                    menuOpen ? "bg-slate-100 border-transparent text-slate-900" : "bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/80"
                  }`}
                >
                  Log in
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${menuOpen ? "rotate-180 text-slate-900" : "text-slate-400"}`} />
                </button>
              )}
            </PopoverTrigger>

            <PopoverContent align="end" sideOffset={8} className={`p-0 overflow-hidden rounded-[24px] border-border shadow-[0_10px_40px_rgb(0,0,0,0.08)] right-0 ${!user ? "w-[calc(100vw-2rem)] max-w-[360px]" : "w-[240px]"}`}>
              {!user ? (
                isRecovering ? (
                  <div className="p-6">
                    <button
                      type="button"
                      onClick={() => setIsRecovering(false)}
                      className="absolute left-4 top-4 text-slate-400 hover:text-slate-900 transition-colors"
                      aria-label="Back to login"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="text-center mb-5 mt-2">
                      <h3 className="text-xl font-semibold text-foreground">Reset Password</h3>
                      <p className="text-[13.5px] text-muted-foreground mt-1.5 px-2">Enter your email and we'll send you a new password to log in.</p>
                    </div>

                    <form className="space-y-4 pt-2" onSubmit={handleForgotPassword}>
                      <Input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="Email address"
                        required
                        className="rounded-[16px] h-12 px-4 bg-slate-50 border-transparent hover:bg-slate-100/50 focus:bg-white focus:border-slate-200 transition-all text-[15px]"
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={isSending || !recoveryEmail}
                        className="w-full rounded-[16px] h-12 text-[15px] hover:shadow-md transition-shadow mt-4"
                      >
                        {isSending ? "Sending..." : "Reset Password"}
                      </Button>
                    </form>
                  </div>
                ) : (
                <div className="p-6">
                  <div className="text-center mb-5">
                    <h3 className="text-xl font-semibold text-foreground">Welcome back</h3>
                    <p className="text-sm text-muted-foreground mt-1">Please enter your details</p>
                  </div>

                  <div className="flex p-1.5 rounded-2xl bg-slate-100/80 mb-5">
                    {roleButton("user", "Patient")}
                    {roleButton("partner", "Partner")}
                    {roleButton("clinic", "Clinics")}
                  </div>

                  <form className="space-y-4" onSubmit={handleInlineLogin}>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Email address"
                      required
                      className="rounded-[16px] h-12 px-4 bg-slate-50 border-transparent hover:bg-slate-100/50 focus:bg-white focus:border-slate-200 transition-all text-[15px]"
                    />
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      required
                      className="rounded-[16px] h-12 px-4 bg-slate-50 border-transparent hover:bg-slate-100/50 focus:bg-white focus:border-slate-200 transition-all text-[15px]"
                    />
                    <div className="flex items-center justify-between px-1 py-1">
                      <label className="text-[13.5px] text-slate-500 flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" className="w-[18px] h-[18px] rounded border-slate-300 text-primary focus:ring-primary/20 transition-colors cursor-pointer" />
                        Remember me
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setIsRecovering(true)}
                        className="text-[13.5px] font-medium text-slate-900 hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <Button type="submit" className="w-full rounded-[16px] h-12 text-[15px] hover:shadow-md transition-shadow mt-2">Log in</Button>
                  </form>
                </div>
                )
              ) : (
                <div className="w-full flex flex-col">
                  {/* User info header inside dropdown */}
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[14px] font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[12px] text-slate-500 truncate mt-0.5">{user.email}</p>
                    <span className="mt-1.5 inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{user.role}</span>
                  </div>

                  <div className="p-2 space-y-0.5">
                    {user.role === "user" ? (
                      <>
                        <button type="button" onClick={() => { navigate("/dashboard"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-slate-100/80 text-left transition-colors group">
                          <User className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-900 transition-colors" />
                          <span className="text-[14px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">My Bookings</span>
                        </button>
                        <button type="button" onClick={() => { setCurrentPw(""); setNewPw(""); setShowPw(false); setShowUserSecurity(true); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-slate-100/80 text-left transition-colors group">
                          <Shield className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-900 transition-colors" />
                          <span className="text-[14px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Security</span>
                        </button>
                        <button type="button" onClick={() => { setNewName(user?.name || ""); setShowUserSettings(true); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-slate-100/80 text-left transition-colors group">
                          <Settings className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-900 transition-colors" />
                          <span className="text-[14px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Settings</span>
                        </button>
                      </>
                    ) : user.role === "clinic" ? (
                      <>
                        <button type="button" onClick={() => { navigate("/clinic"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-slate-100/80 text-left transition-colors group">
                          <Building2 className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-900 transition-colors" />
                          <span className="text-[14px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Clinic Dashboard</span>
                        </button>
                        <button type="button" onClick={() => { setNewName(user?.name || ""); setShowAccount(true); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-slate-100/80 text-left transition-colors group">
                          <Settings className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-900 transition-colors" />
                          <span className="text-[14px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Account Settings</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => { navigate("/admin"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-slate-100/80 text-left transition-colors group">
                          <LayoutDashboard className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-900 transition-colors" />
                          <span className="text-[14px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">CRM Dashboard</span>
                        </button>
                        <button type="button" onClick={() => { setShowPayout(true); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-slate-100/80 text-left transition-colors group">
                          <Banknote className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-900 transition-colors" />
                          <span className="text-[14px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Payout Settings</span>
                        </button>
                        <button type="button" onClick={() => { setNewName(user?.name || ""); setShowAccount(true); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] hover:bg-slate-100/80 text-left transition-colors group">
                          <Settings className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-900 transition-colors" />
                          <span className="text-[14px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Account Settings</span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="h-px bg-slate-100 w-full" />

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-left hover:bg-red-50 transition-colors group"
                    >
                      <LogOut className="h-[18px] w-[18px] text-slate-400 group-hover:text-red-600 transition-colors" />
                      <span className="text-[14px] font-medium text-slate-600 group-hover:text-red-600 transition-colors">Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="lg:hidden p-2 text-foreground">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="lg:hidden bg-card border-b border-border">
          <nav className="container-max section-padding py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium ${
                  location.pathname === l.to
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              {!user && (
                <Link to="/book" className="flex-1" onClick={() => setOpen(false)}>
                  <Button size="sm" className="w-full">Book With Us</Button>
                </Link>
              )}
              {isSopikoPartner && (
                <Link to="/admin" onClick={() => setOpen(false)} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Dashboard</Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>

    {/* ── Payout Settings Modal ── */}
    <Dialog open={showPayout} onOpenChange={setShowPayout}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" /> Payout Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">Commission Structure</p>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Your commission</span>
            <span className="font-bold text-foreground">20%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Clinic share</span>
            <span className="font-semibold text-foreground">70%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform fee</span>
            <span className="font-semibold text-foreground">10%</span>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Account Holder Name</label>
            <Input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Full legal name" className="rounded-[14px] h-11" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Bank Name</label>
            <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. TBC Bank" className="rounded-[14px] h-11" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">IBAN</label>
            <Input value={iban} onChange={e => setIban(e.target.value.toUpperCase())} placeholder="GE00TB0000000000000000" className="rounded-[14px] h-11 font-mono" />
          </div>
        </div>
        <Button className="w-full rounded-[14px] h-11 mt-2" onClick={() => { toast.success("Payout details saved."); setShowPayout(false); }}>
          Save Payout Details
        </Button>
      </DialogContent>
    </Dialog>

    {/* ── User Security Modal ── */}
    <Dialog open={showUserSecurity} onOpenChange={setShowUserSecurity}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Security</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Change your account password below.</p>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Current Password</label>
            <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password" className="rounded-[14px] h-11" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">New Password</label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Enter new password" className="rounded-[14px] h-11 pr-10" />
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
        <Button
          className="w-full rounded-[14px] h-11 mt-2"
          disabled={!currentPw || !newPw}
          onClick={() => {
            if (changePassword(currentPw, newPw)) {
              toast.success("Password updated successfully.");
              setShowUserSecurity(false);
              setCurrentPw(""); setNewPw("");
            } else {
              toast.error("Current password is incorrect.");
            }
          }}
        >
          Update Password
        </Button>
      </DialogContent>
    </Dialog>

    {/* ── User Settings Modal ── */}
    <Dialog open={showUserSettings} onOpenChange={setShowUserSettings}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} className="rounded-[14px] h-11" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
            <Input value={user?.email || ""} disabled className="rounded-[14px] h-11 opacity-60" />
          </div>
        </div>
        <Button
          className="w-full rounded-[14px] h-11 mt-2"
          disabled={!newName.trim() || newName.trim() === user?.name}
          onClick={() => {
            updateUser({ name: newName.trim() });
            toast.success("Settings saved.");
            setShowUserSettings(false);
          }}
        >
          Save Changes
        </Button>
      </DialogContent>
    </Dialog>

    {/* ── Account Settings Modal ── */}
    <Dialog open={showAccount} onOpenChange={setShowAccount}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Account Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} className="rounded-[14px] h-11" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
            <Input value={user?.email || ""} disabled className="rounded-[14px] h-11 opacity-60" />
          </div>
          <div className="pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Change Password</p>
            <div className="space-y-2">
              <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" className="rounded-[14px] h-11" />
              <div className="relative">
                <Input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password" className="rounded-[14px] h-11 pr-10" />
                <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
        <Button className="w-full rounded-[14px] h-11 mt-2" onClick={() => { toast.success("Account updated successfully."); setShowAccount(false); setCurrentPw(""); setNewPw(""); }}>
          Save Changes
        </Button>
      </DialogContent>
    </Dialog>
    </>
  );
}
