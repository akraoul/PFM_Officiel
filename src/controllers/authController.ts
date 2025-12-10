import { Request, Response } from "express";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "2025";

export const login = (req: Request, res: Response) => {
    const { token } = req.body;

    // Check if the provided token/password matches the env var
    if (token === ADMIN_TOKEN) {
        return res.json({ ok: true, token: ADMIN_TOKEN });
    }

    res.status(401).json({ error: "Invalid password" });
};

export const requireAuth = (req: Request, res: Response, next: Function) => {
    const token = req.headers["x-admin-token"];
    if (token !== ADMIN_TOKEN) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
};
