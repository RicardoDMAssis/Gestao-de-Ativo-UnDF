import axios from 'axios';

// Instância para chamadas no lado do cliente (Client Components) apontando para o Next.js API
export const api = axios.create({
  baseURL: '/api', // Aponta para as rotas da API do próprio Next.js
  withCredentials: true,
});

// Cache em memória para requisições GET
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 5000; // Cache de 5 segundos

api.interceptors.request.use((config) => {
  if (config.method === 'get') {
    const cacheKey = config.url + (config.params ? JSON.stringify(config.params) : '');
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      config.adapter = () => {
        return Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {}
        } as any);
      };
    }
  }
  return config;
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

// Interceptor de resposta para tratar expiração de token (401) e salvar cache
api.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get') {
      const cacheKey = response.config.url + (response.config.params ? JSON.stringify(response.config.params) : '');
      cache.set(cacheKey, {
        data: response.data,
        expiry: Date.now() + CACHE_TTL_MS
      });
    } else {
      // Limpa todo o cache em mutações (POST, PUT, PATCH, DELETE) para garantir dados frescos
      cache.clear();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 (Não Autorizado) e não for uma tentativa de refresh/login
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
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

export function formatApiError(err: any, fallbackMessage: string = "Ocorreu um erro."): string {
  if (!err?.response?.data) {
    return err?.message || fallbackMessage;
  }
  
  const data = err.response.data;
  
  // 1. Se for uma mensagem simples no detail, error ou message
  if (typeof data.detail === "string") {
    return data.detail;
  }
  if (typeof data.error === "string") {
    return data.error;
  }
  if (typeof data.message === "string") {
    return data.message;
  }
  
  // 2. Se for um objeto de erros de validação (DRF Serializer errors)
  if (typeof data === "object") {
    const errorStrings: string[] = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (key === "non_field_errors") {
        if (Array.isArray(value)) {
          errorStrings.push(value.join(" "));
        } else {
          errorStrings.push(String(value));
        }
        continue;
      }
      
      const fieldName = formatFieldName(key);
      if (Array.isArray(value)) {
        errorStrings.push(`${fieldName}: ${value.join(" ")}`);
      } else if (typeof value === "object" && value !== null) {
        // Erros aninhados (ex: ti_profile)
        for (const [subKey, subVal] of Object.entries(value)) {
          const subFieldName = formatFieldName(subKey);
          if (Array.isArray(subVal)) {
            errorStrings.push(`${fieldName} (${subFieldName}): ${subVal.join(" ")}`);
          } else {
            errorStrings.push(`${fieldName} (${subFieldName}): ${String(subVal)}`);
          }
        }
      } else {
        errorStrings.push(`${fieldName}: ${String(value)}`);
      }
    }
    
    if (errorStrings.length > 0) {
      return errorStrings.join("\n");
    }
  }
  
  return fallbackMessage;
}

function formatFieldName(field: string): string {
  const mapping: Record<string, string> = {
    nome: "Nome",
    serial_patrimonio: "Código Patrimonial (Serial)",
    descricao: "Descrição",
    categoria: "Categoria",
    status: "Status",
    responsavel: "Responsável",
    setor: "Setor",
    ti_profile: "Especificações de TI",
    marca: "Marca",
    memoria_ram_gb: "Memória RAM",
    armazenamento_gb: "Armazenamento",
    sistema_operacional: "Sistema Operacional",
    sala: "Sala",
    software: "Software",
    ativo_ti: "Computador de TI",
    email: "E-mail",
    matricula: "Matrícula",
    password: "Senha"
  };
  return mapping[field] || field;
}
