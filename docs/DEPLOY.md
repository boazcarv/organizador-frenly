# Colocando o Frenly no ar

Dois caminhos. **A Vercel é o recomendado** — é mais barato, tem HTTPS e domínio
próprio de graça e não pede manutenção de servidor.

- [Caminho A — Vercel + Neon](#caminho-a--vercel--neon) (recomendado)
- [Caminho B — Docker em VPS](#caminho-b--docker-em-vps)

Em ambos os casos o app precisa de **um Postgres**. O modo sem banco (PGlite)
existe só para desenvolvimento: grava em arquivo local e não sobrevive em
plataformas serverless.

---

## Caminho A — Vercel + Neon

Tempo estimado: 15 minutos. Custo: R$ 0 para começar (os dois têm plano free).

### 1. Criar o banco (5 min)

1. Acesse <https://neon.tech> e crie uma conta (pode entrar com o GitHub).
2. Crie um projeto. **Região:** escolha `AWS us-east-1` (Virgínia) — é a mais
   próxima do Brasil e a mesma região padrão da Vercel, então a latência cai.
   > A Vercel não tem região no Brasil no plano free. `us-east-1` para os dois
   > lados é a melhor combinação possível.
3. Na tela do projeto, copie a **Connection string**. Pegue a que tem
   `-pooler` no meio do host:

   ```
   postgresql://usuario:senha@ep-abc-123-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

   A versão com pooler importa: cada função da Vercel abre a própria conexão, e
   sem o pooler o Postgres do Neon estoura o limite de conexões.

4. Guarde essa string. Ela é uma senha: não cole em issue, print ou chat.

> **Pronto para uso imediato:** o app cria as tabelas sozinho na primeira
> requisição. Não existe passo de migração para rodar.

### 2. Subir o código no GitHub (3 min)

O código já está num repositório. Se for criar um novo:

```bash
git remote -v                     # confira para onde está apontando
git push -u origin main
```

### 3. Criar o projeto na Vercel (4 min)

1. <https://vercel.com/new> → **Import Git Repository** → escolha o repositório.
2. A Vercel detecta Next.js sozinha. **Não mude** o *Build Command* nem o
   *Output Directory*.
3 . Antes de clicar em *Deploy*, abra **Environment Variables** e adicione:

| Nome | Valor | Obrigatória |
| --- | --- | --- |
| `DATABASE_URL` | a string do Neon (passo 1) | **sim** |
| `AUTH_SECRET` | o resultado de `openssl rand -base64 32` | **sim** |
| `TZ` | `America/Sao_Paulo` | **sim** |

Gere o `AUTH_SECRET` no seu computador:

```bash
openssl rand -base64 32
```

> **Por que `TZ` é obrigatório:** por padrão a Vercel roda em UTC. Sem essa
> variável, "hoje" no painel seria o dia UTC — às 21h de Fortaleza o app já
> estaria mostrando o dia seguinte, e as horas lançadas à noite cairiam na data
> errada.

4. Clique em **Deploy**. O primeiro build leva cerca de 2 minutos.

As três variáveis precisam estar no ambiente **Production**. Se você quiser
testar em *Preview* também, marque as três caixas (Production, Preview,
Development) na criação.

### 4. Primeiro acesso (1 min)

1. Abra a URL que a Vercel deu (`https://seu-projeto.vercel.app`).
2. Como o banco está vazio, o app te leva para **Criar workspace**.
3. Preencha nome, e-mail e senha. **Esta conta é a do dono.**
4. Você cai no dashboard, já logado.

> Anote a senha agora. Não há recuperação por e-mail configurada — se perder,
> o caminho é trocar direto no banco (`docs/DEPLOY.md#recuperar-acesso`).

### 5. Criar o login da sua CEO (1 min)

1. **Settings → Acessos → Adicionar pessoa**.
2. Nome, e-mail, papel (ex.: `CEO`), senha inicial.
3. Copie a senha e mande para ela por um canal privado (WhatsApp, 1Password…).
4. Ela entra em `/login` com esse e-mail e senha, e pode trocar a senha em
   **Settings → Acessos → ícone de chave**.

O cadastro é fechado: ninguém consegue criar conta sozinho. Só o dono cria
acessos.

### 6. Domínio próprio (opcional, 5 min)

1. **Vercel → seu projeto → Settings → Domains → Add**.
2. Digite seu domínio (ex.: `app.suaempresa.com`).
3. A Vercel mostra o registro DNS a criar. No seu registrador (Registro.br,
   Cloudflare…), adicione:
   - `CNAME  app  →  cname.vercel-dns.com`
4. Espere a propagação (minutos a algumas horas). O HTTPS é emitido
   automaticamente.

---

## Caminho B — Docker em VPS

Para quem prefere ter tudo num servidor próprio (Hetzner, DigitalOcean,
Contabo…). Sugestão de máquina: 1 vCPU / 1 GB já resolve.

1. Instale Docker e Docker Compose na máquina.
2. Suba um Postgres. O `compose.yaml` abaixo sobe os dois:

```yaml
# compose.yaml
services:
  db:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: frenly
      POSTGRES_USER: frenly
      POSTGRES_PASSWORD: troque-esta-senha
    volumes:
      - frenly-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U frenly"]
      interval: 5s
      retries: 10

  app:
    build: .
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://frenly:troque-esta-senha@db:5432/frenly
      AUTH_SECRET: troque-por-openssl-rand-base64-32
      TZ: America/Sao_Paulo
    ports:
      - "3000:3000"

volumes:
  frenly-db:
```

3. `docker compose up -d --build`
4. Abra `http://IP-DA-MAQUINA:3000` e faça o primeiro acesso (passo 4 acima).

Para HTTPS, coloque um Caddy ou Nginx na frente. Com Caddy é uma linha:

```
app.suaempresa.com {
    reverse_proxy localhost:3000
}
```

---

## Operação

### Backup

**Neon:** o plano free já guarda o histórico por alguns dias e permite
restaurar por data no painel (*Branches → Restore*). Para um dump manual:

```bash
pg_dump "postgresql://.../neondb?sslmode=require" > frenly-$(date +%F).sql
```

**VPS:** `docker compose exec db pg_dump -U frenly frenly > backup.sql`

### Zerar os dados sem perder as contas

**Settings → Acessos** não faz isso; o endpoint existe e é só para o dono:

```bash
curl -X POST https://seu-app.vercel.app/api/admin/reset \
  --cookie "frenly_session=SEU_COOKIE"
```

> Isso apaga projetos, tarefas, agenda e horas. As contas continuam.

### Atualizar a versão publicada

- **Vercel:** `git push` na branch de produção. A Vercel builda e publica sozinha.
- **VPS:** `git pull && docker compose up -d --build`

Mudanças de schema são aplicadas sozinhas na primeira requisição — o app usa
`create table if not exists` e uma tabela `schema_migrations` para o que vier
depois. Como as tabelas só nascem, atualizar nunca apaga dado.

### Recuperar acesso

Sem e-mail configurado, a senha se troca pelo banco:

```bash
# 1. gere o hash de uma senha nova
node -e "const{randomBytes,scryptSync}=require('crypto');const s=randomBytes(16);console.log('scrypt:'+s.toString('hex')+':'+scryptSync('SUA-NOVA-SENHA',s,64).toString('hex'))"

# 2. grave no banco
psql "$DATABASE_URL" -c "update users set password_hash = 'COLAR_O_HASH' where email = 'seu@email.com';"
```

---

## Solução de problemas

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| `DATABASE_URL não configurada` | Variável ausente no ambiente | Adicione em Settings → Environment Variables e faça **Redeploy** (variável nova só vale no próximo build) |
| `AUTH_SECRET não configurada` | Idem | Gere com `openssl rand -base64 32` e faça Redeploy |
| Login funciona e volta para `/login` | Cookie sendo recusado | Confirme que está em `https://` e que `AUTH_SECRET` não muda entre deploys (trocar a chave invalida toda sessão) |
| "too many connections" no Neon | Usando a URL sem `-pooler` | Troque pela string com `-pooler` |
| Datas erradas por um dia | Falta `TZ` | Adicione `TZ=America/Sao_Paulo` e faça Redeploy |
| Build falha no `next build` | Erro de tipo/lint | Rode `npm run typecheck && npm run lint` localmente |

---

## Checklist final

- [ ] Postgres criado e `DATABASE_URL` configurada
- [ ] `AUTH_SECRET` gerada e configurada
- [ ] `TZ=America/Sao_Paulo` configurada
- [ ] Deploy concluído e a URL abre a tela de **Criar workspace**
- [ ] Sua conta de dono criada
- [ ] Login da sua CEO criado em Settings → Acessos
- [ ] Ela conseguiu entrar de um dispositivo diferente
- [ ] Backup automático do Neon conferido (ou um `pg_dump` agendado)
