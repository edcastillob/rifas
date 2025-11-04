import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LogOut } from "lucide-react";
import { RaffleForm } from "@/components/admin/RaffleForm";
import { RaffleList } from "@/components/admin/RaffleList";
import { AdminManagement } from "@/components/admin/AdminManagement";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type Raffle = Database["public"]["Tables"]["raffles"]["Row"];

const Admin = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, mustChangePassword, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        navigate("/auth");
      } else if (mustChangePassword) {
        navigate("/change-password");
      }
    }
  }, [authLoading, isAdmin, mustChangePassword, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchRaffles();
    }
  }, [isAdmin]);

  const fetchRaffles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("raffles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRaffles(data || []);
    } catch (error) {
      console.error("Error fetching raffles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (raffle: Raffle) => {
    setEditingRaffle(raffle);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRaffle(null);
    fetchRaffles();
  };

  if (authLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                Panel de Administración
              </h1>
              <p className="text-muted-foreground">Gestiona tus rifas y revisa el estado de los tickets</p>
              <p className="text-sm text-muted-foreground mt-1">Usuario: {user?.email}</p>
            </div>
            <Button variant="outline" onClick={async () => {
              await signOut();
              navigate("/auth");
            }} className="gap-2">
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </header>

        {!showForm ? (
          <div className="space-y-6">
            <AdminManagement />
            
            <Card className="border-primary/20 shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rifas Creadas</CardTitle>
                  <Button onClick={() => setShowForm(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Rifa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <RaffleList
                  raffles={raffles}
                  loading={loading}
                  onEdit={handleEdit}
                  onRefresh={fetchRaffles}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-primary/20 shadow-card">
            <CardHeader>
              <CardTitle>{editingRaffle ? "Editar Rifa" : "Nueva Rifa"}</CardTitle>
            </CardHeader>
            <CardContent>
              <RaffleForm
                raffle={editingRaffle}
                onClose={handleFormClose}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;
