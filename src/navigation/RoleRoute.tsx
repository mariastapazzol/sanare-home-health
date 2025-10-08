import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { usePerfil } from "@/hooks/use-perfil";

type Papel = 'cuidador' | 'paciente_dependente' | 'paciente_autonomo';

interface RoleRouteProps {
  allow: Papel[];
  children: ReactNode;
}

export function RoleRoute({ allow, children }: RoleRouteProps) {
  const { status, papel } = usePerfil();
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!papel) {
    return <Navigate to="/home" replace />;
  }
  
  if (!allow.includes(papel)) {
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
}
