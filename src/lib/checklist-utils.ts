import { formatInTimeZone } from 'date-fns-tz';

const TIMEZONE = "America/Sao_Paulo";

/**
 * Obtém a data de hoje no timezone de São Paulo
 * Retorna no formato 'YYYY-MM-DD'
 */
export function getTodayKey(): string {
  return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Calcula os milissegundos até a próxima meia-noite no timezone de São Paulo
 * @param tz - Timezone (default: "America/Sao_Paulo")
 * @returns Milissegundos até 00:00:00 do próximo dia no horário de São Paulo
 */
export function millisToNextMidnight(tz: string = TIMEZONE): number {
  const now = new Date();
  
  // Obter a data/hora atual em São Paulo
  const nowInSaoPaulo = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  
  // Criar meia-noite de amanhã em São Paulo
  const tomorrowInSaoPaulo = new Date(nowInSaoPaulo);
  tomorrowInSaoPaulo.setDate(tomorrowInSaoPaulo.getDate() + 1);
  tomorrowInSaoPaulo.setHours(0, 0, 0, 0);
  
  // Calcular diferença em milissegundos
  const msUntilMidnight = tomorrowInSaoPaulo.getTime() - nowInSaoPaulo.getTime();
  
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
