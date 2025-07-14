const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('REferendum09!!', 10);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Michał Sicinski',
        email: 'msicinski33@gmail.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      }
    });
    
    console.log('✅ Admin utworzony pomyślnie!');
    console.log('Email:', admin.email);
    console.log('Hasło: REferendum09!!');
    console.log('Rola:', admin.role);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ Użytkownik z tym emailem już istnieje!');
    } else {
      console.error('❌ Błąd:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 