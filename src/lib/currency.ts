export function formatBRL(raw: string): string {
  let v = raw;
  if (!v.includes(',')) {
    v = v.replace(/\.(\d{0,2})$/, ',$1');
  }
  v = v.replace(/\./g, '');
  v = v.replace(/[^0-9,]/g, '');
  const commaIndex = v.indexOf(',');
  if (commaIndex !== -1) {
    const intPart = v.slice(0, commaIndex);
    const decPart = v.slice(commaIndex + 1).replace(/,/g, '').slice(0, 2);
    const formattedInt = (intPart || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return formattedInt + ',' + decPart;
  }
  return v.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseBRL(formatted: string): number {
  const normalized = formatted.replace(/\./g, '').replace(',', '.');
  const val = parseFloat(normalized);
  return isNaN(val) ? 0 : val;
}

export const PAYMENT_METHODS = [
  'Dinheiro',
  'PIX',
  'Cartão de Débito',
  'Cartão de Crédito',
  'Transferência',
  'Boleto',
];
