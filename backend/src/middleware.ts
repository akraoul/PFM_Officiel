import type { Request, Response, NextFunction } from "express";

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers["x-admin-token"];
  const headerToken = Array.isArray(raw) ? raw[0] : raw;

  const clientToken = String(headerToken ?? "").trim();
  const envToken = String(process.env.ADMIN_TOKEN ?? "").trim();

  // debug utile (tu peux enlever après)
  // console.log("[adminOnly]", { clientToken, envToken });

  if (!clientToken || !envToken || clientToken !== envToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}
