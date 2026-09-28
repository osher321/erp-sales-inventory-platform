import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/errorHandler";
import { signAccessToken } from "../utils/jwt";
import type { LoginInput, RegisterInput } from "../validators/auth.validators";

const SALT_ROUNDS = 10;

function toPublicUser(user: { id: string; email: string; name: string; role: string }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function login({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signAccessToken({ userId: user.id, email: user.email, role: user.role });
  return { token, user: toPublicUser(user) };
}

export async function register({ email, password, name }: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, password: passwordHash, name, role: "USER" },
  });

  const token = signAccessToken({ userId: user.id, email: user.email, role: user.role });
  return { token, user: toPublicUser(user) };
}
