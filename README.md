# Frenly — SaaS de gestão de projetos e tempo

Dashboard de produto completo em **Next.js (App Router) + React 19 + TypeScript strict + Tailwind v4 +
shadcn/ui + Motion**, em pt-BR, com **PostgreSQL**, **login real** e uma camada de API que isola a
interface do banco.

Para colocar no ar, siga [`docs/DEPLOY.md`](docs/DEPLOY.md).

```bash
npm install
npm run dev        # http://localhost:3000  (TZ=America/Sao_Paulo)
```

Na primeira execução o app abre a tela **Criar workspace** — não há dado de
demonstração nem senha padrão. Você cria a sua conta de dono e, depois, o acesso
das outras pessoas em **Settings → Acessos**.

```bash
npm run build      # build de produção (turbopack)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

---

## 1. Estado final (autoverificação)

| Critério | Situação |
| --- | --- |
| `next build` | ✅ sem erros |
| `tsc --noEmit` | ✅ limpo, zero `any` explícito |
| `eslint` | ✅ 0 erros, 0 warnings |
| Autenticação | ✅ sessão assinada em cookie httpOnly, sem cadastro público |
| Autorização | ✅ rotas de API com 401 sem sessão; ações de dono com 403 |
| Banco | ✅ PostgreSQL com schema criado na primeira requisição |
| Workspace vazio | ✅ telas com estado vazio, sem `NaN` nem gráfico quebrado |
| Números inventados | ✅ nenhum: dashboard e analytics derivam das linhas reais |
| 6 rotas + transição | ✅ keyframe CSS `.page-enter` com `key={pathname}`, sem flash branco (ver §8) |
| Accent | ✅ 5 paletas (verde, azul, roxo, rosé, âmbar) re-tingem a UI via `data-accent` |
| Kanban | ✅ dnd-kit com `DragOverlay`, ordem persistida, alternativa por teclado |
| Cronômetro | ✅ conta em tempo real, pausa, para, reseta, sobrevive à troca de rota e grava a sessão |
| `prefers-reduced-motion` | ✅ nada anima, tudo continua funcional |
| Overflow horizontal | ✅ nenhum em 1440 / 1280 / 1024 / 390 px |
| Screenshots de QA | ✅ em [`docs/screenshots`](docs/screenshots) |

> **Sobre os screenshots:** foram capturados antes da migração para Postgres e
> login, quando as telas vinham de dados de demonstração. O desenho da interface
> não mudou; o conteúdo mudou (o workspace começa vazio). Os scripts que os
> geram continuam em [`scripts/`](scripts/README.md).

---

## 2. Direção de arte

- **Enquadramento**: janela clara de cantos 28px flutuando sobre o canvas verde `#06361E`, sidebar
  `surface-muted` de 240px + topbar de 64px.
- **Tokens** em `app/globals.css` dentro de `@theme inline` — nenhuma cor solta nos componentes.
  `canvas · surface · surface-muted · line · deep · ink · ink-soft · ink-faint · accent · accent-strong ·
  accent-soft · accent-tint · danger · warn · info` + pastéis de dado (pêssego, azul, sálvia, areia, lilás).
- **Raio 20px** nos cards, pills nos botões/chips, blocos internos 13–14px. Sombra quase invisível em
  repouso (`--shadow-card`), perceptível no hover (`--shadow-card-hover`) com elevação de 2px **em CSS**.
- **Tipografia**: Geist Sans/Mono, base 14px, título de página 28px semibold, labels de seção 11px
  uppercase com `letter-spacing: .08em`, métricas 38px semibold `tabular-nums`.
- **Dark mode real**: `#0B1614` / `#101C18`, bordas `rgba(255,255,255,.08)`, accent clareado para manter
  contraste AA; troca com **reveal circular** (View Transitions + `clip-path: circle()`).
- **Tela de acesso** compartilha o mesmo canvas e a mesma janela flutuante, para a porta e a sala
  parecerem o mesmo lugar.

---

## 3. Arquitetura

```
proxy.ts                     # porteiro: assinatura do cookie, sem tocar no banco
instrumentation.ts           # define o TZ do processo antes da primeira requisição
app/
  layout.tsx                 # fontes (geist), providers, data-accent, metadata pt-BR
  providers.tsx              # ThemeProvider · TanStack Query · MotionConfig · TooltipProvider · Toaster
  login/  setup/             # entrada e primeira execução (client, estáticas)
  api/auth/*                 # setup · login · logout
  api/account/*              # contas do workspace (dono cria, todos leem)
  api/{dashboard,analytics,projects,tasks,members,events,time-entries,notifications,profile,admin/reset}
  (app)/layout.tsx           # shell: canvas + janela + sidebar + topbar + drawer + tracker mobile
  (app)/{dashboard,team,calendar,analytics,tasks,settings}/page.tsx
components/  shell · motion · dashboard · charts · tasks · team · calendar · settings · auth · ui
lib/         types · constants · api (transporte) · queries (TanStack) · format · motion · accents · storage
lib/server/  sql (driver) · schema (DDL) · auth (senha+sessão) · session (token) · users · repository · insights · http
```

### Dados

O app fala com **PostgreSQL**. Não existe mais arquivo de dados nem dataset de
demonstração: o workspace nasce vazio e é preenchido pelo uso.

- `lib/server/schema.ts` — DDL idempotente (`create table if not exists` + uma tabela
  `schema_migrations` para o que vier depois). Uma base nova fica pronta na primeira requisição,
  sem passo de migração.
- `lib/server/sql.ts` — um único contrato, dois drivers: **`pg`** quando `DATABASE_URL` existe
  (produção) e **PGlite** (Postgres em WASM, em processo) quando não existe (desenvolvimento). As
  consultas de `repository.ts` são as mesmas nos dois.
- `lib/server/repository.ts` — CRUD e regras (recalcular contadores do projeto, cascata ao excluir,
  `completed_at` ao concluir uma tarefa).
- `lib/server/insights.ts` — dashboard e analytics. **Todo número é derivado das linhas reais.** O
  agrupamento por dia/semana acontece em TypeScript de propósito: o fuso da sessão de um Postgres
  hospedado costuma ser UTC, e "hoje" precisa significar hoje em São Paulo.

### Autenticação

```
proxy.ts                     # verifica a ASSINATURA do token (sem banco) e barra /api/*
lib/server/session.ts        # token = base64url(payload).base64url(HMAC-SHA256)
lib/server/auth.ts           # scrypt para senha, lookup do usuário, getSessionUser()
```

- A sessão é um token assinado e autocontido (`uid`, `exp`) em cookie **httpOnly**, `sameSite=lax`,
  `secure` conforme o protocolo real da requisição (e não `NODE_ENV`, que produziria um loop de login
  em quem serve produção por HTTP).
- O `proxy` é a porta externa; cada rota de API **também** resolve a sessão contra o banco antes de
  tocar em dado, então um cookie válido de uma conta removida não leva a lugar nenhum.
- Senhas usam `scrypt` com salt por usuário no formato `scrypt:<salt>:<hash>`, comparadas em tempo
  constante. O custo do scrypt é o freio de força bruta; a mensagem de erro é genérica para não
  revelar se o e-mail existe.
- **Sem cadastro público.** `POST /api/auth/setup` só funciona enquanto não existe nenhuma conta.
  Depois disso, só o dono cria acessos (`POST /api/account`).
- Preferências de notificação são **por conta**; horas registradas são atribuídas ao usuário da
  sessão (nunca ao payload, senão daria para lançar horas no nome de outra pessoa).

### Estado

- **Zustand** — `ui` (sidebar, drawer, ⌘K, accent), `tracker` (cronômetro com reconciliação de relógio
  de parede) e `board` (ordem das colunas + payload das tarefas). Rehidratação best-effort via
  `lib/storage.ts`, que cai para memória quando o `localStorage` está bloqueado.
- **TanStack Query** — todo dado remoto (staleTime 30s), com `loading.tsx`/skeletons por rota. As
  queries só entregam dados depois da hidratação (`useApiQuery`), para o primeiro render do cliente
  ser idêntico ao HTML do servidor.
- **Motion** — `MotionConfig reducedMotion="user"` global.

---

## 4. Animações implementadas (spec 1–20)

| # | Interação | Onde |
| --- | --- | --- |
| 1 | Fade + 8px de entrada de página, 300ms | `components/motion/page-transition.tsx` |
| 2 | Cascata de cards (stagger 50–70ms) | `components/motion/stagger.tsx` |
| 3 | Count-up com `useSpring` + `useTransform` | `components/motion/animated-number.tsx` |
| 4 | Sparkline desenhando (`pathLength` 0→1) | `components/charts/sparkline.tsx` |
| 5 | Área com gradiente animado + linha do período anterior | `components/charts/area-throughput.tsx` |
| 6 | Donut com `strokeDashoffset` animado (700ms) | `components/charts/donut-breakdown.tsx` |
| 7 | Pílula deslizante do menu (`layoutId="nav-pill"`) | `components/shell/nav-item.tsx` |
| 8 | Hover de card: sobe 2px + sombra (CSS) | `@utility card-hover` em `globals.css` |
| 9 | Kanban: card levanta (scale 1.02, 1.5°, sombra), coluna realça | `components/tasks/board.tsx` |
| 10 | Filtro do Team com FLIP (`layout` + `AnimatePresence`) | `app/(app)/team/page.tsx` |
| 11 | Drawer de membro com spring + backdrop blur | `components/team/member-drawer.tsx` |
| 12 | Troca de accent re-tinge tudo (600ms) | `components/settings/appearance-picker.tsx` |
| 13 | Light/dark com reveal circular (View Transitions) | `components/shell/use-theme-reveal.ts` |
| 14 | Cronômetro: pulso + flip por dígito (odômetro) | `components/dashboard/time-tracker.tsx` |
| 15 | Barras e anel enchem de 0 ao valor | `progress-ring-card`, `task-card`, `projects-bar` |
| 16 | Chips/toggles com spring curto no clique | `components/motion/pressable.tsx` |
| 17 | ⌘K com fade + spring | `components/shell/command-menu.tsx` |
| 18 | Modais Radix com spring | `add-task-dialog`, `task-detail`, `collaborators` |
| 19 | Scroll reveal (`whileInView`, `once`) | `components/motion/fade-in.tsx` |
| 20 | Spotlight do promo card seguindo o cursor | `components/shell/promo-card.tsx` |

**Regra de ouro respeitada**: nenhum estado de animação bloqueia clique — as ações seguem o caminho
otimista (Zustand + Query) e a animação apenas acompanha.

---

## 5. Acessibilidade

- `role="timer"` + `aria-label` humano no cronômetro, `aria-live` nos toasts do Sonner.
- `aria-label` em todo botão de ícone; `aria-current` em navegação; `aria-pressed` em chips/segmentados.
- dnd-kit com `KeyboardSensor` + `accessibility.announcements` (Tab → espaço → setas → espaço).
- `:focus-visible` global com anel accent de 2px e offset 2px; contraste AA nas duas aparências.
- Diálogos/drawers Radix com trap de foco, `Esc` e `overscroll-contain`.
- Formulários de acesso com `Label` associado, `autoComplete` correto e erro em `role="alert"`.

## 6. Performance

- Gráficos Recharts carregados com `dynamic(..., { ssr: false })` e medidos por `ResizeObserver`
  (`lib/use-measure.ts`), então montam já com dimensões reais: **zero CLS**.
- Avatares são CSS (iniciais sobre pastel) — nenhuma requisição externa, nenhuma imagem.
- Motion anima apenas `transform`/`opacity`; hover e cores ficam em CSS transitions.
- Conexões com o Postgres: um pool por processo, `max: 1` na Vercel (uma conexão por instância,
  com o pooler do provedor fazendo o trabalho pesado).

---

## 7. Scripts de QA (Playwright)

Ver [`scripts/README.md`](scripts/README.md) — agora exigem `FRENLY_COOKIE`, porque o app tem login.

## 8. Correções de robustez (pós-QA)

1. **Página em branco após navegar** — a entrada de rota usava `AnimatePresence mode="wait"` +
   `motion.main`: a visibilidade dependia de um handshake em JS que podia ser interrompido e deixar o
   conteúdo com `opacity` intermediária. Agora é keyframe CSS (`.page-enter`), que começa no primeiro
   paint e sempre termina.
2. **Preview com 403 nos chunks** — `next dev` rejeitava requisições cujo Origin/Host não era
   localhost, o que derrubava JS/CSS/fontes atrás de um proxy. Resolvido com `allowedDevOrigins`.
3. **Storage bloqueado derrubava a rota** — `lib/storage.ts` cai para memória e há
   `app/global-error.tsx` como última linha de defesa.
4. **Gráficos quebrando com workspace vazio** — `Math.max(...[])` devolve `-Infinity` e transformava a
   largura de cada barra em `NaN`; `periods[index]` estourava quando a lista de períodos vinha vazia.
   Ambos corrigidos, com estado vazio explícito em carga de trabalho e distribuição de tempo.
5. **Eixo Y fixo no gráfico de entregas** — o eixo ia até 12 e cortava semanas mais produtivas. Agora a
   escala acompanha o dado.

## 9. API

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/api/auth/setup` | `{ needsSetup }` — público, só esse booleano |
| POST | `/api/auth/setup` | cria a conta do dono (só enquanto não existe conta) |
| POST | `/api/auth/login` | e-mail + senha → cookie de sessão |
| POST | `/api/auth/logout` | apaga o cookie |
| GET/POST | `/api/account` | lista contas / cria acesso (dono) |
| PATCH/DELETE | `/api/account/:id` | edita (a si mesmo sempre; outros se dono) / remove (dono) |
| GET | `/api/dashboard` | stats, produtividade, lembretes, projetos, time, eventos de hoje, horas |
| GET | `/api/analytics?period=today\|week\|month` | métricas, entregas, distribuição e capacidade |
| GET/POST | `/api/projects` | lista / cria projeto |
| GET/PATCH/DELETE | `/api/projects/:id` | detalhe / atualiza / remove (cascata) |
| GET/POST | `/api/tasks` | lista / cria tarefa |
| PATCH/DELETE | `/api/tasks/:id` | move de coluna, muda progresso, remove |
| GET | `/api/members`, `/api/members/:id` | time e detalhe |
| GET | `/api/events?scope=agenda\|upcoming` | agenda do dia e próximos compromissos |
| GET/POST | `/api/time-entries` | histórico e gravação de sessão do cronômetro |
| GET | `/api/notifications`, PATCH `/api/notifications/:id` | preferências da conta |
| GET/PATCH | `/api/profile` | perfil da conta na sessão |
| POST | `/api/admin/reset` | zera o conteúdo do workspace (só o dono) |

Todas as rotas acima, exceto as três de `/api/auth/*` e o `GET` do setup, respondem **401** sem
sessão válida.

**Workspace vazio:** os números aparecem como zero de verdade — a carga de trabalho, a distribuição
de tempo e o histórico de produtividade mostram um estado vazio explicando o que fazer para
preenchê-los, em vez de um gráfico com números inventados.

## 10. O que ficou fora (por decisão)

- **Convite por e-mail.** Não há e-mail transacional configurado, então o acesso é criado à mão em
  Settings → Acessos e a senha é combinada por fora. O botão de convite do dashboard diz isso em vez
  de fingir que enviou algo.
- **Presença online.** Não é rastreada: o time aparece sem o ponto verde, porque um indicador em que
  ninguém pode confiar é pior do que nenhum.
- **Recuperação de senha por e-mail.** Exige um provedor; o caminho manual está em
  [`docs/DEPLOY.md`](docs/DEPLOY.md#recuperar-acesso).
- **Papéis e permissões granulares.** Existem dois níveis: dono e membro. Suficiente para dois.
- **Upload real de avatar, chat do time, salas de vídeo, importação de CSV/Notion/Jira.** Sinalizados
  com toasts honestos em vez de botões mortos.
- **Migrações versionadas.** O schema usa `create table if not exists` + `schema_migrations`; quando
  houver mudança de coluna, a lista em `lib/server/schema.ts` é o lugar.
