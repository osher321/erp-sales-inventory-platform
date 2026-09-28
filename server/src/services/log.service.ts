import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import type { LogListQuery } from "../validators/log.validators";

export async function listLogs(params: LogListQuery) {
  const { page, limit, search, method, success, sortOrder } = params;

  const where: Prisma.ApiLogWhereInput = {
    ...(method ? { method } : {}),
    ...(success === true ? { statusCode: { lt: 400 } } : {}),
    ...(success === false ? { statusCode: { gte: 400 } } : {}),
    ...(search
      ? {
          OR: [
            { endpoint: { contains: search, mode: "insensitive" } },
            { userEmail: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.apiLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { timestamp: sortOrder },
    }),
    prisma.apiLog.count({ where }),
  ]);

  return {
    logs,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}
