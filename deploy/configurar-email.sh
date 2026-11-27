#!/usr/bin/env bash
# Configura os avisos por e-mail do portal (Google Workspace).
# Pede o e-mail que vai enviar e a SENHA DE APP do Google (não a senha normal).
# Rode no VPS: bash /var/www/portal-petricor/deploy/configurar-email.sh
set -euo pipefail
APP=/var/www/portal-petricor
ENV="$APP/.env"
read -rp "E-mail que vai enviar os avisos (ex.: contato@estudiopetricor.com.br): " USER_MAIL
read -rsp "Senha de app do Google (16 letras, os espaços tanto faz): " PASS; echo
PASS="${PASS// /}"
[ -n "$USER_MAIL" ] && [ -n "$PASS" ] || { echo "Faltou o e-mail ou a senha."; exit 1; }
TMP=$(mktemp)
grep -vE '^(SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_PASS|MAIL_FROM)=' "$ENV" > "$TMP" || true
{
  cat "$TMP"
  echo "SMTP_HOST=\"smtp.gmail.com\""
  echo "SMTP_PORT=\"465\""
  echo "SMTP_USER=\"$USER_MAIL\""
  echo "SMTP_PASS=\"$PASS\""
  echo "MAIL_FROM=\"Petricor Estúdio <$USER_MAIL>\""
} > "$ENV"
rm -f "$TMP"; chmod 600 "$ENV"
systemctl restart portal-petricor
echo "Pronto. Abra Configurações no portal e clique em 'Mandar um e-mail de teste para mim'."
