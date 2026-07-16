import { Role } from "../src/app/generated/prisma";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Seed Required Languages
  const enLang = await prisma.languageRegistry.upsert({
    where: { iso6391: "en" },
    update: {},
    create: {
      iso6391: "en",
      name: "English",
      nativeName: "English",
    },
  });
  console.log("✅ Seeded Language: en");

  // 2. Seed Default Maturity Ratings
  // Matches your schema with 'system' and 'severityRank' fields
  const ratings = [
    { code: "G", system: "MPAA", severityRank: 10, description: "General Audiences" },
    { code: "PG", system: "MPAA", severityRank: 20, description: "Parental Guidance Suggested" },
    { code: "PG-13", system: "MPAA", severityRank: 30, description: "Parents Strongly Cautioned" },
    { code: "R", system: "MPAA", severityRank: 45, description: "Restricted" },
    { code: "NC-17", system: "MPAA", severityRank: 50, description: "Adults Only" },
    { code: "TV-Y", system: "TVPG", severityRank: 5, description: "All Children" },
    { code: "TV-G", system: "TVPG", severityRank: 10, description: "General Audience" },
    { code: "TV-PG", system: "TVPG", severityRank: 15, description: "Parental Guidance" },
    { code: "TV-14", system: "TVPG", severityRank: 35, description: "Parents Strongly Cautioned" },
    { code: "TV-MA", system: "TVPG", severityRank: 48, description: "Mature Audience Only" },
  ];

  for (const r of ratings) {
    await prisma.maturityRating.upsert({
      where: { code: r.code },
      update: {
        system: r.system,
        severityRank: r.severityRank,
        description: r.description,
      },
      create: {
        code: r.code,
        system: r.system,
        severityRank: r.severityRank,
        description: r.description,
      },
    });
  }
  console.log("✅ Seeded Maturity Ratings");

  // 3. Seed an Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@movieflix.com" },
    update: {},
    create: {
      email: "admin@movieflix.com",
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log("✅ Seeded Admin User:", adminUser.email);

  console.log("🏁 Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });