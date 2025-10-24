import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReceitaCardProps {
  receita: {
    id: string;
    nome: string;
    imagem_url: string;
    usada: boolean;
  };
  onClick: () => void;
}

export function ReceitaCard({ receita, onClick }: ReceitaCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="aspect-square relative">
          <img
            src={receita.imagem_url}
            alt={`Receita de ${receita.nome}`}
            className="w-full h-full object-cover"
          />
          {receita.usada && (
            <Badge 
              className="absolute top-2 right-2 bg-green-600 hover:bg-green-700 text-white"
            >
              Usada
            </Badge>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-foreground truncate">
            {receita.nome}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
