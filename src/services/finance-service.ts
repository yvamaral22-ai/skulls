
'use client';

/**
 * @fileOverview Lógica de negócio simplificada para cálculos de faturamento.
 */

interface AppointmentData {
  price: number;
}

/**
 * Calcula o faturamento total bruto de uma lista de agendamentos.
 * 
 * @param appointments Lista de agendamentos finalizados.
 * @returns O valor total em reais.
 */
export function calculateTotalRevenue(appointments: AppointmentData[]): number {
  return appointments.reduce((sum, appt) => sum + (appt.price || 0), 0);
}
