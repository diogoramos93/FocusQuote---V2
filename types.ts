
export enum QuoteStatus {
  DRAFT = 'Rascunho',
  SENT = 'Enviado',
  VIEWED = 'Visualizado',
  APPROVED = 'Aprovado',
  DECLINED = 'Recusado'
}

export enum ServiceType {
  PACKAGE = 'Pacote',
  HOURLY = 'Hora',
  DAILY = 'Diária'
}

export enum PaymentMethod {
  PIX = 'Pix',
  CARD = 'Cartão de Crédito',
  TRANSFER = 'Transferência',
  CASH = 'Dinheiro'
}

export type UserRole = 'admin' | 'photographer';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  isBlocked: boolean;
  createdAt: string;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  defaultPrice: number;
  type: ServiceType;
}

export interface PhotographerProfile {
  name: string;
  studioName?: string;
  logoUrl?: string;
  taxId: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  website?: string;
  instagram?: string;
  defaultTerms: string;
  monthlyGoal: number;
}

export interface Client {
  id: string;
  name: string;
  taxId?: string;
  phone: string;
  email: string;
  address: string;
  type: 'PF' | 'PJ';
  notes?: string;
}

export interface QuoteItem {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  quantity: number;
  type: ServiceType;
}

export interface Quote {
  id: string;
  number: string;
  clientId: string;
  date: string;
  validUntil: string;
  status: QuoteStatus;
  items: QuoteItem[];
  discount: number;
  extraFees: number;
  paymentMethod: PaymentMethod;
  paymentConditions: string;
  notes?: string;
  total: number;
  coverImageUrl?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  created_at: string;
}
