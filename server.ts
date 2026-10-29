import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Global Process Diagnostics & Unhandled Rejection Guards
process.on("unhandledRejection", (reason, promise) => {
  console.warn("[Backend Warning] Unhandled Promise Rejection caught:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Backend Error] Uncaught Exception caught:", error);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Structured API request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api") || req.path.startsWith("/.netlify")) {
      console.log(`[API Log] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Body parser with generous limit for multimodal base64 meal images
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// Initialize GoogleGenAI client with official User-Agent header
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

/**
 * Robust execution with automatic fallback:
 * Primary: gemini-3.8-flash
 * Secondary: gemini-3.1-flash-lite (if 503 high demand or 429 occurs)
 */
async function generateWithFallback(contents: any, config: any = {}, preferredModel?: string) {
  const primaryModel = preferredModel || "gemini-3.8-flash";
  const fallbackModel = "gemini-3.1-flash-lite";

  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents,
      config,
    });
    return { response, modelUsed: primaryModel };
  } catch (primaryErr: any) {
    const errMsg = String(primaryErr?.message || primaryErr || "");
    console.warn(`[Gemini Fallback] Primary model [${primaryModel}] returned: ${errMsg}. Trying fallback [${fallbackModel}]...`);

    // If 503 (high demand), 429 (rate limit), or model issue, switch to fast flash-lite
    try {
      const fbResponse = await ai.models.generateContent({
        model: fallbackModel,
        contents,
        config,
      });
      return { response: fbResponse, modelUsed: fallbackModel };
    } catch (fallbackErr: any) {
      console.error(`[Gemini Fallback Error] Fallback model [${fallbackModel}] also failed:`, fallbackErr);
      throw primaryErr; // throw original or informative error
    }
  }
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  return res.json({
    status: "ok",
    app: "VitaBoost NutriApp",
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

/**
 * Universal Gemini API Handler
 * Handles both /api/gemini/generate and /.netlify/functions/gemini
 */
async function handleGenerate(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Content-Type", "application/json");

  try {
    const { model, contents, prompt, config = {}, systemInstruction } = req.body || {};

    let finalContents = contents;
    if (!finalContents && prompt) {
      finalContents = prompt;
    }

    if (!finalContents) {
      return res.status(400).json({ error: "No prompt or contents provided in request body." });
    }

    const requestConfig: any = { ...config };
    if (systemInstruction && !requestConfig.systemInstruction) {
      requestConfig.systemInstruction = systemInstruction;
    }

    const { response, modelUsed } = await generateWithFallback(
      finalContents,
      requestConfig,
      model && !model.includes("2.5") && !model.includes("3-pro-preview") ? model : undefined
    );

    const text = response.text || "";
    return res.json({
      text,
      candidates: response.candidates,
      usageMetadata: response.usageMetadata,
      modelUsed,
    });
  } catch (error: any) {
    console.error("[Gemini API Backend Error]:", error);
    let message = error?.message || "Failed to communicate with the Gemini AI service.";
    try {
      const parsed = JSON.parse(message);
      if (parsed?.error?.message) message = parsed.error.message;
    } catch {}

    return res.status(500).json({
      error: message,
      details: String(error),
    });
  }
}

// Register API routes BEFORE Vite middleware
app.post("/api/gemini/generate", handleGenerate);
app.post("/.netlify/functions/gemini", handleGenerate);

// Multimodal Plate Scanner endpoint
app.post("/api/gemini/scan-plate", async (req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "application/json");

  try {
    const { imageBase64, mimeType = "image/jpeg", notes } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 in request body." });
    }

    const promptText = `You are a clinical dietitian analyzing a meal plate photograph.
${notes ? `User notes: "${notes}".` : ""}

1. Identify dishes, components, grains, curries, and sides visible on the plate.
2. Estimate portions in grams / standard servings.
3. Calculate kilocalories (kcal), Protein (g), Carbohydrates (g), and Fat (g).
4. Provide total calories, macronutrients, confidence, dietary tags, a concise clinical note, and an actionable booster tip.

Return ONLY raw valid JSON conforming to this schema:
{
  "items": [
    {
      "name": "Dish Name",
      "portion": "1 bowl (150g)",
      "portion_g": 150,
      "kcal": 180,
      "protein_g": 8,
      "carbs_g": 24,
      "fat_g": 5,
      "category": "Grain | Dal | Vegetable | Dairy | Protein"
    }
  ],
  "total": {
    "kcal": 450,
    "protein_g": 18,
    "carbs_g": 62,
    "fat_g": 11
  },
  "confidence": "high",
  "tags": ["High Fiber", "Vegetarian"],
  "dietitianNote": "Constructive comment on glycemic load and micronutrient adequacy.",
  "boosterTip": "Actionable swap or food pairing tip."
}`;

    const imagePart = {
      inlineData: {
        mimeType,
        data: imageBase64.replace(/^data:[^;]+;base64,/, ""),
      },
    };

    const { response } = await generateWithFallback(
      { parts: [imagePart, { text: promptText }] },
      { responseMimeType: "application/json" }
    );

    const rawText = response.text || "{}";
    const cleaned = rawText.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleaned);
    return res.json(parsed);
  } catch (error: any) {
    console.error("[Plate Scan Backend Error]:", error);
    return res.status(500).json({ error: error.message || "Failed to scan meal plate." });
  }
});

// Catch-all for undefined /api routes returning clean JSON 404
app.all("/api/*", (req: Request, res: Response) => {
  res.status(404).json({ error: "API route not found", path: req.path });
});

// Express global error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Express Global Error]", err);
  if (!res.headersSent) {
    res.status(err?.status || 500).json({
      error: err?.message || "Internal server error",
      status: err?.status || 500,
    });
  }
});

// Start server & mount Vite middlewares
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite middlewares AFTER API routes have been defined
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[VitaBoost Server] VitaBoost NutriApp server running at http://0.0.0.0:${PORT}`);
  });

  const handleShutdown = () => {
    console.log("[VitaBoost Server] Gracefully shutting down...");
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);
}

startServer();
