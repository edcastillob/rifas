import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { RaffleForm } from "@/components/admin/RaffleForm";
import { RaffleList } from "@/components/admin/RaffleList";
import type { Database } from "@/integrations/supabase/types";

type Raffle = Database["public"]["Tables"]["raffles"]["Row"];

const Admin = () => {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRaffles();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">Gestiona tus rifas y revisa el estado de los tickets</p>
        </header>

        {!showForm ? (
          <div className="space-y-6">
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
