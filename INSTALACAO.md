# INSTRUÇÕES DE INSTALAÇÃO - BANCO COMPARTILHADO

## Pré-requisitos
1. Node.js instalado (versão 16 ou superior)
   - Download: https://nodejs.org/

## Instalação

### 1. Instalar dependências
Abra o terminal/prompt na pasta do projeto e execute:
```
npm install
```

### 2. Criar pasta do banco de dados
Crie a pasta `database` dentro da pasta do projeto:
```
M:\Centro de Manufatura制造中心\Estoque e Logistica仓储物流\SITE NIL\database\
```

### 3. Iniciar o servidor
```
npm start
```

O servidor iniciará na porta 3000 e criará automaticamente o banco SQLite compartilhado.

## Configuração da Rede

### Para acessar de outros computadores:

1. **No computador servidor** (onde o Node.js está rodando):
   - Descubra o IP local: execute `ipconfig` no cmd
   - Anote o IPv4 (exemplo: 192.168.1.100)

2. **Nos outros computadores**:
   - Abra o arquivo `api.js`
   - Altere a linha:
     ```javascript
     const API_URL = 'http://localhost:3000/api';
     ```
   - Para:
     ```javascript
     const API_URL = 'http://192.168.1.100:3000/api';
     ```
   - Substitua `192.168.1.100` pelo IP do servidor

3. **Configurar Firewall**:
   - Libere a porta 3000 no firewall do Windows do servidor
   - Painel de Controle > Firewall > Configurações Avançadas
   - Nova Regra de Entrada > Porta > TCP > 3000

## Uso

### Iniciar o sistema:
1. Inicie o servidor Node.js no computador principal
2. Abra o navegador e acesse: `http://localhost:3000/login.html`
3. Outros computadores acessam: `http://IP_DO_SERVIDOR:3000/login.html`

### Manter servidor sempre ativo:
Opção 1 - Usar PM2 (recomendado):
```
npm install -g pm2
pm2 start server.js --name logistica
pm2 startup
pm2 save
```

Opção 2 - Criar serviço do Windows:
Use o NSSM (Non-Sucking Service Manager)

## Estrutura do Banco

O banco SQLite será criado em:
```
M:\Centro de Manufatura制造中心\Estoque e Logistica仓储物流\SITE NIL\database\logistica.db
```

Tabelas criadas automaticamente:
- historico
- previsoesChegada
- etiquetasImpressas
- nilsGerados
- historicoImpressaoNIL

## Backup

Para fazer backup, copie o arquivo:
```
M:\Centro de Manufatura制造中心\Estoque e Logistica仓储物流\SITE NIL\database\logistica.db
```

## Solução de Problemas

### Erro "Cannot find module"
Execute: `npm install`

### Erro de conexão
- Verifique se o servidor está rodando
- Verifique o IP e porta no arquivo api.js
- Verifique o firewall

### Banco não cria
- Verifique permissões da pasta
- Verifique se a pasta `database` existe

## Migração de Dados Existentes

Se você já tem dados no localStorage, execute o script de migração:
```
node migrar-dados.js
```

Este script irá:
1. Ler dados do localStorage de um navegador
2. Inserir no banco SQLite compartilhado
