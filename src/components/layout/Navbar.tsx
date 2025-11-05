import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Ticket, LayoutDashboard } from "lucide-react";

export const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = location.pathname === '/auth';

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Ticket className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Sistema de Rifas
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {!isAdminRoute && !isAuthRoute && (
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className={location.pathname === "/" ? "bg-muted" : ""}
              >
                <Ticket className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Rifas</span>
              </Button>
            )}

            {isAdmin && !isAuthRoute && (
              <Button
                variant="ghost"
                onClick={() => navigate("/admin")}
                className={isAdminRoute ? "bg-muted" : ""}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            )}

            {/* Auth Actions */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {user.email}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </div>
            ) : (
              !isAuthRoute && (
                <Button
                  variant="default"
                  onClick={() => navigate("/auth")}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
