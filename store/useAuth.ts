import { create } from 'zustand';
import { api } from '@/lib/axios';

interface User {
  nome: string;
  matricula: string;
  cargoCurso: string;
  tipoUsuario: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, matricula: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, matricula) => {
    // A rota /api/auth/login vai cuidar de armazenar os cookies HttpOnly
    await api.post('/auth/login', { email, matricula });
    // Após login bem-sucedido, busca os dados do usuário
    const response = await api.get('/usuarios/me');
    set({ user: response.data, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    // Chama rota para limpar cookies
    await api.post('/auth/logout');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/usuarios/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
