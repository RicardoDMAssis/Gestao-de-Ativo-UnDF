"use client";

import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    setLoading(true);

    // Simulando chamada à API de recuperação
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-undf-grayLight to-undf-gray p-4">
      <div className="w-full max-w-md bg-undf-white rounded-2xl shadow-xl overflow-hidden border border-undf-gray border-opacity-50 relative z-10">
        <div className="p-8">
          <div className="mb-6">
            <Link href="/login" className="inline-flex items-center text-sm font-medium text-undf-grayDark hover:text-undf-green transition-colors">
              <ArrowLeft size={16} className="mr-1" />
              Voltar para o login
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-undf-black mb-2">Recuperar senha</h2>
          <p className="text-undf-grayDark text-sm mb-6">
            Digite seu e-mail cadastrado na instituição para receber as instruções de redefinição de senha.
          </p>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-undf-greenLight/20 mb-4">
                <CheckCircle2 size={32} className="text-undf-green" />
              </div>
              <h3 className="text-lg font-medium text-undf-black mb-2">E-mail enviado!</h3>
              <p className="text-sm text-undf-grayDark">
                Verifique sua caixa de entrada e a pasta de spam. Enviamos um link para redefinir sua senha.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-undf-grayDark block">E-mail institucional</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-undf-grayDark group-focus-within:text-undf-green transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-undf-gray rounded-lg focus:ring-2 focus:ring-undf-greenLight focus:border-undf-green transition-all bg-undf-grayLight focus:bg-undf-white text-undf-black sm:text-sm outline-none"
                    placeholder="seu.email@undf.edu.br"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-undf-white bg-undf-green hover:bg-undf-greenDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-undf-greenLight disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Enviando...
                  </>
                ) : (
                  'Enviar instruções'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
