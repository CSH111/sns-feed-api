import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function runSeed() {
  const categories = [
    {
      id: 1,
      name: "요리",
    },
    {
      id: 2,
      name: "그림",
    },
    {
      id: 3,
      name: "음악",
    },
    {
      id: 4,
      name: "영화",
    },
    {
      id: 5,
      name: "독서",
    },
  ];

  try {
    console.log('🌱 카테고리 시드 데이터 확인 중...');

    for (const category of categories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: {},
        create: category,
      });
    }

    console.log('✅ 카테고리 시드 데이터 준비 완료');
  } catch (error) {
    console.error('❌ 시드 데이터 실행 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}