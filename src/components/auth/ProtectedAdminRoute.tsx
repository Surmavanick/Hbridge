import { Navigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/authStore";

export default function ProtectedAdminRoute({ children }: { children: React.ReactElement }) {
  const { user, isSopikoPartner, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (!isSopikoPartner) {
    return (
      <div className="container-max section-padding py-16">
        <div className="max-w-xl mx-auto rounded-2xl border border-border bg-card p-6 text-center space-y-3">
          <h1 className="text-2xl font-heading font-bold text-foreground">Access Restricted</h1>
          <p className="text-muted-foreground">
            This dashboard is available only for the partner account: Sopiko Sergia.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <Button variant="outline" onClick={logout}>Log out</Button>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
