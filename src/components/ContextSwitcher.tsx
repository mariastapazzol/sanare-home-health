import { useCareContext } from '@/hooks/use-care-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from 'lucide-react';

const ContextSwitcher = () => {
  const { contexts, currentContext, setCurrentContext, userRole } = useCareContext();

  // Only show for caregivers with multiple contexts
  if (userRole !== 'cuidador' || contexts.length <= 1) {
    return null;
  }

  return (
    <div className="w-full max-w-xs">
      <Select
        value={currentContext?.id}
        onValueChange={(value) => {
          const ctx = contexts.find(c => c.id === value);
          if (ctx) setCurrentContext(ctx);
        }}
      >
        <SelectTrigger className="w-full bg-card">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <SelectValue placeholder="Selecionar contexto" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {contexts.map((ctx) => (
            <SelectItem key={ctx.id} value={ctx.id}>
              {ctx.tipo === 'self' ? 'Meu Perfil' : ctx.owner_name || 'Dependente'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ContextSwitcher;
