'use client';

/**
 * @fileOverview Lógica de negócio para cálculos financeiros e comissões.
 */

interface AppointmentData {
  price: number;
  commissionRate?: number;
}

interface StaffData {
  commissionRate: number;
}

/**
 * Calcula a comissão de um barbeiro para um serviço específico.
 * Prioriza a taxa de comissão definida no momento do agendamento (histórico),
 * caso contrário, utiliza a taxa atual do barbeiro.
 * 
 * @param appointment Dados do agendamento
 * @param staff Dados do barbeiro
 * @returns O valor em reais da comissão
 */
export function calculateStaffCommission(appointment: AppointmentData, staff: StaffData): number {
  const rate = appointment.commissionRate ?? staff.commissionRate;
  return appointment.price * rate;
}

/**
 * Calcula o resumo financeiro de um período.
 */
export function calculateNetProfit(totalRevenue: number, totalCommissions: number, totalExpenses: number): number {
  return totalRevenue - totalCommissions - totalExpenses;
}
