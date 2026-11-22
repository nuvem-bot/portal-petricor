# Portal Petricor

Portal de entrega de identidade visual da Petricor. Substitui o Respondi (briefing) e o Notion (moodboard) e junta todo o processo num lugar só, com duas visões:

- **Estúdio** (`/estudio`): painel da designer, com login. Mostra os projetos por etapa, o que está com a designer e o que está com o cliente, e a atividade recente. Dentro de cada projeto: briefing recebido, moodboard (upload e o que o cliente gostou e não gostou em cada imagem), proposta (logo, mockups, conceito, paleta, tipografia), arquivos de entrega e histórico.
- **Cliente** (`/p/<link secreto>`): sem senha, pelo link que a designer envia. O cliente responde o briefing, escreve o que gostou e o que não gostou em cada imagem do moodboard, assiste à apresentação da marca em tela cheia, aprova ou pede ajustes e baixa os arquivos finais.

## Etapas

Briefing → Moodboard → Criação → Proposta → Finalização → Entrega.
A designer muda a etapa no painel. Algumas mudanças são automáticas: quando o cliente aprova, o projeto vai para Finalização.

## Tecnologia

Next.js 14 (Node 20+), Prisma com SQLite (um arquivo no próprio servidor) e arquivos enviados salvos em disco (`uploads/`). Não depende de nenhum serviço externo.

## Rodar no computador

```bash
cp .env.example .env          # ajuste SESSION_SECRET e PUBLIC_URL=http://localhost:3000
npm install
npx prisma migrate deploy
npm run criar-designer -- "Seu Nome" voce@estudiopetricor.com.br
npm run dev                   # abre em http://localhost:3000
```

## Publicar no VPS da Hostinger (KVM 1)

O site principal (estudiopetricor.com.br) continua onde está. O portal roda à parte em **portal.estudiopetricor.com.br**.

**1. DNS.** No hPanel, em Domínios → estudiopetricor.com.br → DNS, crie um registro **A** com nome `portal` apontando para o IP do VPS (aparece em VPS → Visão geral).

**2. Preparar o servidor** (uma vez, pelo terminal SSH do VPS):

```bash
apt update && apt install -y git nginx sqlite3 certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs
npm install -g pm2
```

**3. Instalar o portal:**

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/nuvem-bot/portal-petricor.git && cd portal-petricor
cp .env.example .env
sed -i "s/troque-por-um-segredo-longo/$(openssl rand -hex 32)/" .env
npm ci
npx prisma migrate deploy
npm run build
npm run criar-designer -- "Seu nome" voce@estudiopetricor.com.br   # primeiro acesso, entra como adm
pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup
```

Depois disso, a adm libera os acessos da equipe pelo próprio painel, em **Configurações**.

### Tipos de acesso
- **Adm**: trabalha nos projetos, libera e desativa acessos da equipe, pausa links de cliente e exclui projetos.
- **Equipe**: trabalha em todos os projetos. Não vê Configurações e não exclui projetos.
- **Cliente**: sem senha, entra só pelo link do próprio projeto. A adm pode pausar ou trocar o link.

**4. Nginx e HTTPS:**

```bash
cp deploy/nginx-portal.conf /etc/nginx/sites-available/portal
ln -s /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d portal.estudiopetricor.com.br
```

**5. Backup diário** do banco e dos arquivos:

```bash
(crontab -l 2>/dev/null; echo "30 3 * * * /var/www/portal-petricor/deploy/backup.sh") | crontab -
```

### Atualizar depois de mudanças

```bash
cd /var/www/portal-petricor && git pull && npm ci && npx prisma migrate deploy && npm run build && pm2 restart portal-petricor
```

## Mudar o conteúdo

- **Perguntas do briefing:** `src/lib/briefing.js`
- **Nomes e textos das etapas:** `src/lib/stages.js`
- **Cores e fontes do portal:** `src/app/globals.css`
- **Logo da Petricor:** `public/marca/`

## Segurança

- O link do cliente é uma chave aleatória de 24 caracteres. Quem tiver o link vê o projeto, então envie só para o cliente. No painel dá para gerar um novo link, e o antigo para de funcionar.
- Os arquivos só abrem para a designer logada ou com o link do projeto. Os arquivos de entrega só ficam disponíveis para o cliente na etapa Entrega.
- Login da designer com senha (bcrypt) e cookie assinado de 30 dias.
