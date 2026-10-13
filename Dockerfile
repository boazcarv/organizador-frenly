# ---------------------------------------------------------------------------
# Frenly — imagem de produção
#
#   docker build -t frenly .
#   docker run -d --name frenly -p 3000:3000 \
#     -e DATABASE_URL="postgresql://usuario:senha@host/banco?sslmode=require" \
#     -e AUTH_SECRET="$(openssl rand -base64 32)" \
#     -e TZ="America/Sao_Paulo" \
#     frenly
#
# Precisa de um Postgres acessível: dentro de um contêiner o disco pertence ao
# contêiner, então o PGlite (o modo local) não serve para guardar dados reais.
#
# O servidor roda com `next start`, o mesmo comando do dia a dia — de propósito,
# para que a imagem execute exatamente o que foi testado, sem um modo de build
# diferente que ninguém exercita.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS build
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# O build não fala com o banco (as consultas só rodam em tempo de requisição),
# então uma URL descartável basta para satisfazer a checagem de configuração.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm run build

# ---------------------------------------------------------------------------

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Padrão do produto; sobrescreva com `-e TZ=...` se o time estiver em outro fuso.
ENV TZ=America/Sao_Paulo

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Dependências de produção + artefatos do build. As de desenvolvimento ficam
# para trás: a imagem carrega só o que o servidor precisa em execução.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]
