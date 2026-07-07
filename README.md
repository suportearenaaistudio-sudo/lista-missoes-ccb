# Lista de Missões — CCB Iporã

Sistema web para gerenciamento e impressão das Listas de Missões da **Congregação Cristã no Brasil, Região de Iporã-PR**.

---

## ✨ Funcionalidades

- 📅 **Painel anual** com os 12 meses de 2026
- ✅ **Dados pré-carregados** com todos os ensaios do ano (baseado na tabela de ensaios 2026)
- ➕ **Adicionar / Editar / Excluir** eventos por mês
- 🎯 **Tipos de evento**: Ensaio, Ensaio Regional, Culto Unificado, Culto de Evangelização, Reunião de Mocidade
- 📍 **Locais**: Vila Nilza, Nova Santa Helena, Iporã, Francisco Alves, Rio Bonito, Cafezal do Sul, Guaiporã
- 🖨️ **Impressão** em formato A4 paisagem com **3 colunas** (igual ao modelo Word)
- 💾 **Banco de dados Neon** (PostgreSQL) via Vercel

---

## 🚀 Deploy na Vercel

### 1. Crie o banco de dados
1. Acesse [vercel.com](https://vercel.com) → seu projeto → **Storage**
2. Clique em **Create Database** → escolha **Neon**
3. Copie a `DATABASE_URL` gerada

### 2. Configure as variáveis de ambiente
No painel da Vercel → **Settings** → **Environment Variables**, adicione:
```
DATABASE_URL = postgresql://...sua connection string...
```

### 3. Faça o deploy
```bash
# Instale a Vercel CLI (se não tiver)
npm i -g vercel

# Na pasta do projeto:
vercel
```

### 4. Inicialize o banco (uma única vez)
Após o primeiro deploy, acesse com método POST:
```
POST https://seu-app.vercel.app/api/setup
```
Isso criará a tabela e inserirá todos os ensaios de 2026.

---

## 💻 Desenvolvimento Local

```bash
npm install
copy .env.example .env
# Preencha DATABASE_URL no .env

npm i -g vercel
vercel dev        # roda frontend + API routes juntos
```

---

## 📁 Estrutura

```
api/
  events.js    — CRUD de eventos
  setup.js     — Cria tabela + semeia 2026
src/
  App.jsx      — UI completa
  api.js       — Client HTTP
  constants.js — Constantes e utilitários
  index.css    — Design system
```

---

## 🖨️ Como Imprimir

1. Abra o mês desejado
2. Clique em **"Visualizar Impressão"**
3. Clique em **"Imprimir (Ctrl+P)"**
4. Configure: **Paisagem**, papel **A4**, sem margens
5. Sai com **3 colunas idênticas** para recortar
