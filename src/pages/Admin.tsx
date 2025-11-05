import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { RaffleForm } from "@/components/admin/RaffleForm";
import { RaffleList } from "@/components/admin/RaffleList";
import { AdminManagement } from "@/components/admin/AdminManagement";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type Raffle = Database["public"]["Tables"]["raffles"]["Row"];

const Admin = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, isSuperAdmin, mustChangePassword, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        navigate("/auth", { replace: true });
      } else if (mustChangePassword) {
        navigate("/change-password", { replace: true });
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
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1">
                  {isSuperAdmin ? "Panel de Super Administrador" : "Panel de Administrador"}
                </h1>
                <p className="text-muted-foreground">
                  {isSuperAdmin 
                    ? "Gestiona rifas y administradores del sistema" 
                    : "Gestiona tus rifas y revisa el estado de los tickets"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {!showForm ? (
            <div className="space-y-6">
              {/* Solo el super admin ve la gestión de administradores */}
              {isSuperAdmin && <AdminManagement />}
              
              {/* Ambos roles ven la gestión de rifas */}
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
    </>
  );
};

export default Admin;
