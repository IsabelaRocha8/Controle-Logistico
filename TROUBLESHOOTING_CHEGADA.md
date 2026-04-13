# Troubleshooting: Problema de Registro de Chegada - Operadores

## 🔍 Diagnosticando o Problema

Foram adicionados **logs detalhados em todo o sistema** para rastrear exatamente onde está falhando a sincronização. 

### Como Usar os Logs

1. **Abra o navegador** e acesse: http://localhost:3000/dashboard-operador.html
2. **Abra o Console** (F12 → Aba "Console")
3. **Registre uma chegada**
4. **Observe os logs** aparecerem em tempo real

### ✅ Logs Esperados (Fluxo Correto)

Quando um operador registra uma chegada com sucesso, você verá:

```
[apiRequest] POST /registrar-chegada
[registrar-chegada] Requisição recebida
[registrar-chegada] Body: {...}
[registrar-chegada] Atualizando status da previsão para CHEGOU...
[registrar-chegada] Status atualizado com sucesso
[registrar-chegada] Inserindo no histórico...
[registrar-chegada] Histórico inserido, ID: 123
[apiRequest] ✓ /registrar-chegada - Status 201
[DB.registrarChegada] Iniciando...
[DB.registrarChegada] Resposta da API: {ok: true, historicoId: 123...}
[DB.registrarChegada] Sincronizando previsões...
[apiRequest] GET /previsoes
[DB.registrarChegada] Previsões após sincronização: 15 itens
[DB.registrarChegada] Sincronizando histórico...
[apiRequest] GET /historico
[DB.registrarChegada] Histórico após sincronização: 10 itens
[confirmarChegada] Sucesso - Atualizando localStorage...
[confirmarChegada] Status local atualizado para CHEGOU
```

### ❌ Logs de Erro (Problemas Comuns)

#### Erro 1: Previsão Não Encontrada
```
[registrar-chegada] Previsão não encontrada para SJ: XXXXX Container: YYYYY
[apiRequest] ERRO: Previsão não encontrada para este SJ/container.
```
**Solução:** Verifique se o SJ e Container estão corretos

#### Erro 2: API Indisponível
```
[registrar-chegada] Requisição recebida
[registrar-chegada] ERRO: Conexão com o banco não configurada
```
**Solução:** Verifique se a variável `DATABASE_URL` está configurada no `.env`

#### Erro 3: Sincronização Falhando
```
[DB.init] Erro ao sincronizar previsões: Network error
```
**Solução:** Verifique se o servidor está rodando (`npm run dev`)

#### Erro 4: Status Não Atualizado Localmente
```
[confirmarChegada] Status local atualizado para CHEGOU
[confirmarChegada] Sucesso na API - Atualizando localStorage...
// Mas não vê: [confirmarChegada] Status local atualizado para CHEGOU
```
**Solução:** localStorage pode estar corrompido, limpe o cache

---

## 🧪 Teste Manual Passo a Passo

### Preparação
1. Abra o Console (F12)
2. Limpe localStorage: digitar no console:
   ```javascript
   localStorage.clear()
   ```
3. Recarregue a página
4. Faça login como operador

### Teste
1. Vá para Dashboard (operador)
2. Clique em "Registrar Chegada" em um container pendente
3. **Observe o Console** e procure pelos logs:
   - `[confirmarChegada] Registrando:` → iniciação
   - `[DB.registrarChegada] Sucesso na API` → backend OK
   - `[confirmarChegada] Status local atualizado para CHEGOU` → localStorage OK
4. Clique OK na modal de sucesso
5. Verifique se foi redirecionado para Histórico
6. Verifique se o registro aparece no Histórico

### Validação Final
No Console, execute:
```javascript
// Ver previsões pendentes (sem CHEGOU)
const prevs = JSON.parse(localStorage.getItem('previsoesChegada'));
const pendentes = prevs.filter(p => p.status !== 'CHEGOU');
console.log('Previsões pendentes:', pendentes.length);

// Ver histórico
const hist = JSON.parse(localStorage.getItem('historico'));
console.log('Registros no histórico:', hist.length);
```

---

## 📊 Checklist de Verificação

- [ ] Backend está rodando (`npm run dev`)
- [ ] Variável `DATABASE_URL` está configurada
- [ ] Banco de dados tem conexão ativa
- [ ] tabelas `previsoesChegada` e `historico` existem
- [ ] Usuário logado tem perfil OPERADOR
- [ ] Container selecionado tem status ≠ 'CHEGOU'
- [ ] Todos os campos do formulário preenchidos
- [ ] Console mostra `[registrar-chegada] Status atualizado com sucesso`
- [ ] Console mostra `[registrar-chegada] Histórico inserido`
- [ ] localStorage foi atualizado (verificar com console)
- [ ] Redirecionamento para histórico aconteceu
- [ ] Novo registro aparece em histórico

---

## 🛠️ Comandos Úteis

### Ver todos os logs de "chegada"
```javascript
// No console, coloque um filtro
// Filter: "chegada"
```

### Forçar sincronização manual
```javascript
// Se algo der errado, force a sincronização
await window.DB.init();
```

### Ver dados no localStorage
```javascript
console.table(JSON.parse(localStorage.getItem('previsoesChegada')));
console.table(JSON.parse(localStorage.getItem('historico')));
```

### Limpar dados e recomeçar
```javascript
localStorage.removeItem('previsoesChegada');
localStorage.removeItem('historico');
location.reload();
```

---

## 📝 Se Ainda Assim Não Funcionar

Se os logs indicarem que está tudo OK, mas o registro não persiste após atualizar:

1. **Verifique o Banco de Dados Diretamente**
   ```sql
   SELECT * FROM previsoesChegada WHERE status = 'CHEGOU' LIMIT 5;
   SELECT COUNT(*) FROM historico;
   ```

2. **Verifique se a API está Retornando dados corretos**
   - Abra o DevTools → Aba Network
   - Faça um registro
   - Procure pela requisição `/registrar-chegada`
   - Verifique a resposta

3. **Verifique as Permissões**
   - Operador pode registrar chegadas?
   - Há algum filtro de perfil bloqueando?

4. **Verifique o Histórico de Requisições**
   - Network Tab mostra todas as requisições
   - Procure por erros 400, 404, 409, 500
   - Verifique o Response de cada comando

---

## 📞 Informações para Debugging

Ao reportar um problema, forneça:
1. Screenshot dos logs do console
2. DevTools → Network tab (screenshot)
3. Dados que você tentou registrar (SJ, Container, etc)
4. Seu perfil de usuário
5. Mensagem exata que recebeu
