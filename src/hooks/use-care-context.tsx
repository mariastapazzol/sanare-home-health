import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

interface CareContext {
  id: string;
  owner_user_id: string;
  caregiver_user_id: string | null;
  type: 'self' | 'dependent';
  owner_name?: string;
}

interface CareContextType {
  contexts: CareContext[];
  currentContext: CareContext | null;
  setCurrentContext: (context: CareContext) => void;
  loading: boolean;
  userRole: 'paciente_autonomo' | 'cuidador' | 'dependente' | null;
}

const CareContextContext = createContext<CareContextType | undefined>(undefined);

export function CareContextProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [contexts, setContexts] = useState<CareContext[]>([]);
  const [currentContext, setCurrentContext] = useState<CareContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'paciente_autonomo' | 'cuidador' | 'dependente' | null>(null);

  useEffect(() => {
    if (!user) {
      setContexts([]);
      setCurrentContext(null);
      setUserRole(null);
      setLoading(false);
      return;
    }

    loadContexts();
  }, [user]);

  const loadContexts = async () => {
    if (!user) return;

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserRole(profile.role as 'paciente_autonomo' | 'cuidador' | 'dependente');
      }

      // Get all contexts for this user (as owner or caregiver)
      const { data: contextsData, error } = await supabase
        .from('care_contexts')
        .select('*')
        .or(`owner_user_id.eq.${user.id},caregiver_user_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading contexts:', error);
        setLoading(false);
        return;
      }

      let contexts = contextsData || [];

      // Auto-create self context for paciente_autonomo and cuidador if not exists
      if (profile && (profile.role === 'paciente_autonomo' || profile.role === 'cuidador')) {
        const hasSelfContext = contexts.some(c => c.type === 'self' && c.owner_user_id === user.id);
        
        if (!hasSelfContext) {
          console.log('Creating self context for user:', user.id);
          const { data: newContext, error: createError } = await supabase
            .from('care_contexts')
            .insert([{ 
              type: 'self', 
              owner_user_id: user.id,
              caregiver_user_id: null
            }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating self context:', createError);
          } else if (newContext) {
            contexts = [newContext, ...contexts];
          }
        }
      }

      // Load owner names for dependent contexts
      const contextsWithNames: CareContext[] = await Promise.all(
        contexts.map(async (ctx) => {
          if (ctx.type === 'dependent') {
            const { data: ownerProfile } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', ctx.owner_user_id)
              .single();
            
            return {
              id: ctx.id,
              owner_user_id: ctx.owner_user_id,
              caregiver_user_id: ctx.caregiver_user_id,
              type: ctx.type as 'self' | 'dependent',
              owner_name: ownerProfile?.name
            };
          }
          return {
            id: ctx.id,
            owner_user_id: ctx.owner_user_id,
            caregiver_user_id: ctx.caregiver_user_id,
            type: ctx.type as 'self' | 'dependent'
          };
        })
      );

      setContexts(contextsWithNames);

      // Set current context to the first one (self) if not set
      if (!currentContext && contextsWithNames.length > 0) {
        const selfContext = contextsWithNames.find(c => c.type === 'self' && c.owner_user_id === user.id);
        setCurrentContext(selfContext || contextsWithNames[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error in loadContexts:', error);
      setLoading(false);
    }
  };

  return (
    <CareContextContext.Provider value={{
      contexts,
      currentContext,
      setCurrentContext,
      loading,
      userRole
    }}>
      {children}
    </CareContextContext.Provider>
  );
}

export function useCareContext() {
  const context = useContext(CareContextContext);
  if (context === undefined) {
    throw new Error('useCareContext must be used within a CareContextProvider');
  }
  return context;
}
