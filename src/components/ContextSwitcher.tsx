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
  const { contexts, currentContext, setCurrentContext, userRole, selectDependent } = useCareContext();

  // Never show for caregivers or autonomous patients - they have a fixed context
  if (userRole === 'cuidador' || userRole === 'paciente_autonomo') {
    return null;
  }
  
  // Only show for dependents with multiple contexts
  if (contexts.length <= 1) {
    return null;
  }

  const handleContextChange = async (value: string) => {
    const ctx = contexts.find(c => c.id === value);
    if (ctx) {
      // Se é um contexto de dependente, usar selectDependent para garantir que existe
      if (ctx.tipo === 'dependent' && ctx.dependente_id) {
        await selectDependent(ctx.dependente_id, ctx.owner_name);
      } else {
        setCurrentContext(ctx);
      }
    }
  };

  return (
    <div className="w-full max-w-xs">
      <Select
        value={currentContext?.id}
        onValueChange={handleContextChange}
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
