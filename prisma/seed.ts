import { PrismaClient } from "@prisma/client";
import { TOKEN_PACKAGES } from "../src/core/tokenPackages";

const prisma = new PrismaClient();

async function main() {
  for (const pkg of TOKEN_PACKAGES) {
    await prisma.tokenPackage.upsert({
      where: { id: pkg.id },
      update: {
        tokenAmount: pkg.tokenAmount,
        priceEur: pkg.priceEur,
        stripePriceId: pkg.stripePriceId || null,
        isActive: true,
      },
      create: {
        id: pkg.id,
        tokenAmount: pkg.tokenAmount,
        priceEur: pkg.priceEur,
        stripePriceId: pkg.stripePriceId || null,
        isActive: true,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
