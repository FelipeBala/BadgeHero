# BadgeHero - Sistema de Gerenciamento de Badges

Sistema completo de gerenciamento de badges com backend Node.js, Express e SQLite.

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado (versão 14 ou superior)
- npm (gerenciador de pacotes do Node.js)

### Instalação

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor:
```bash
npm start
```

3. Acesse o sistema:
```
http://localhost:3000
```

## 📦 Tecnologias Utilizadas

### Backend
- **Node.js** - Ambiente de execução JavaScript
- **Express** - Framework web
- **SQLite3** - Banco de dados local
- **CORS** - Habilitação de requisições cross-origin
- **Body-Parser** - Parse de requisições JSON

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização com gradientes e animações
- **JavaScript (ES6+)** - Lógica e integração com API

## 🗄️ Estrutura do Banco de Dados

### Tabela: users
- `id` - INTEGER (Primary Key, Autoincrement)
- `name` - TEXT (Nome do usuário)
- `avatar` - TEXT (URL da imagem)

### Tabela: badges
- `id` - INTEGER (Primary Key, Autoincrement)
- `user_id` - INTEGER (Foreign Key → users)
- `name` - TEXT (Nome da badge)
- `description` - TEXT (Descrição)
- `icon` - TEXT (Emoji da badge)
- `date` - TEXT (Data de conquista)

### Tabela: admin
- `id` - INTEGER (Primary Key)
- `password` - TEXT (Senha do admin)

## 🔐 Autenticação Admin

**Senha padrão:** `admin123`

## 📡 API Endpoints

### Usuários
- `GET /api/users` - Lista todos os usuários
- `GET /api/users/:id` - Detalhes de um usuário específico
- `POST /api/users` - Adiciona novo usuário (admin)
- `DELETE /api/users/:id` - Remove usuário (admin)

### Badges
- `POST /api/badges` - Adiciona nova badge (admin)
- `DELETE /api/badges/:id` - Remove badge (admin)

### Admin
- `POST /api/admin/verify` - Verifica senha de admin

## 📁 Arquivos do Projeto

```
BadgeHero/
├── server.js           # Servidor Express e rotas API
├── index.html          # Interface do usuário
├── script.js           # Lógica frontend
├── styles.css          # Estilos
├── package.json        # Dependências
├── badgehero.db        # Banco de dados SQLite (gerado automaticamente)
└── README.md           # Este arquivo
```

## ✨ Funcionalidades

### Todos os Usuários
- ✅ Visualizar lista de usuários
- ✅ Acessar perfil de qualquer usuário
- ✅ Ver todas as badges de cada usuário

### Administradores
- ✅ Login com senha
- ✅ Adicionar novos usuários
- ✅ Adicionar badges para usuários
- ✅ Dados persistentes no banco SQLite

## 🎯 Dados de Exemplo

O sistema vem com 4 usuários de exemplo e várias badges pré-cadastradas para demonstração.
