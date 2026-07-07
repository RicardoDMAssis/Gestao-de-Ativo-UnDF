import axios from 'axios';

// Instância para chamadas no lado do cliente (Client Components) apontando para o Next.js API
export const api = axios.create({
  baseURL: '/api', // Aponta para as rotas da API do próprio Next.js
  withCredentials: true,
});

// Flag para evitar múltiplas requisições de refresh simultâneas
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de resposta para tratar expiração de token (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 (Não Autorizado) e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Se já estiver atualizando, coloca a requisição na fila
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tenta renovar a sessão usando a rota interna do Next.js
        await axios.post('/api/auth/refresh');
        
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Se falhar o refresh, limpa os cookies chamando a API de logout e redireciona para o login
        if (typeof window !== 'undefined') {
          axios.post('/api/auth/logout').finally(() => {
            window.location.href = '/login';
          });
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
