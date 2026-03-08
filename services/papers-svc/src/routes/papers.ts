import { Hono } from "hono";
import { jwtAuthOptional, slidingRateLimiter } from "@assessment/middleware";
import {
  getPapers,
  getPaperById,
  searchPapers,
} from "../controllers/papers.controller";
import { Env } from "../types/env";

const paperRoutes = new Hono<{
  Bindings: Env;
  Variables: {
    userId?: string;
  };
}>();

// Apply middleware
paperRoutes.use("*", slidingRateLimiter);

paperRoutes.get("/", getPapers);
paperRoutes.get("/search", searchPapers);

// Optional JWT for paper details
paperRoutes.get("/:id", jwtAuthOptional, getPaperById);

export default paperRoutes;
