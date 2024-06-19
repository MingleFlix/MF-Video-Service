import { NextFunction, Request, Response } from "express";
import { authenticateJWT, JWTPayload } from "../lib/authHelper";

export interface AuthRequest extends Request {
  user: JWTPayload;
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authRequest = req as AuthRequest;
  const token = authRequest.cookies["auth_token"];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied, no token provided" });
  }

  try {
    (authRequest as AuthRequest).user = authenticateJWT(token);
    if (!authRequest.user) {
      throw new Error("Invalid token");
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
