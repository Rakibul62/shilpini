import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
  log: ["error"],
});

async function main() {
  // Create default admin user
  // Email: admin@shilpini.com
  // Password: admin123 (plain text - no hashing for simplicity)

  await prisma.admin.upsert({
    where: { email: "admin@shilpini.com" },
    update: {},
    create: {
      email: "admin@admin.com",
      password: "admin123", // Plain text password
      name: "Admin User",
      role: "admin",
    },
  });

  console.log("✓ Created admin user:");
  console.log("  Email: admin@shilpini.com");
  console.log("  Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
