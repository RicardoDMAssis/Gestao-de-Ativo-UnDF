# Guia de Configuração e Inicialização — Gestão de Ativos UnDF

Este é um guia passo a passo para clonar o repositório diretamente na branch `joao`, instalar todas as dependências necessárias e rodar tanto o **Backend (Django)** quanto o **Frontend (Next.js)**.

---

## 🛠️ Pré-requisitos
Antes de começar, certifique-se de ter instalado em sua máquina:
1. **Git**
2. **Python 3.10 ou superior**
3. **Node.js (v18 ou superior)** e **npm**

---

## 📦 1. Clonando o Repositório na Branch Correta
Abra o seu terminal (Terminal, PowerShell ou Git Bash) e rode o comando abaixo para clonar o repositório já posicionado na branch `joao`:

```bash
git clone -b joao https://github.com/RicardoDMAssis/Gestao-de-Ativo-UnDF.git
```

Depois de clonar, entre na pasta raiz do projeto:
```bash
cd Gestao-de-Ativo-UnDF
```

---

## 🐍 2. Configurando o Backend (Django)

O backend utiliza Python e um ambiente virtual (`venv`) para gerenciar as dependências.

### Passo 2.1: Entrar na pasta do backend
```bash
cd Gestao-de-Ativo-UnDF
```

### Passo 2.2: Criar o Ambiente Virtual (`venv`)
*   **No Windows:**
    ```powershell
    python -m venv venv
    ```
*   **No macOS/Linux:**
    ```bash
    python3 -m venv venv
    ```

### Passo 2.3: Ativar o Ambiente Virtual
*   **No Windows (PowerShell):**
    ```powershell
    .\venv\Scripts\Activate.ps1
    ```
*   **No Windows (Command Prompt / CMD):**
    ```cmd
    .\venv\Scripts\activate.bat
    ```
*   **No macOS/Linux (ou Git Bash no Windows):**
    ```bash
    source venv/bin/activate
    ```
*(Você saberá que deu certo quando aparecer `(venv)` no início da linha do terminal)*

### Passo 2.4: Instalar as dependências do Python
Com a `venv` active, instale os pacotes necessários:
```bash
pip install -r requirements.txt
```

### Passo 2.5: Configurar as Variáveis de Ambiente (`.env`)
O projeto utiliza um banco de dados hospedado no Supabase. Crie o arquivo `.env` copiando as configurações de exemplo:
*   **No Windows:**
    ```powershell
    copy .env.example .env
    ```
*   **No macOS/Linux:**
    ```bash
    cp .env.example .env
    ```
*(O arquivo `.env` já vem pré-configurado com as credenciais de teste do Supabase).*

### Passo 2.6: Executar as Migrações (Banco de Dados)
Para garantir que as tabelas estejam estruturadas no banco:
```bash
python manage.py migrate
```

### Passo 2.7: Iniciar o Servidor do Backend
```bash
python manage.py runserver
```
O servidor backend rodará no endereço `http://127.0.0.1:8000/`. Deixe este terminal aberto!

---

## ⚛️ 3. Configurando o Frontend (Next.js)

Agora, abra um **novo terminal** para configurar a interface visual do projeto.

### Passo 3.1: Navegar até a pasta do frontend
Vá para a pasta raiz do repositório clonado e depois entre em `frontend`:
```bash
cd Gestao-de-Ativo-UnDF/frontend
```

### Passo 3.2: Instalar as dependências do Node.js
```bash
npm install
```

### Passo 3.3: Configurar as Variáveis de Ambiente (`.env.local`)
Crie um arquivo chamado `.env.local` na pasta `frontend/` com o seguinte conteúdo para apontar para o backend:
```env
BACKEND_URL=http://127.0.0.1:8000/api
```

### Passo 3.4: Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
O frontend estará acessível em `http://localhost:3000/`.

---

## 🚀 Como acessar o sistema após iniciar ambos?
1. Abra o navegador em `http://localhost:3000/`.
2. O sistema solicitará um login e matrícula. Utilize credenciais válidas cadastradas no banco de dados para acessar.
