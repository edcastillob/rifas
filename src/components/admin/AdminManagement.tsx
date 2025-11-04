import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

interface Admin {
  id: string;
  user_id: string;
  role: string;
  email: string;
}

export const AdminManagement = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const fetchAdmins = async () => {
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("*");

    if (error) {
      console.error("Error fetching admins:", error);
      return;
    }

    const adminsWithEmails = await Promise.all(
      (roles || []).map(async (role) => {
        const { data: email, error: emailError } = await supabase
          .rpc("get_user_email", { _user_id: role.user_id });
        
        return {
          ...role,
          email: email || "Unknown",
        };
      })
    );

    setAdmins(adminsWithEmails);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = emailSchema.safeParse({ email: newEmail, password: newPassword });
    if (!validation.success) {
      toast({
        title: "Error de validación",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (signUpError) {
      toast({
        title: "Error",
        description: signUpError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ 
          user_id: authData.user.id, 
          role: "admin",
          must_change_password: true 
        });

      if (roleError) {
        toast({
          title: "Error",
          description: "No se pudo asignar el rol de administrador",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Administrador creado correctamente. El usuario deberá cambiar su contraseña en el primer inicio de sesión.",
        });
        setNewEmail("");
        setNewPassword("");
        fetchAdmins();
      }
    }

    setLoading(false);
  };

  const handleDeleteAdmin = async (userId: string, email: string) => {
    if (email === "edwar.castillo@gmail.com") {
      toast({
        title: "Error",
        description: "No se puede eliminar al super administrador",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el administrador",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Administrador eliminado correctamente",
      });
      fetchAdmins();
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Card className="border-primary/20 shadow-card">
      <CardHeader>
        <CardTitle>Gestión de Administradores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email del nuevo administrador</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Contraseña</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Crear Administrador
          </Button>
        </form>

        <div className="space-y-2">
          <h3 className="font-semibold">Administradores Actuales</h3>
          <div className="space-y-2">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 border rounded-lg border-border"
              >
                <div>
                  <p className="font-medium">{admin.email}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {admin.role.replace("_", " ")}
                  </p>
                </div>
                {admin.email !== "edwar.castillo@gmail.com" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteAdmin(admin.user_id, admin.email)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
