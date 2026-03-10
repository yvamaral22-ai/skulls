
export const SERVICES = [
  { id: '1', name: 'Corte Masculino', price: 50, duration: 30 },
  { id: '2', name: 'Barba', price: 30, duration: 20 },
  { id: '3', name: 'Combo Corte + Barba', price: 70, duration: 50 },
  { id: '4', name: 'Sobrancelha', price: 15, duration: 10 },
  { id: '5', name: 'Pigmentação', price: 40, duration: 30 },
  { id: '6', name: 'Luzes / Reflexo', price: 120, duration: 90 },
];

export const STAFF = [
  { id: 's1', name: 'Carlos "Navalha"', commissionRate: 0.4, isActive: true, role: 'barber' },
  { id: 's2', name: 'Vitor "Degradê"', commissionRate: 0.4, isActive: true, role: 'barber' },
];

export const PRODUCTS = [
  'Pomada Efeito Matte',
  'Óleo para Barba Premium',
  'Shampoo Anticaspa 3 em 1',
  'Gel de Barbear Transparente',
  'Pós-barba Refrescante',
];

export const CUSTOMERS = [
  { id: 'c1', name: 'Lucas Oliveira', phone: '(11) 98765-4321', preferences: 'Gosta de corte degrade baixo, prefere silêncio durante o corte.', history: ['Corte Masculino', 'Barba', 'Corte Masculino'] },
  { id: 'c2', name: 'Gabriel Santos', phone: '(11) 91234-5678', preferences: 'Sempre usa pomada matte, gosta de conversar sobre futebol.', history: ['Combo Corte + Barba', 'Combo Corte + Barba'] },
  { id: 'c3', name: 'Matheus Pereira', phone: '(11) 97777-8888', preferences: 'Cabelo sensível, prefere produtos sem álcool.', history: ['Corte Masculino', 'Sobrancelha'] },
  { id: 'c4', name: 'Felipe Costa', phone: '(11) 96666-5555', preferences: 'Costuma mudar o estilo a cada visita.', history: ['Luzes / Reflexo', 'Corte Masculino'] },
];

export const APPOINTMENTS = [
  { id: 'a1', customerId: 'c1', staffId: 's1', serviceId: '1', date: '2025-05-20', time: '09:00', status: 'completed', priceAtAppointment: 50, commissionAtAppointment: 20 },
  { id: 'a2', customerId: 'c2', staffId: 's2', serviceId: '3', date: '2025-05-20', time: '10:30', status: 'completed', priceAtAppointment: 70, commissionAtAppointment: 28 },
  { id: 'a3', customerId: 'c3', staffId: 's1', serviceId: '1', date: '2025-05-20', time: '14:00', status: 'confirmed', priceAtAppointment: 50, commissionAtAppointment: 0 },
  { id: 'a4', customerId: 'c4', staffId: 's2', serviceId: '6', date: '2025-05-21', time: '11:00', status: 'confirmed', priceAtAppointment: 120, commissionAtAppointment: 0 },
  // Dados históricos para relatórios
  { id: 'h1', customerId: 'c1', staffId: 's1', serviceId: '1', date: '2025-03-05', time: '09:00', status: 'completed', priceAtAppointment: 50, commissionAtAppointment: 20 },
  { id: 'h2', customerId: 'c2', staffId: 's2', serviceId: '3', date: '2025-03-15', time: '10:30', status: 'completed', priceAtAppointment: 70, commissionAtAppointment: 28 },
  { id: 'h3', customerId: 'c1', staffId: 's1', serviceId: '2', date: '2025-03-25', time: '11:00', status: 'completed', priceAtAppointment: 30, commissionAtAppointment: 12 },
];

export const EXPENSES = [
  { id: 'e1', description: 'Aluguel', amount: 1500, date: '2025-03-01' },
  { id: 'e2', description: 'Energia', amount: 300, date: '2025-03-10' },
  { id: 'e3', description: 'Produtos Limpeza', amount: 150, date: '2025-03-15' },
];

export const TRENDING_SERVICES = ['Pigmentação', 'Combo Corte + Barba', 'Platinado'];
export const TRENDING_PRODUCTS = ['Pomada Efeito Matte', 'Óleo para Barba Premium'];
