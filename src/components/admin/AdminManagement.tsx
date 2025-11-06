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

interface User {
  user_id: string;
  email: string;
  role: string | null;
  created_at: string;
  must_change_password: boolean;
}

interface EditingUser {
  user_id: string;
  role: "admin" | "super_admin";
}

export const AdminManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    const { data, error } = await supabase.rpc("get_all_users_with_roles");

    if (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
      return;
    }

    setUsers(data || []);
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
        fetchUsers();
      }
    }

    setLoading(false);
  };

  const handleDeleteRole = async (userId: string, email: string) => {
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
        description: "No se pudo eliminar el rol",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Rol eliminado correctamente",
      });
      fetchUsers();
    }
  };

  const handleEditRole = async () => {
    if (!editingUser) return;

    // Si el usuario ya tiene un rol, actualizamos
    const userHasRole = users.find(u => u.user_id === editingUser.user_id)?.role;

    if (userHasRole) {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: editingUser.role as "admin" | "super_admin" })
        .eq("user_id", editingUser.user_id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el rol",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Si no tiene rol, insertamos uno nuevo
      const { error } = await supabase
        .from("user_roles")
        .insert([{ 
          user_id: editingUser.user_id, 
          role: editingUser.role as "admin" | "super_admin",
          must_change_password: true 
        }]);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo asignar el rol",
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Éxito",
      description: "Rol actualizado correctamente",
    });
    setEditingUser(null);
    fetchUsers();
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
          <h3 className="font-semibold">Usuarios Registrados</h3>
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between p-3 border rounded-lg border-border"
              >
                <div className="flex-1">
                  <p className="font-medium">{user.email}</p>
                  {editingUser?.user_id === user.user_id ? (
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as "admin" | "super_admin" })}
                      className="mt-1 text-sm border rounded px-2 py-1 bg-background"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  ) : (
                    <p className="text-sm text-muted-foreground capitalize">
                      {user.role ? user.role.replace("_", " ") : "Sin rol asignado"}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Registrado: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {editingUser?.user_id === user.user_id ? (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleEditRole}
                      >
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(null)}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser({ user_id: user.user_id, role: (user.role || "admin") as "admin" | "super_admin" })}
                        disabled={user.email === "edwar.castillo@gmail.com"}
                      >
                        Editar Rol
                      </Button>
                      {user.role && user.email !== "edwar.castillo@gmail.com" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRole(user.user_id, user.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
