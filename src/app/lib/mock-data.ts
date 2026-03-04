export const SERVICES = [
  { id: '1', name: 'Corte Masculino', price: 50, duration: 30 },
  { id: '2', name: 'Barba', price: 30, duration: 20 },
  { id: '3', name: 'Combo Corte + Barba', price: 70, duration: 50 },
  { id: '4', name: 'Sobrancelha', price: 15, duration: 10 },
  { id: '5', name: 'Pigmentação', price: 40, duration: 30 },
  { id: '6', name: 'Luzes / Reflexo', price: 120, duration: 90 },
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
  { id: 'a1', customerId: 'c1', serviceId: '1', date: '2025-05-20', time: '09:00', status: 'completed' },
  { id: 'a2', customerId: 'c2', serviceId: '3', date: '2025-05-20', time: '10:30', status: 'confirmed' },
  { id: 'a3', customerId: 'c3', serviceId: '1', date: '2025-05-20', time: '14:00', status: 'confirmed' },
  { id: 'a4', customerId: 'c4', serviceId: '6', date: '2025-05-21', time: '11:00', status: 'confirmed' },
];

export const TRENDING_SERVICES = ['Pigmentação', 'Combo Corte + Barba', 'Platinado'];
export const TRENDING_PRODUCTS = ['Pomada Efeito Matte', 'Óleo para Barba Premium'];
