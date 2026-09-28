import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "8h") as SignOptions["expiresIn"];

export type JwtPayload = {
  userId: string;
  email: string;
  role: string;
};

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET as string) as JwtPayload;
}
