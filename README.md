# Frenly — SaaS de gestão de projetos e tempo

Dashboard de produto completo em **Next.js (App Router) + React 19 + TypeScript strict + Tailwind v4 +
shadcn/ui + Motion**, com dados em pt-BR, um **backend JSON + REST** atrás de `lib/api.ts` (ver §9) e uma
camada de API pronta para virar Supabase/Prisma sem tocar na interface. As telas nascem de uma semente
determinística (`lib/mock-data.ts`), então o app também funciona sem nenhum serviço externo.

```bash
npm install
npm run dev        # http://localhost:3000  (TZ=America/Sao_Paulo)
npm run build      # build de produção (turbopack)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

---

## 1. Estado final (autoverificação)

| Critério | Situação |
| --- | --- |
| `next build` | ✅ sem erros nem warnings |
| `tsc --noEmit` | ✅ limpo, zero `any` explícito, zero TODO |
| `eslint` | ✅ 0 erros, 0 warnings (React Compiler / react-hooks rules incluídas) |
| Console do navegador | ✅ zero erros e zero warnings nas 6 rotas (checado com Playwright) |
| 6 rotas + transição | ✅ keyframe CSS `.page-enter` com `key={pathname}`, sem flash branco (ver §8) |
| Accent | ✅ 5 paletas (verde, azul, roxo, rosé, âmbar) re-tingem UI inteira via `data-accent` |
| Kanban | ✅ dnd-kit com `DragOverlay`, ordem persistida no Zustand, alternativa por teclado |
| Cronômetro | ✅ conta em tempo real, pausa, para, reseta, sobrevive à troca de rota e grava a sessão na API |
| `prefers-reduced-motion` | ✅ nada anima, tudo continua funcional (testado a 1440×900) |
| Overflow horizontal | ✅ nenhum em 1440 / 1280 / 1024 / 390 px (medido via `scrollWidth`) |
| Backend | ✅ projetos/tarefas/notificações/perfil/cronômetro gravam em `data/frenly.json` e sobrevivem ao reload |

Screenshots de QA em [`docs/screenshots`](docs/screenshots) (claro, escuro, mobile, drawer, drag, ⌘K, accent).

---

## 2. Direção de arte

- **Enquadramento**: janela clara de cantos 28px flutuando sobre o canvas verde `#06361E`, sidebar
  `surface-muted` de 240px + topbar de 64px.
- **Tokens** em `app/globals.css` dentro de `@theme inline` — nenhuma cor solta nos componentes.
  `canvas · surface · surface-muted · line · deep · ink · ink-soft · ink-faint · accent · accent-strong ·
  accent-soft · accent-tint · danger · warn · info` + pastéis de dado (pêssego, azul, sálvia, areia, lilás).
- **Raio 20px** nos cards, pills nos botões/chips, blocos internos 13–14px. Sombra quase invisível em
  repouso (`--shadow-card`), perceptível no hover (`--shadow-card-hover`) com elevação de 2px **em CSS**,
  nunca em Motion.
- **Tipografia**: Geist Sans/Mono, base 14px, título de página 28px semibold, labels de seção 11px
  uppercase com `letter-spacing: .08em`, métricas 38px semibold `tabular-nums`.
- **Dark mode real**: `#0B1614` / `#101C18`, bordas `rgba(255,255,255,.08)`, accent clareado para manter
  contraste AA; troca com **reveal circular** (View Transitions + `clip-path: circle()`).

---

## 3. Arquitetura

```
app/
  layout.tsx                 # fontes (geist), providers, data-accent, metadata pt-BR
  providers.tsx              # ThemeProvider · TanStack Query · MotionConfig(reducedMotion="user") · TooltipProvider · Toaster
  globals.css                # tokens @theme, dark mode, keyframes, reduced-motion
  (app)/layout.tsx           # shell: canvas + janela + sidebar + topbar + drawer + tracker mobile
  (app)/{dashboard,team,calendar,analytics,tasks,settings}/page.tsx
  (app)/loading.tsx           # skeletons que imitam o layout real
  (app)/error.tsx             # erro amigável + reset
components/
  shell/      sidebar · nav-item · topbar · user-chip · promo-card · theme-toggle · command-menu · app-shell
  motion/     animated-number · fade-in · stagger · page-transition · pressable
  dashboard/  stat-card · projects-bar · reminders-card · projects-list · collaborators · progress-ring-card · time-tracker
  charts/     sparkline · area-throughput · donut-breakdown · workload-bars · metric-card
  tasks/      board · column · task-card · add-task-dialog · task-detail
  team/       filters · member-card · member-drawer
  calendar/   month-grid · day-cell · event-chip · agenda
  settings/   profile-form · notification-list · appearance-picker
  ui/         shadcn (button, dialog, sheet, select, switch, tooltip, chart…) + panel, chip, segmented,
              initials-avatar, project-icon, empty-state, command, relative-time, page-header
lib/          types · constants · mock-data (semente, server-only) · api · queries · format · motion · stagger ·
              accents · storage · tracker-seed · use-hydrated · use-measure · utils
lib/server/   seed.ts (Database + buildSeed) · db.ts (store JSON atômico) · repository.ts (CRUD + agregados) · http.ts
app/api/      dashboard · analytics · projects[/:id] · tasks[/:id] · members[/:id] · events · time-entries ·
              notifications[/:id] · profile · admin/reset   (14 rotas, ver §9)
data/         frenly.json — banco em runtime (recriado da semente a partir de lib/mock-data.ts)
store/        ui.ts (sidebar/⌘K/drawer/accent) · tracker.ts · board.ts
```

### Dados
`lib/mock-data.ts` é a **semente**: 9 projetos, 9 pessoas, 22 tarefas, 17 eventos, ~65 entradas de tempo —
todas com datas relativas a hoje e geradas de forma determinística (PRNG com seed), para não haver
divergência de hidratação. Na primeira requisição a semente vira o banco em `data/frenly.json`; a partir
daí todo dado lido pela interface vem da API (ver §9), e `lib/api.ts` continua sendo o único ponto de
troca de transporte.

### Estado
- **Zustand** — `ui` (sidebar, drawer, ⌘K, accent), `tracker` (cronômetro com reconcilição de relógio de
  parede, sobrevive à navegação) e `board` (ordem das colunas + payload das tarefas).
- **TanStack Query** — todo dado "remoto" (staleTime 30s), com `loading.tsx`/skeletons por rota. As
  queries só entregam dados depois da hidratação (`useApiQuery`), para o primeiro render do cliente ser
  idêntico ao HTML do servidor.
- **Motion** — `MotionConfig reducedMotion="user"` global: todo `animate` respeita a preferência do sistema.

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
| 10 | Filtro do Team com FLIP (`layout` + `AnimatePresence`) | `app/(app)/team/page.tsx`, `components/team/member-card.tsx` |
| 11 | Drawer de membro com spring + backdrop blur | `components/team/member-drawer.tsx` |
| 12 | Troca de accent re-tinge tudo (600ms) | `components/settings/appearance-picker.tsx` |
| 13 | Light/dark com reveal circular (View Transitions) | `components/shell/use-theme-reveal.ts` |
| 14 | Cronômetro: pulso + flip por dígito (odômetro) | `components/dashboard/time-tracker.tsx` |
| 15 | Barras e anel enchem de 0 ao valor (ease-out, 800ms) | `progress-ring-card`, `task-card`, `projects-bar` |
| 16 | Chips/toggles com spring curto no clique | `components/motion/pressable.tsx` |
| 17 | ⌘K com fade + spring | `components/shell/command-menu.tsx` |
| 18 | Modais Radix com spring | `add-task-dialog`, `task-detail`, `collaborators` |
| 19 | Scroll reveal (`whileInView`, `once`) | `components/motion/fade-in.tsx` |
| 20 | Spotlight do promo card seguindo o cursor | `components/shell/promo-card.tsx` (CSS vars, zero re-render) |

**Regra de ouro respeitada**: nenhum estado de animação bloqueia clique — as ações seguem o caminho
otimista (Zustand + Query) e a animação apenas acompanha.

---

## 5. Acessibilidade

- `role="timer"` + `aria-label` humano no cronômetro, `aria-live` nos toasts do Sonner.
- `aria-label` em todo botão de ícone; `aria-current` em navegação; `aria-pressed` em chips/segmentados.
- dnd-kit com `KeyboardSensor` + `accessibility.announcements` (Tab → espaço → setas → espaço).
- `:focus-visible` global com anel accent de 2px e offset 2px; contraste AA nas duas aparências.
- Diálogos/drawers Radix com trap de foco, `Esc` e `overscroll-contain`.

## 6. Performance

- Gráficos Recharts carregados com `dynamic(..., { ssr: false })` e medidos por `ResizeObserver`
  (`lib/use-measure.ts`), então montam já com dimensões reais: **zero CLS** e nenhum warning de
  "width(-1)" no console.
- Avatares são CSS (iniciais sobre pastel) — nenhuma requisição externa, nenhuma imagem.
- Motion anima apenas `transform`/`opacity`; hover e cores ficam em CSS transitions.

## 7. Scripts de QA (Playwright)

```
scripts/qa.mjs            # screenshots das 6 rotas em 1440 e 390 + captura de erros de console
scripts/interactions.mjs  # ⌘K, accent, dark mode, drag do kanban, filtro+drawer, tracker, reduced-motion, overflow 1280/390
scripts/sweep.mjs         # 1024px, dark mode em todas as rotas, trilha de foco por teclado
scripts/mobile.mjs        # 390px: drawer, kanban com snap, analytics, calendário
scripts/fullpage.mjs      # capturas do fim de cada página
scripts/persistence.mjs   # cria projeto/tarefa, para o cronômetro, alterna notificação e confere no disco
```

## 8. Correções de robustez (pós-QA)

Três falhas encontradas durante a revisão e corrigidas:

1. **Página em branco após navegar** — a entrada de rota usava `AnimatePresence mode="wait"` +
   `motion.main`: a visibilidade dependia de um handshake de saída/entrada em JS que podia ser
   interrompido (clique rápido, aba em segundo plano, frame perdido) e deixar o conteúdo com
   `opacity` intermediária — ou seja, invisível, com a barra de rolagem visível. Agora a entrada é uma
   keyframe CSS (`.page-enter`), que começa no primeiro paint e sempre termina; o `prefers-reduced-motion`
   a reduz a ~0ms. Os micro-labels que dependiam de `mode="wait"` (mês do calendário, período do
   gráfico, ícone de tema) passaram a usar `key` + `animate`, sem saída orquestrada.
2. **Preview com 403 nos chunks** — `next dev` rejeitava requisições cujo Origin/Host não era localhost,
   o que derrubava JS/CSS/fontes quando a página é servida por um proxy (`*.e2b.app`). Resolvido com
   `allowedDevOrigins`; o badge flutuante do dev foi desativado (`devIndicators: false`).
3. **Storage bloqueado derrubava a rota** — em iframe sandbox sem same-origin (ou Safari privado),
   `localStorage` lança `SecurityError`. Os stores agora usam `lib/storage.ts`, que cai para memória,
   a rehidratação é best-effort e existe `app/global-error.tsx` como última linha de defesa.

## 9. Backend real (JSON store + REST)

O app **não** fala mais com mocks direto na interface: ele conversa com rotas de API que persistem em
disco. Um único arquivo de dados, escrita atômica (tmp + rename), fila de escrita por processo.

```
lib/server/seed.ts        # Database interface + buildSeed(): clona lib/mock-data.ts
lib/server/db.ts          # data/frenly.json — cache em memória, fila de escrita, tmp+rename, resetDatabase()
lib/server/repository.ts  # CRUD + agregados (getDashboard, getAnalytics) sobre o banco
lib/server/http.ts        # ok/notFound/badRequest/serverError + readJson  (contrato de erro uniforme)
app/api/**/route.ts       # 14 rotas (ver abaixo); tudo com fallback 500 se o disco falhar
```

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/api/dashboard` | stats, produtividade, lembretes, projetos, colaboradores, eventos de hoje, segundos de hoje |
| GET | `/api/analytics` | agregados de horas, entregas e capacidade (métricas derivadas das linhas reais) |
| GET/POST | `/api/projects` | lista / cria projeto (validação de payload, 400 com mensagem em pt-BR) |
| PATCH/DELETE | `/api/projects/:id` | atualiza / remove (delete devolve `removedTasks` em cascata) |
| GET/POST | `/api/tasks` | lista / cria tarefa |
| PATCH/DELETE | `/api/tasks/:id` | move de coluna, muda progresso, remove |
| GET | `/api/members`, `/api/members/:id` | time e detalhe do colaborador |
| GET | `/api/events?scope=agenda\|upcoming` | agenda do dia e próximos compromissos |
| GET/POST | `/api/time-entries` | histórico e gravação de sessão do cronômetro |
| GET | `/api/notifications`, PATCH `/api/notifications/:id` | preferências (persistem entre reloads) |
| GET/PATCH | `/api/profile` | perfil do usuário atual |
| POST | `/api/admin/reset` | volta ao estado da semente (usado no QA, a UI não chama) |

Fluxos que agora gravam de verdade: criar projeto e criar tarefa (formulários com RHF + zod), excluir
projeto (com cascata nas tarefas), mover tarefa no kanban, alternar notificações, salvar perfil e parar o
cronômetro (grava a sessão exata daquela corrida — o valor cosmético inicial do relógio nunca é salvo).

**Rodando**: `npm run dev` → http://localhost:3000. `rm data/frenly.json` (com o servidor parado) ou
`curl -X POST localhost:3000/api/admin/reset` devolve o workspace ao estado da semente.

## 10. O que ficou fora (por decisão)

- Persistência é do servidor em arquivo (single-tenant): não há autenticação, multiusuário real nem
  banco relacional — o contrato de `lib/api.ts`/`lib/server/repository.ts` é o que muda numa migração
  para Postgres/Supabase.
- Upload real de avatar, chat do time, salas de vídeo e importação de CSV/Notion/Jira estão sinalizados
  com toasts honestos em vez de botões mortos.
