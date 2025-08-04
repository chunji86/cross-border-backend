// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('1234', 10);

  // ✅ 관리자 계정 확인 후 생성
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      phone: '01000000001',
      password: hashedPassword,
      role: 'admin'
    }
  });
  console.log('✅ 관리자 계정 처리 완료');

  // ✅ 공급사 계정 확인 후 생성
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@example.com' },
    update: {},
    create: {
      email: 'vendor@example.com',
      phone: '01000000002',
      password: hashedPassword,
      role: 'vendor'
    }
  });
  console.log('✅ 공급사 계정 처리 완료');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
  })
  .finally(() => prisma.$disconnect());
