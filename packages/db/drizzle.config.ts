import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // In a real scenario, this comes from your Neon DB environment variable.
    // We use a dummy string here just so the generate command doesn't fail locally.
    url:
      process.env.DATABASE_URL ||
      "postgresql://neondb_owner:npg_L9pny1dTJjbB@ep-misty-salad-a1a5sg1z-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
});
