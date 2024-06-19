import jwt from "jsonwebtoken";

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

export function authenticateJWT(token: string): JWTPayload {
  const secretKey = process.env.JWT_SECRET || "your_secret_key"; // Ensure you have this in your environment variables
  const decoded = jwt.verify(token, secretKey);
  return decoded as JWTPayload;
}
