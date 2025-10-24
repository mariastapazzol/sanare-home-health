import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface UploadReceitaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomeMedicamento: string;
  onNomeChange: (nome: string) => void;
  uploading: boolean;
  onFileSelect: (file: File) => void;
}

export function UploadReceitaDialog({
  open,
  onOpenChange,
  nomeMedicamento,
  onNomeChange,
  uploading,
  onFileSelect,
}: UploadReceitaDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Receita</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Nome da Receita
            </label>
            <Input
              type="text"
              placeholder="Ex: Receita Dipirona"
              value={nomeMedicamento}
              onChange={(e) => onNomeChange(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !nomeMedicamento.trim()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Enviando..." : "Selecionar Foto da Receita"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
