import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });