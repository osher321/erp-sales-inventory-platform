import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/errorHandler";
import {
  conflictFieldName,
  isForeignKeyConstraintError,
  isRecordNotFoundError,
  isUniqueConstraintError,
} from "../utils/prismaErrors";
import type { CreateCustomerInput, UpdateCustomerInput } from "../validators/customer.validators";

// Splits a "First Last" search into its two halves so a full-name query can
// match firstName/lastName separately, since they're stored as distinct
// columns and Prisma's filter builder can't compare a search term against
// their concatenation directly.
function buildFullNameCondition(search: string): Prisma.CustomerWhereInput | null {
  const words = search.trim().split(/\s+/);
  if (words.length < 2) return null;

  const [firstWord, ...rest] = words;
  return {
    AND: [
      { firstName: { contains: firstWord, mode: "insensitive" } },
      { lastName: { contains: rest.join(" "), mode: "insensitive" } },
    ],
  };
}

export async function listCustomers(params: { page: number; limit: number; search?: string }) {
  const { page, limit, search } = params;

  const fullNameCondition = search ? buildFullNameCondition(search) : null;

  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { customerNumber: { contains: search, mode: "insensitive" } },
          ...(fullNameCondition ? [fullNameCondition] : []),
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }
  return customer;
}

export async function createCustomer(input: CreateCustomerInput) {
  try {
    return await prisma.customer.create({ data: input });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new ApiError(409, `Customer with this ${conflictFieldName(err)} already exists`);
    }
    throw err;
  }
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  try {
    return await prisma.customer.update({ where: { id }, data: input });
  } catch (err) {
    if (isRecordNotFoundError(err)) {
      throw new ApiError(404, "Customer not found");
    }
    if (isUniqueConstraintError(err)) {
      throw new ApiError(409, `Customer with this ${conflictFieldName(err)} already exists`);
    }
    throw err;
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({ where: { id } });
  } catch (err) {
    if (isRecordNotFoundError(err)) {
      throw new ApiError(404, "Customer not found");
    }
    if (isForeignKeyConstraintError(err)) {
      throw new ApiError(409, "Cannot delete customer with existing orders");
    }
    throw err;
  }
}
