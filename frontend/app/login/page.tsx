"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/useAuth';
import { LogIn, Mail, Hash, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { UnDFLogo } from '@/components/UnDFLogo';
import { formatApiError } from '@/lib/axios';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação básica
    if (!email.trim() || !matricula.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Insira um e-mail válido.');
      return;
    }

    try {
      setLoading(true);
      await login(email, matricula);
      router.push('/perfil');
    } catch (err: any) {
      setError(formatApiError(err, 'Erro ao realizar login. Verifique suas credenciais.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-undf-grayLight to-undf-gray p-4">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-96 h-96 bg-undf-primaryLight/20 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] right-[10%] w-[30rem] h-[30rem] bg-undf-primaryDark/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-undf-white rounded-2xl shadow-xl z-10 overflow-hidden border border-undf-gray border-opacity-50">
        <div className="p-8 pb-4 flex flex-col items-center">
          <UnDFLogo className="w-40" />
          <p className="text-undf-primaryDark mt-4 text-sm font-semibold">
            Sistema de Gestão de Patrimônio
          </p>
        </div>

        <div className="px-8 pb-8">
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="font-medium">Erro:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-undf-grayDark block">E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-undf-grayDark group-focus-within:text-undf-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-undf-gray rounded-lg focus:ring-2 focus:ring-undf-primaryLight focus:border-undf-primary transition-all bg-undf-grayLight focus:bg-undf-white text-undf-black sm:text-sm outline-none"
                  placeholder="seu.email@undf.edu.br"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="matricula" className="text-sm font-medium text-undf-grayDark block">Matrícula</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-undf-grayDark group-focus-within:text-undf-primary transition-colors">
                  <Hash size={18} />
                </div>
                <input
                  id="matricula"
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-undf-gray rounded-lg focus:ring-2 focus:ring-undf-primaryLight focus:border-undf-primary transition-all bg-undf-grayLight focus:bg-undf-white text-undf-black sm:text-sm outline-none"
                  placeholder="20241UNDF0001"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link href="/esqueci-a-senha" className="text-sm text-undf-primary hover:text-undf-primaryDark font-medium transition-colors">
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-undf-white bg-undf-primary hover:bg-undf-primaryDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-undf-primaryLight disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2" size={18} />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
