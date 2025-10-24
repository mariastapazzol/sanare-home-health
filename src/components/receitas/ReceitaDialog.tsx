import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";

interface ReceitaDialogProps {
  receita: {
    id: string;
    nome: string;
    imagem_url: string;
    usada: boolean;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleUsada: () => void;
  onExcluir: () => void;
}

export function ReceitaDialog({ 
  receita, 
  open, 
  onOpenChange, 
  onToggleUsada, 
  onExcluir 
}: ReceitaDialogProps) {
  if (!receita) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{receita.nome}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="w-full flex justify-center">
            <img
              src={receita.imagem_url}
              alt={`Receita de ${receita.nome}`}
              className="max-h-[60vh] object-contain"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant={receita.usada ? "outline" : "default"}
              onClick={onToggleUsada}
            >
              {receita.usada ? "Desmarcar como Usada" : "Marcar como Usada"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={onExcluir}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Receita
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
