import { NextFunction, Request, Response } from "express";
import { authenticateJWT, JWTPayload } from "../lib/authHelper";

declare global {
  namespace Express {
    interface Request {
      user: JWTPayload;
    }
  }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies["auth_token"];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied, no token provided" });
  }

  try {
    req.user = authenticateJWT(token);
    if (!req.user) {
      throw new Error("Invalid token");
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
