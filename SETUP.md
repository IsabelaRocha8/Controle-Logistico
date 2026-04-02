# 🚀 GUIA DE SETUP - Sistema SITE NIL

## ✅ Correções Realizadas

1. **Login corrigido**: Agora usa o novo sistema de autenticação com Backend API
   - Formulário com IDs corretos: `formLogin`, `usuario`, `senha`, `mensagemErro`
   - Integração com `Auth.js` e `apiClient.js`

2. **Erros de sintaxe corrigidos**: 
   - Arquivo `script.js` restaurado e teste finalizado

3. **Script de seed criado**: `scripts/seedAdmin.js` para criar usuário admin inicial

---

## 📋 Próximos Passos

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com:
```
DATABASE_URL=postgresql://user:password@host/database
# ou use uma das alternativas:
POSTGRES_URL=...
POSTGRES_URL_NON_POOLING=...
```

**Dica**: Use um banco PostgreSQL como [Neon](https://neon.tech/) ou [Railway](https://railway.app/) para não precisar instalar localmente.

### 3. Criar Usuário Admin
Após configurar o DATABASE_URL, rode:
```bash
npm run seed-admin
```

**Credenciais padrão**:
- Usuário: `admin`
- Senha: `admin123`

### 4. Iniciar o Servidor
```bash
npm run dev
```

O servidor rodará em `http://localhost:3000`

### 5. Acessar o Sistema
- Abra `http://localhost:3000` no navegador
- Acesse a página de login
- Use as credenciais do admin criado

---

## 🔐 Sistema de Autenticação

O sistema agora usa:
- **Backend**: Express.js com Neon PostgreSQL
- **Frontend**: Sistema moderno com JWT tokens
- **Permissões**: ADMIN, OPERADOR, IMPORTACAO, VISUALIZADOR

### Criar Novos Usuários

Use a página **Admin > Usuários** para criar usuários novos com diferentes níveis de acesso.

---

## 📁 Estrutura do Projeto

```
├── api/                    # Backend (Express)
│   ├── auth/              # Autenticação
│   │   ├── login.js
│   │   ├── logout.js
│   │   └── me.js
│   ├── users/             # Gestão de usuários
│   ├── historico.js       # Histórico de containers
│   ├── previsoes.js       # Previsões de chegada
│   └── nils.js            # Emissão de NIL
├── lib/
│   ├── db.js              # Configuração do banco de dados
│   └── auth.js            # Funções de autenticação JWT
├── js/
│   ├── apiClient.js       # Cliente HTTP para API
│   ├── auth.js            # Funções de login frontend
│   ├── store.js           # Armazenamento de dados
│   └── ...
├── scripts/
│   └── seedAdmin.js       # Script para criar usuário admin
├── login.html             # Página de login
├── index.html             # Dashboard admin
├── dashboard-operador.html # Dashboard operador
└── ... (outras páginas)
```

---

## 🐛 Troubleshooting

### Erro: "Serviço de autenticação indisponível"
- Certifique-se que `apiClient.js` e `auth.js` foram carregados
- Verifique o console do navegador (F12) para mais detalhes

### Erro: "Conectado ao banco de dados"
- Verifique se DATABASE_URL está configurado corretamente
- Teste a conexão executando: `npm run dev`

### Usuário não consegue fazer login
- Verifique se o usuário existe no banco: `npm run seed-admin`
- Confirme que a senha está correta (ou resete rodando seed novamente)

---

## 📝 Notas Importantes

- ✅ Login agora é feito via Backend (mais seguro)
- ✅ Tokens JWT expiram em 8 horas
- ✅ Dados sensíveis não são armazenados em localStorage
- ✅ Sistema de permissões por role (ADMIN, OPERADOR, etc.)

---

## 🎯 Próximos Passos Recomendados

1. Altere a senha do admin nas configurações
2. Crie usuários para os operadores
3. Implante o sistema em um servidor (Vercel, Railway, etc.)
4. Configure HTTPS para segurança em produção

---

**Precisa de ajuda?** Entre em contato com o time de desenvolvimento!
