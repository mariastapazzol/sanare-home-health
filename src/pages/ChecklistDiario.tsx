import { ChecklistToday } from "@/components/ChecklistToday";

export default function ChecklistDiario() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Checklist Diário</h1>
          <p className="text-muted-foreground">
            Acompanhe suas tarefas diárias. A lista reseta automaticamente à meia-noite.
          </p>
        </div>
        
        <ChecklistToday />
      </div>
    </div>
  );
}
