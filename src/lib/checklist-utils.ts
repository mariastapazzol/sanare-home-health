import { supabase } from "@/integrations/supabase/client";

const TIMEZONE = "America/Sao_Paulo";

/**
 * Obtém a data de hoje do servidor no timezone de São Paulo
 * Retorna no formato 'YYYY-MM-DD'
 */
export async function getTodayKeyFromServer(): Promise<string> {
  const { data, error } = await supabase.rpc('server_time_sampa');
  
  if (error) {
    console.error('Erro ao buscar hora do servidor:', error);
    // Fallback para hora local se a RPC falhar
    return getLocalDateKey();
  }
  
  // Converter timestamptz para data YYYY-MM-DD
  const serverDate = new Date(data);
  return serverDate.toISOString().split('T')[0];
}

/**
 * Obtém a data local (fallback)
 */
function getLocalDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calcula os milissegundos até a próxima meia-noite no timezone especificado
 * @param tz - Timezone (default: "America/Sao_Paulo")
 * @returns Milissegundos até 00:00:00 do próximo dia
 */
export function millisToNextMidnight(tz: string = TIMEZONE): number {
  const now = new Date();
  
  // Criar data para meia-noite de amanhã no timezone local
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  // Calcular diferença em milissegundos
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  
  return Math.max(msUntilMidnight, 0);
}

/**
 * Formata uma data para exibição (DD/MM/YYYY)
 */
export function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Obtém as últimas N datas para histórico
 */
export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < n; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Cache local para estado offline-first
 */
export const checklistCache = {
  key: 'checklist_cache',
  
  save(todayKey: string, data: any) {
    try {
      localStorage.setItem(this.key, JSON.stringify({ todayKey, data, timestamp: Date.now() }));
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  },
  
  load(): { todayKey: string; data: any; timestamp: number } | null {
    try {
      const cached = localStorage.getItem(this.key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Erro ao carregar cache:', error);
      return null;
    }
  },
  
  clear() {
    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }
};
