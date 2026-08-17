import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth, type UserRole } from "@/store/authStore";
import { ArrowLeft, X } from "lucide-react";
import emailjs from "@emailjs/browser";
import { EMAILJS_CONFIG, isEmailJSConfigured } from "@/lib/emailjs";

export default function AuthPage() {
  const { user, login, isPartnerUser, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");

  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryEmailError, setRecoveryEmailError] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!recoveryEmail) return;

    if (!isEmailJSConfigured()) {
      toast.error("Email service is not configured.");
      return;
    }

    const newPassword = Math.random().toString(36).slice(-8);
    const success = resetPassword(recoveryEmail, role, newPassword);

    if (!success) {
      setRecoveryEmailError(true);
      return;
    }
    setRecoveryEmailError(false);

    try {
      setIsSending(true);
      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        {
          email: recoveryEmail,
          patient_name: role === "user" ? "Patient" : role === "partner" ? "Partner" : "Clinic",
          procedure_name: "Password Recovery",
          date_from: "N/A",
          message: `Your new password is: ${newPassword}. Please log in and change your password.`,
          reply_to: recoveryEmail,
        },
        { publicKey: EMAILJS_CONFIG.publicKey }
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

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = login({ email, password, role });
    if (!result.ok) {
      toast.error(result.error || "Login failed");
      return;
    }

    toast.success("Logged in successfully");

    if (role === "partner") {
      navigate(from || "/admin", { replace: true });
      return;
    }

    navigate(from || "/", { replace: true });
  };

  const roleButton = (r: UserRole, label: string) => {
    const isActive = role === r;
    return (
      <button
        key={r}
        type="button"
        onClick={() => setRole(r)}
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

  if (user) {
    return (
      <div className="container-max section-padding py-16">
        <div className="max-w-md mx-auto p-6 md:p-8 rounded-[24px] border border-border shadow-[0_10px_40px_rgb(0,0,0,0.08)] bg-card text-center space-y-3">
            <h1 className="text-2xl font-semibold text-foreground">Already logged in</h1>
            <p className="text-muted-foreground text-sm">
              Signed in as {user.name}.
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              {isPartnerUser && <Button className="rounded-xl h-10" onClick={() => navigate("/admin")}>Go to Admin</Button>}
              <Button variant="outline" className="rounded-xl h-10" onClick={() => navigate("/")}>Back to Home</Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-slate-50/60 px-4 pt-8 pb-16">
      <div className="w-full max-w-[360px] p-6 rounded-[24px] border border-border shadow-[0_10px_40px_rgb(0,0,0,0.08)] bg-card relative">
        {isRecovering ? (
          <>
            <button
              type="button"
              onClick={() => setIsRecovering(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="text-center mb-5 mt-2">
              <h3 className="text-xl font-semibold text-foreground">Reset Password</h3>
              <p className="text-[13.5px] text-muted-foreground mt-1.5 px-2">Enter your email and we'll send you a new password.</p>
            </div>
            {recoveryEmailError && (
              <div className="fixed top-4 left-1/2 z-[100] w-[calc(100vw-2rem)] max-w-[360px] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-red-500 shadow-lg animate-slide-down-notif">
                <p className="text-[13.5px] text-white font-medium flex-1">No account found with that email address. !</p>
                <button type="button" onClick={() => setRecoveryEmailError(false)} className="text-white/80 hover:text-white transition-colors ml-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <form className="space-y-4 pt-2" onSubmit={handleForgotPassword}>
              <Input
                type="email"
                value={recoveryEmail}
                onChange={(e) => { setRecoveryEmail(e.target.value); setRecoveryEmailError(false); }}
                placeholder="Email address"
                required
                className={`rounded-[16px] h-12 px-4 transition-all text-[15px] ${
                  recoveryEmailError
                    ? "bg-red-50 border border-red-300 focus:border-red-300 focus:bg-red-50"
                    : "bg-slate-50 border-transparent hover:bg-slate-100/50 focus:bg-white focus:border-slate-200"
                }`}
              />
              <Button
                type="submit"
                disabled={isSending || !recoveryEmail}
                className="w-full rounded-[16px] h-12 text-[15px] hover:shadow-md transition-shadow mt-4"
              >
                {isSending ? "Sending..." : "Reset Password"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-5">
              <h3 className="text-xl font-semibold text-foreground">Welcome back</h3>
              <p className="text-sm text-muted-foreground mt-1">Please enter your details</p>
            </div>

            <div className="flex p-1.5 rounded-2xl bg-slate-100/80 mb-5">
              {roleButton("user", "Patient")}
              {roleButton("partner", "Partner")}
              {roleButton("clinic", "Clinics")}
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="rounded-[16px] h-12 px-4 bg-slate-50 border-transparent hover:bg-slate-100/50 focus:bg-white focus:border-slate-200 transition-all text-[15px]"
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          </>
        )}
      </div>
    </div>
  );
}
