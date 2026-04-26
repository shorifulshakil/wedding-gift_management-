import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, UserCog, Heart } from "lucide-react";

export const AppHeader = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const linkCls = (path: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
      location.pathname === path
        ? "bg-secondary text-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
    }`;

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-600" fill="currentColor" />
          <span className="font-display text-xl font-extrabold uppercase tracking-wider bg-gradient-to-r from-primary via-accent to-teal bg-clip-text text-transparent drop-shadow-sm">
            WEDDING GIFT MANAGER
          </span>
        </Link>
        {user && (
          <nav className="flex items-center gap-1">
            <Link to="/dashboard" className={linkCls("/dashboard")}>
              <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to="/profile" className={linkCls("/profile")}>
              <UserCog className="h-4 w-4" /> <span className="hidden sm:inline">Profile</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline ml-1">Sign out</span>
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
};
