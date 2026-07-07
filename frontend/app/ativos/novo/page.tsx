"use client";

import React, { useRef, useState, useEffect, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Check, AlertCircle, Loader2, ChevronDown, Boxes } from "lucide-react";
import { Layout } from "@/components/Layout";
import { api } from "@/lib/axios";

interface SetorOption {
  id: number;
  tipo: string;
  campus_sigla: string;
}

interface ServidorOption {
  id: number;
  nome: string;
}

type Categoria = "" | "Mobiliário" | "TI" | "Veículo" | "Outros";

interface FormState {
  nome: string;
  serial_patrimonio: string;
  descricao: string;
  categoria: Categoria;
  responsavel: string; // ID como string
  setor: string; // ID como string
  marca: string;
  ram: string;
  armazenamento: string;
  so: string;
  softwares: string[];
  sala: string;
  elegivel_emprestimo: boolean;
}

const INITIAL_FORM: FormState = {
  nome: "",
  serial_patrimonio: "",
  descricao: "",
  categoria: "",
  responsavel: "",
  setor: "",
  marca: "",
  ram: "",
  armazenamento: "",
  so: "",
  softwares: [],
  sala: "",
  elegivel_emprestimo: false,
};

const SO_OPCOES = ["Windows", "Linux", "macOS", "Outro"];

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export default function CadastroPatrimonioPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemError, setImagemError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const [setores, setSetores] = useState<SetorOption[]>([]);
  const [servidores, setServidores] = useState<ServidorOption[]>([]);
  const [softwaresList, setSoftwaresList] = useState<any[]>([]);

  const [salas, setSalas] = useState<any[]>([]);

  // Carrega Setores, Servidores, Softwares e Salas do backend
  useEffect(() => {
    async function loadData() {
      try {
        const [setoresRes, servidoresRes, softwaresRes, salasRes] = await Promise.all([
          api.get("/setores/"),
          api.get("/servidores/"),
          api.get("/softwares/"),
          api.get("/salas/"),
        ]);
        
        // Trata os formatos
        const setoresData = (setoresRes.data.results || setoresRes.data).map((s: any) => ({
          id: s.id,
          tipo: s.tipo,
          campus_sigla: s.campus_detail?.sigla || s.campus || "",
        }));

        const servidoresData = (servidoresRes.data.results || servidoresRes.data)
          .map((s: any) => ({
            id: s.usuario?.id,
            nome: s.usuario?.nome || `Servidor ${s.id || ''}`,
          }))
          .filter((s: any) => s.id !== undefined && s.id !== null);

        const softwaresData = softwaresRes.data.results || softwaresRes.data || [];
        const salasData = salasRes.data.results || salasRes.data || [];

        setSetores(setoresData);
        setServidores(servidoresData);
        setSoftwaresList(softwaresData);
        setSalas(salasData);
      } catch (err) {
        console.error("Erro ao carregar dados de setores/servidores/softwares/salas:", err);
      }
    }
    loadData();
  }, []);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      if (key === "categoria") {
        return {
          ...prev,
          [key]: value,
          marca: "",
          ram: "",
          armazenamento: "",
          so: "",
        };
      }
      return { ...prev, [key]: value };
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validar = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.nome.trim()) next.nome = "Informe o nome do patrimônio.";
    if (!form.serial_patrimonio.trim()) next.serial_patrimonio = "Informe o número de patrimônio.";
    if (!form.categoria) next.categoria = "Selecione a categoria.";
    if (!form.responsavel) next.responsavel = "Selecione o responsável.";
    if (!form.setor) next.setor = "Selecione o setor.";

    if (form.categoria === "TI") {
      if (!form.marca.trim()) next.marca = "Informe a marca.";
      if (!form.ram.trim()) next.ram = "Informe a memória RAM.";
      if (!form.armazenamento.trim()) next.armazenamento = "Informe o armazenamento.";
      if (!form.so.trim()) next.so = "Selecione o sistema operacional.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleArquivo = (file: File | null) => {
    setImagemError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImagemError("Selecione um arquivo de imagem válido.");
      return;
    }
    setImagem(file);
    const reader = new FileReader();
    reader.onload = () => setImagemPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setImagem(null);
    setImagemPreview(null);
    setImagemError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus({ kind: "idle" });
    if (!validar()) return;

    setStatus({ kind: "loading" });

    // Monta o payload conforme a API Django
    const payload: any = {
      nome: form.nome.trim(),
      serial_patrimonio: form.serial_patrimonio.trim(),
      descricao: form.descricao.trim(),
      categoria: form.categoria,
      responsavel: parseInt(form.responsavel),
      setor: parseInt(form.setor),
      elegivel_emprestimo: form.elegivel_emprestimo,
    };

    if (form.categoria === "TI") {
      payload.ti_profile = {
        marca: form.marca.trim(),
        memoria_ram_gb: parseInt(form.ram.replace(/\D/g, "")) || 8,
        armazenamento_gb: parseInt(form.armazenamento.replace(/\D/g, "")) || 256,
        sistema_operacional: form.so,
        sala: form.sala ? parseInt(form.sala) : null,
      };
    }

    let criadoId: number | null = null;
    try {
      const res = await api.post("/ativos/", payload);
      criadoId = res.data?.id ?? null;
      if (criadoId == null) throw new Error("no-id");
    } catch (err: any) {
      console.error(err);
      setStatus({
        kind: "error",
        message: err.response?.data?.detail || "Erro ao criar o ativo. Verifique os dados e tente novamente.",
      });
      return;
    }

    if (imagem && criadoId != null) {
      try {
        const fd = new FormData();
        fd.append("file", imagem);
        await api.post(`/ativos/${criadoId}/upload_imagem/`, fd, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } catch (err) {
        console.error(err);
        setStatus({
          kind: "error",
          message: "Ativo criado, mas houve falha no upload da imagem.",
        });
        return;
      }
    }

    // Se o ativo for de TI e tiver softwares selecionados, fazemos a instalação de cada um
    if (form.categoria === "TI" && form.softwares && form.softwares.length > 0) {
      try {
        await Promise.all(
          form.softwares.map((swId) =>
            api.post("/instalacoes-software/", {
              software: parseInt(swId),
              ativo_ti: criadoId,
            })
          )
        );
      } catch (err) {
        console.error("Erro ao registrar instalações de softwares:", err);
        setStatus({
          kind: "error",
          message: "Ativo criado, mas houve falha ao registrar alguns softwares.",
        });
        return;
      }
    }

    setStatus({ kind: "success", message: "Patrimônio cadastrado com sucesso." });
    resetForm();
    setTimeout(() => {
      router.push("/ativos");
    }, 1500);
  };

  const showTI = form.categoria === "TI";

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-4">
        {/* Card do formulário */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold mb-6 text-foreground">
            Cadastrar Novo Patrimônio
          </h1>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <TextField
              id="nome"
              label="Nome"
              placeholder="Nome do patrimônio"
              value={form.nome}
              onChange={(v) => setField("nome", v)}
              error={errors.nome}
            />

            <TextField
              id="serial_patrimonio"
              label="Código do Patrimônio (Serial)"
              placeholder="Código/Serial do patrimônio"
              value={form.serial_patrimonio}
              onChange={(v) => setField("serial_patrimonio", v)}
              error={errors.serial_patrimonio}
            />

            <SelectField
              id="categoria"
              label="Categoria"
              value={form.categoria}
              onChange={(v) => setField("categoria", v as Categoria)}
              error={errors.categoria}
              placeholder="Selecione a categoria"
              options={[
                { value: "Mobiliário", label: "Mobiliário" },
                { value: "TI", label: "TI" },
                { value: "Veículo", label: "Veículo" },
                { value: "Outros", label: "Outros" },
              ]}
            />

            {/* Bloco condicional — TI */}
            <ConditionalBlock show={showTI}>
              <TIFields form={form} errors={errors} setField={setField} softwaresList={softwaresList} salas={salas} />
            </ConditionalBlock>

            <TextField
              id="descricao"
              label="Descrição"
              placeholder="Detalhes ou observações sobre o ativo..."
              value={form.descricao}
              onChange={(v) => setField("descricao", v)}
              error={errors.descricao}
            />

            <SelectField
              id="responsavel"
              label="Servidor Responsável"
              value={form.responsavel}
              onChange={(v) => setField("responsavel", v)}
              error={errors.responsavel}
              placeholder="Selecione o responsável"
              options={servidores.map((s) => ({ value: s.id.toString(), label: s.nome }))}
            />

            <SelectField
              id="setor"
              label="Setor Alocado"
              value={form.setor}
              onChange={(v) => setField("setor", v)}
              error={errors.setor}
              placeholder="Selecione o setor"
              options={setores.map((s) => ({ value: s.id.toString(), label: `${s.tipo} (${s.campus_sigla})` }))}
            />

            <div className="flex items-center gap-2.5 px-1 py-1 rounded bg-slate-50 dark:bg-zinc-800/20 border border-slate-200/50 dark:border-zinc-800">
              <input
                id="elegivel_emprestimo"
                type="checkbox"
                checked={form.elegivel_emprestimo}
                onChange={(e) => setField("elegivel_emprestimo", e.target.checked)}
                className="rounded border-slate-300 dark:border-zinc-700 text-primary focus:ring-primary w-4.5 h-4.5 cursor-pointer"
              />
              <label htmlFor="elegivel_emprestimo" className="text-sm font-semibold text-slate-700 dark:text-zinc-200 cursor-pointer">
                Elegível para Empréstimo Estudantil
              </label>
            </div>

            <ImageUpload
              preview={imagemPreview}
              error={imagemError}
              onFile={handleArquivo}
              onRemove={() => {
                setImagem(null);
                setImagemPreview(null);
                setImagemError(null);
              }}
            />

            {status.kind === "success" && (
              <StatusBanner kind="success" message={status.message} />
            )}
            {status.kind === "error" && (
              <StatusBanner kind="error" message={status.message} />
            )}

            <button
              type="submit"
              disabled={status.kind === "loading"}
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {status.kind === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Cadastrar Patrimônio"
              )}
            </button>
          </form>
        </section>
      </div>
    </Layout>
  );
}

/* ---------- Subcomponentes ---------- */

interface TextFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}
function TextField({ id, label, placeholder, value, onChange, error }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full py-2.5 px-4 rounded-md border bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 outline-none transition-colors focus:ring-2 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-slate-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-blue-100"
        }`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder: string;
  options: { value: string; label: string }[];
}
function SelectField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  options,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none w-full py-2.5 pl-4 pr-10 rounded-md border bg-white dark:bg-zinc-800 outline-none transition-colors focus:ring-2 ${
            value ? "text-slate-800 dark:text-zinc-100" : "text-slate-400"
          } ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-300 dark:border-zinc-700 focus:border-blue-500 focus:ring-blue-100"
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="w-4 h-4 text-blue-750 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
      </div>
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
      <AlertCircle className="w-3.5 h-3.5" />
      {message}
    </p>
  );
}

function ConditionalBlock({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid transition-all duration-350 ease-out ${
        show ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
      aria-hidden={!show}
    >
      <div className="overflow-hidden">
        <div className="flex flex-col gap-5 pt-1">{children}</div>
      </div>
    </div>
  );
}

interface TIFieldsProps {
  form: FormState;
  errors: Partial<Record<keyof FormState, string>>;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  softwaresList: any[];
  salas: any[];
}
function TIFields({ form, errors, setField, softwaresList, salas }: TIFieldsProps) {
  return (
    <div className="flex flex-col gap-5 p-4 rounded-md bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-primary">Especificações de TI</h3>
      <TextField
        id="marca"
        label="Marca"
        placeholder="Marca do equipamento"
        value={form.marca}
        onChange={(v) => setField("marca", v)}
        error={errors.marca}
      />
      <TextField
        id="ram"
        label="RAM"
        placeholder="Memória RAM (ex.: 8GB, 16GB)"
        value={form.ram}
        onChange={(v) => setField("ram", v)}
        error={errors.ram}
      />
      <TextField
        id="armazenamento"
        label="Armazenamento"
        placeholder="Armazenamento (ex.: 256GB SSD)"
        value={form.armazenamento}
        onChange={(v) => setField("armazenamento", v)}
        error={errors.armazenamento}
      />
      <SelectField
        id="so"
        label="Sistema operacional"
        value={form.so}
        onChange={(v) => setField("so", v)}
        error={errors.so}
        placeholder="Selecione o sistema operacional"
        options={SO_OPCOES.map((s) => ({ value: s, label: s }))}
      />

      <SelectField
        id="sala"
        label="Sala / Laboratório Fixo (Opcional)"
        value={form.sala}
        onChange={(v) => {
          setField("sala", v);
          if (v) {
            // Se fixado em sala, não é elegível para empréstimo
            setField("elegivel_emprestimo", false);
          }
        }}
        error={errors.sala}
        placeholder="Avulso (Disponível para empréstimo)"
        options={salas.map((s) => ({ value: s.id.toString(), label: `${s.tipo} ${s.numero} (${s.campus_detail?.sigla || ''})` }))}
      />

      {/* Seção de Softwares Pré-instalados */}
      <div className="space-y-2 mt-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
          Softwares a serem instalados nesta máquina
        </label>
        <p className="text-[11px] text-slate-550 dark:text-zinc-400">
          Selecione quais softwares de TI devem ser instalados no ativo após sua criação.
        </p>
        <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 divide-y divide-slate-100 dark:divide-zinc-800 p-1">
          {softwaresList.map((sw) => {
            const isChecked = form.softwares?.includes(String(sw.id));
            return (
              <label
                key={sw.id}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const current = form.softwares || [];
                    const updated = isChecked
                      ? current.filter((id) => id !== String(sw.id))
                      : [...current, String(sw.id)];
                    setField("softwares", updated);
                  }}
                  className="rounded border-slate-300 dark:border-zinc-700 text-primary focus:ring-primary w-4 h-4"
                />
                <span className="font-medium text-slate-700 dark:text-zinc-200">{sw.nome}</span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">({sw.fabricante})</span>
              </label>
            );
          })}
          {softwaresList.length === 0 && (
            <div className="p-3 text-xs text-slate-500 dark:text-zinc-400 text-center">
              Nenhum software cadastrado no sistema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ImageUploadProps {
  preview: string | null;
  error: string | null;
  onFile: (file: File | null) => void;
  onRemove: () => void;
}
function ImageUpload({ preview, error, onFile, onRemove }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    onFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    onFile(e.dataTransfer.files?.[0] ?? null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700 dark:text-zinc-350">Foto do patrimônio</span>

      {preview ? (
        <div className="relative rounded-md border border-slate-350 overflow-hidden bg-slate-50 dark:bg-zinc-800">
          <img
            src={preview}
            alt="Pré-visualização do patrimônio"
            className="w-full max-h-64 object-contain"
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remover imagem"
            className="absolute top-2 right-2 bg-white/90 dark:bg-zinc-900/90 hover:bg-white border border-slate-300 dark:border-zinc-700 rounded-full p-1 text-slate-700 dark:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor="imagem"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-md border-2 border-dashed cursor-pointer transition-colors text-center ${
            dragOver
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : error
                ? "border-red-300 bg-red-50/40 dark:bg-red-950/10"
                : "border-slate-300 dark:border-zinc-750 bg-slate-50 dark:bg-zinc-800/20 hover:bg-slate-100 dark:hover:bg-zinc-800/40"
          }`}
        >
          <Upload className="w-6 h-6 text-blue-700 dark:text-blue-400" />
          <span className="text-sm text-slate-650 dark:text-zinc-400">
            Arraste a imagem aqui ou clique para selecionar
          </span>
          <input
            ref={inputRef}
            id="imagem"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleInput}
          />
        </label>
      )}

      {error && <FieldError id="imagem-error" message={error} />}
    </div>
  );
}

function StatusBanner({
  kind,
  message,
}: {
  kind: "success" | "error";
  message: string;
}) {
  const isSuccess = kind === "success";
  return (
    <div
      role="status"
      className={`flex items-start gap-2 px-4 py-3 rounded-md border text-sm ${
        isSuccess
          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-400"
          : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-400"
      }`}
    >
      {isSuccess ? (
        <Check className="w-4 h-4 mt-0.5 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
