import { create } from 'zustand';
import { api } from '@/lib/axios';

export interface User {
  id: number;
  nome: string;
  email: string;
  matricula: string;
  tipo_usuario: string;
  ativo: boolean;
  aluno_profile?: any;
  professor_profile?: any;
  servidor_profile?: any;
  nome_social?: string;
  foto_url?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasFetched: boolean;
  login: (email: string, matricula: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  _hasFetched: false,

  login: async (email, matricula) => {
    const res = await api.post('/auth/login', { email, matricula });
    let userData = res.data.user;
    if (!userData) {
      const response = await api.get('/usuarios/me');
      userData = response.data;
    }
    set({ user: userData, isAuthenticated: true, isLoading: false, _hasFetched: true });
  },

  logout: async () => {
    await api.post('/auth/logout');
    set({ user: null, isAuthenticated: false, isLoading: false, _hasFetched: false });
  },

  fetchUser: async () => {
    // Evita chamadas duplicadas — só busca se ainda não buscou
    if (get()._hasFetched) return;

    try {
      set({ isLoading: true, _hasFetched: true });
      const response = await api.get('/usuarios/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      // Se falhar a busca (token inválido/expirado ou backend offline), 
      // limpa os cookies para evitar loops de redirecionamento no middleware
      try {
        await api.post('/auth/logout');
      } catch (e) {
        // Ignora erros de rede caso o servidor Next.js esteja inacessível
      }
    }
  },

  refreshUser: async () => {
    try {
      const response = await api.get('/usuarios/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false, _hasFetched: true });
    } catch (error) {
      // Silencioso ou reset se falhar autenticação
    }
  },
}));
