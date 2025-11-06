import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ReceitasEmptyProps {
  onAddReceita: () => void;
  onAddMedicamento: () => void;
}

export function ReceitasEmpty({ onAddReceita, onAddMedicamento }: ReceitasEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg text-muted-foreground mb-6">
        Nenhuma receita cadastrada ainda.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={onAddMedicamento}>
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Medicamento
        </Button>
        <Button onClick={onAddReceita} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Receita
        </Button>
      </div>
    </div>
  );
}
