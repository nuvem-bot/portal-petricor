#!/usr/bin/env bash
# Instala ou atualiza o portal no VPS. Rode como root:
#   bash /var/www/portal-petricor/deploy/instalar.sh
# Pode rodar quantas vezes quiser: só atualiza o que mudou.
set -euo pipefail

APP=/var/www/portal-petricor
BRANCH=${BRANCH:-portal-base}
PORT=${PORT:-3100}            # a 3000 já é usada por outro serviço deste VPS
DOMINIO=portal.estudiopetricor.com.br

# Node: usa o do nvm se não houver um no PATH
if ! command -v node >/dev/null; then
  export NVM_DIR=/root/.nvm; . "$NVM_DIR/nvm.sh"
fi
NODE_BIN=$(dirname "$(command -v node)")
echo "Node $(node -v) em $NODE_BIN"

command -v sqlite3 >/dev/null || apt-get install -y sqlite3

# Código
if [ ! -d "$APP/.git" ]; then
  git clone -b "$BRANCH" https://github.com/nuvem-bot/portal-petricor.git "$APP"
else
  git -C "$APP" fetch origin "$BRANCH" && git -C "$APP" checkout "$BRANCH" && git -C "$APP" pull --ff-only origin "$BRANCH"
fi
cd "$APP"

# Configuração (só na primeira vez)
if [ ! -f .env ]; then
  cat > .env <<ENV
DATABASE_URL="file:./portal.db"
SESSION_SECRET="$(openssl rand -hex 32)"
UPLOAD_DIR="$APP/uploads"
PUBLIC_URL="https://$DOMINIO"
NODE_ENV=production
ENV
  chmod 600 .env
fi
mkdir -p uploads

npm ci --no-audit --no-fund
npx prisma migrate deploy
npm run build

# Serviço que mantém o portal ligado (sobe sozinho se o VPS reiniciar)
cat > /etc/systemd/system/portal-petricor.service <<UNIT
[Unit]
Description=Portal Petricor
After=network.target

[Service]
WorkingDirectory=$APP
Environment=NODE_ENV=production
Environment=PATH=$NODE_BIN:/usr/bin:/bin
ExecStart=$APP/node_modules/.bin/next start -p $PORT -H 127.0.0.1
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable portal-petricor >/dev/null 2>&1
systemctl restart portal-petricor

# Nginx (só cria se ainda não existe, para não apagar o HTTPS do certbot)
if [ ! -f /etc/nginx/sites-available/portal ]; then
  sed "s/127.0.0.1:3000/127.0.0.1:$PORT/" deploy/nginx-portal.conf > /etc/nginx/sites-available/portal
  ln -sf /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/portal
fi
nginx -t && systemctl reload nginx

# Backup diário às 3h30
chmod +x deploy/backup.sh
# (mantém as outras linhas do crontab; o "|| true" evita apagar tudo quando ainda não há crontab)
ATUAL=$(crontab -l 2>/dev/null | grep -v portal-petricor/deploy/backup.sh || true)
printf '%s\n30 3 * * * %s/deploy/backup.sh\n' "$ATUAL" "$APP" | sed '/^$/d' | crontab -

sleep 3
curl -s -o /dev/null -w "Portal respondendo: HTTP %{http_code}\n" http://127.0.0.1:$PORT/login
echo "Pronto. Se for a primeira vez, rode: certbot --nginx -d $DOMINIO --redirect"
