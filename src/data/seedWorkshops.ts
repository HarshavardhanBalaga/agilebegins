import { MongoClient, type Db } from "mongodb";
import { pathToFileURL } from "node:url";
import type { NewWorkshop } from "../types/workshop";

const WORKSHOPS_COLLECTION = "workshops";

/**
 * Data for the first workshop.
 *
 * Mirrors the canonical Workshop 001 from `src/data/workshops.ts` (same slug
 * and pricing) so the registration flow on /register lists the same event the
 * brochure pages describe. Future workshops are added to MongoDB directly (or
 * with their own seed entries) — static content lives in data/workshops.ts,
 * never duplicated here.
 */
const workshopOne: NewWorkshop = {
  slug: "workshop-001",
  number: "001",
  title: "What I Wish I Knew in 2nd Year",
  shortDescription:
    "A live session on career clarity, the skills that matter, building the right projects, and getting your first internship.",
  description:
    "Everything I wish someone had explained before I started learning web development, internships and career building. This session is a straight, honest path from 2nd year to your first internship — no fluff, no jargon.",
  price: 49,
  originalPrice: null,
  status: "LIVE",
  date: "TBA",
  time: "TBA",
  duration: "90 Minutes",
  platform: "Google Meet",
  meetingPlatform: "Google Meet",
  bannerImage: null,
  learningPoints: [
    "What actually matters in 2nd year",
    "Skills that companies value",
    "Building projects correctly",
    "Git & GitHub roadmap",
    "Resume mistakes",
    "LinkedIn basics",
    "Internship strategy",
    "Common mistakes students make",
    "AI tools that actually help",
  ],
  timeline: [
    {
      title: "Introduction",
      description: "How the session runs and what you'll walk away with.",
    },
    {
      title: "Career Roadmap",
      description: "A clear path from 2nd year to your first internship.",
    },
    {
      title: "Project Strategy",
      description: "What to build and how to build it the right way.",
    },
    {
      title: "Internship Preparation",
      description: "How to apply, stand out, and follow up.",
    },
    {
      title: "Resources",
      description: "Notes, tools and links you can actually use.",
    },
    {
      title: "Live Q&A",
      description: "Ask anything about your specific situation.",
    },
  ],
  faqs: [
    {
      question: "How will I join?",
      answer:
        "You'll get the Google Meet link by email right after you register.",
    },
    {
      question: "Will the session be recorded?",
      answer: "Yes — registered attendees get the recording and notes.",
    },
    {
      question: "Who can attend?",
      answer: "Any student, especially those in their 2nd year.",
    },
    {
      question: "Do I need prior experience?",
      answer: "No. We start from the basics.",
    },
    {
      question: "How do I reserve my seat?",
      answer: "Click Reserve Your Seat and complete the ₹49 registration.",
    },
  ],
  isFeatured: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export interface SeedResult {
  inserted: number;
  skipped: boolean;
}

/**
 * Inserts Workshop 001 only when the `workshops` collection is empty.
 *
 * Re-running the script is safe — it never inserts duplicates.
 */
export async function seedWorkshops(db: Db): Promise<SeedResult> {
  const collection = db.collection<NewWorkshop>(WORKSHOPS_COLLECTION);

  const existingCount = await collection.countDocuments();
  if (existingCount > 0) {
    return { inserted: 0, skipped: true };
  }

  // Enforce unique slugs at the database level as an extra guard.
  await collection.createIndex({ slug: 1 }, { unique: true });
  await collection.insertOne(workshopOne);

  return { inserted: 1, skipped: false };
}

function loadEnv(): void {
  if (process.env.MONGODB_URI && process.env.DB_NAME) return;

  try {
    process.loadEnvFile(".env.local");
  } catch {
    process.loadEnvFile(".env");
  }
}

async function main(): Promise<void> {
  loadEnv();

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Add it to your .env.local file.");
  }
  if (!dbName) {
    throw new Error("DB_NAME is missing. Add it to your .env.local file.");
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const result = await seedWorkshops(client.db(dbName));

    if (result.skipped) {
      console.log("Seed skipped — workshops collection is not empty.");
    } else {
      console.log(
        `Seeded ${result.inserted} workshop(s) into "${dbName}.${WORKSHOPS_COLLECTION}".`
      );
    }
  } finally {
    await client.close();
  }
}

// Run automatically when executed directly via `npm run db:seed`.
if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(
      "Seed failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  });
}