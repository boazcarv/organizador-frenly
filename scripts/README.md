# Scripts de QA

Conferências automatizadas com Playwright: capturam screenshots, medem overflow
horizontal, percorrem o teclado e checam o console em busca de erros.

## Antes de rodar

O app agora exige login, então os scripts precisam de uma sessão. Pegue um
cookie uma vez:

```bash
npm run start            # ou npm run dev, em outro terminal

curl -s -D - -o /dev/null -X POST http://localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"voce@empresa.com","password":"sua-senha"}' \
  | grep -i set-cookie
```

Copie o valor depois de `frenly_session=` e exporte:

```bash
export FRENLY_COOKIE="cole-o-valor-aqui"
```

Sem essa variável os scripts param na primeira linha com uma mensagem clara,
em vez de falharem com um monte de asserção vermelha causada por um redirect
para `/login`.

## Os scripts

| Script | O que faz |
| --- | --- |
| `qa.mjs` | screenshots das 6 rotas em 1440 e 390 + erros de console |
| `interactions.mjs` | ⌘K, accent, dark mode, drag do kanban, filtro, drawer, tracker, reduced-motion, overflow |
| `sweep.mjs` | 1024px, dark mode em todas as rotas, trilha de foco por teclado |
| `mobile.mjs` | 390px: drawer, kanban com snap, analytics, calendário |
| `fullpage.mjs` | capturas do fim de cada página |
| `persistence.mjs` | cria projeto/tarefa, para o cronômetro, alterna notificação e confere no disco |

Os screenshots vão para `OUT_DIR` (padrão `/home/user/qa`); `BASE_URL` muda o
alvo (padrão `http://localhost:3000`).

```bash
BASE_URL=http://localhost:3000 OUT_DIR=/tmp/qa node scripts/qa.mjs
```

## Estado atual

Os scripts foram reescritos para usar sessão, mas **não foram executados nesta
máquina** — o sandbox onde o trabalho foi feito não consegue baixar o Chromium
que o Playwright precisa. O que foi verificado aqui foi a API inteira (setup,
login, permissões, CRUD, persistência, logout) via `curl`, e `tsc`/`eslint`/
`next build` limpos. Se algum ajuste fino de seletor for necessário, o
conserto é local a cada script.
