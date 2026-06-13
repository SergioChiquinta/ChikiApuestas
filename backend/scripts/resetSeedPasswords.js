import 'dotenv/config';
import { mutateWorkbook } from '../src/services/excelStore.js';
import { hashPassword } from '../src/services/passwordService.js';

const seedAccounts = [
  { username: 'admin', password: 'Admin123!' },
  { username: 'sergio', password: 'Familia123!' }
];

await mutateWorkbook(({ get, set }) => {
  const users = get('Usuarios');

  for (const account of seedAccounts) {
    const index = users.findIndex(
      (user) => String(user.username).toLowerCase() === account.username
    );

    if (index === -1) {
      throw new Error(`No se encontró el usuario inicial: ${account.username}`);
    }

    users[index] = {
      ...users[index],
      password_hash: hashPassword(account.password),
      activo: 'si'
    };
  }

  set('Usuarios', users);
});

console.log('Contraseñas restablecidas correctamente:');
console.log('  admin  / Admin123!');
console.log('  sergio / Familia123!');
