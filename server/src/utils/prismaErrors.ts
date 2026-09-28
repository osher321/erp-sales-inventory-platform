import { Prisma } from "@prisma/client";

export function isUniqueConstraintError(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export function isRecordNotFoundError(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025";
}

export function isForeignKeyConstraintError(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003";
}

export function conflictFieldName(err: Prisma.PrismaClientKnownRequestError): string {
  const target = err.meta?.target;
  return Array.isArray(target) ? target.join(", ") : "field";
}
