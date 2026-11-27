// Cria (ou atualiza a senha de) uma pessoa do estúdio.
// Uso: npm run criar-designer -- "Júlia Rocha" julia@estudiopetricor.com.br [adm|equipe]
// Sem o tipo, a pessoa entra como adm (use para criar o primeiro acesso no servidor).
// A senha é pedida no terminal.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'node:readline';

const [name, email, roleArg] = process.argv.slice(2);
const role = roleArg === 'equipe' ? 'equipe' : 'adm';
if (!name || !email) {
  console.error('Uso: npm run criar-designer -- "Nome" email@dominio');
  process.exit(1);
}
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Senha (mínimo 10 caracteres): ', async (senha) => {
  rl.close();
  if (!senha || senha.length < 10) { console.error('Senha muito curta.'); process.exit(1); }
  const db = new PrismaClient();
  const passwordHash = await bcrypt.hash(senha, 12);
  const d = await db.designer.upsert({
    where: { email: email.toLowerCase() },
    update: { name, passwordHash, role, active: true },
    create: { name, email: email.toLowerCase(), passwordHash, role },
  });
  console.log(`Pronto: ${d.name} <${d.email}> (${d.role}) pode entrar em /login`);
  await db.$disconnect();
});
