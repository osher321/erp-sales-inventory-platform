import { IntegrationEntity, IntegrationSyncStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

// ---------------------------------------------------------------------------
// Priority Integration Simulator
//
// This module SIMULATES an outbound sync to an external Priority-style ERP.
// It never makes a real network call — it reads real rows from this app's own
// PostgreSQL database, maps each one to a Priority-style Integration DTO, and
// records the (simulated) outcome. Nothing here writes back to Customer,
// Product, Order, or InventoryMovement — sync is read-only against business
// data; the only table it writes to is IntegrationSync (this module's own
// history log).
// ---------------------------------------------------------------------------

export const EXTERNAL_SYSTEM = "PRIORITY_SIMULATOR" as const;

export interface IntegrationDto<T> {
  externalSystem: typeof EXTERNAL_SYSTEM;
  entity: IntegrationEntity;
  externalId: string;
  data: T;
}

interface SimulatedRecord {
  dto: IntegrationDto<unknown>;
  success: boolean;
}

const MAX_SIMULATED_LATENCY_MS = 500;
const PAYLOAD_SAMPLE_SIZE = 3;
const MAX_PAYLOAD_SUMMARY_LENGTH = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The DTO built here is only ever surfaced back to the user via the sync's
// payloadSummary (a JSON sample shown in the Details modal) — it never drives
// success/failure or record counts. So masking contact fields here keeps the
// demo's payload display free of full PII without touching the Customer row
// in the database or any sync logic.
async function buildCustomerRecords(): Promise<SimulatedRecord[]> {
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: "asc" } });
  return customers.map((customer) => ({
    dto: {
      externalSystem: EXTERNAL_SYSTEM,
      entity: IntegrationEntity.CUSTOMER,
      externalId: customer.customerNumber,
      data: {
        customerNumber: customer.customerNumber,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: "demo@example.com",
        phone: "***",
        address: "***",
        city: customer.city,
      },
    },
    success: true,
  }));
}

async function buildProductRecords(): Promise<SimulatedRecord[]> {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  return products.map((product) => ({
    dto: {
      externalSystem: EXTERNAL_SYSTEM,
      entity: IntegrationEntity.PRODUCT,
      externalId: product.sku,
      data: {
        sku: product.sku,
        name: product.name,
        category: product.category,
        price: product.price.toString(),
        description: product.description,
      },
    },
    success: true,
  }));
}

// Simulates a plausible external-system business rule: a zero-quantity stock
// record is rejected by the receiving ERP rather than accepted as-is. This is
// deterministic (tied to real stock levels), not random, so the same dataset
// always produces the same demo outcome.
async function buildInventoryRecords(): Promise<SimulatedRecord[]> {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  return products.map((product) => {
    const isOutOfStock = product.stockQuantity === 0;
    return {
      dto: {
        externalSystem: EXTERNAL_SYSTEM,
        entity: IntegrationEntity.INVENTORY,
        externalId: product.sku,
        data: {
          sku: product.sku,
          productName: product.name,
          stockQuantity: product.stockQuantity,
          minimumStock: product.minimumStock,
        },
      },
      success: !isOutOfStock,
    };
  });
}

// Simulates another plausible external-system rule: cancelled orders are
// excluded from the outbound sync rather than pushed to the external ERP.
async function buildOrderRecords(): Promise<SimulatedRecord[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "asc" },
    include: { customer: true, items: true },
  });
  return orders.map((order) => {
    const isCancelled = order.status === "CANCELLED";
    return {
      dto: {
        externalSystem: EXTERNAL_SYSTEM,
        entity: IntegrationEntity.ORDER,
        externalId: order.orderNumber,
        data: {
          orderNumber: order.orderNumber,
          customerNumber: order.customer.customerNumber,
          status: order.status,
          subtotal: order.subtotal.toString(),
          vatAmount: order.vatAmount.toString(),
          total: order.total.toString(),
          itemCount: order.items.length,
        },
      },
      success: !isCancelled,
    };
  });
}

const RECORD_BUILDERS: Record<IntegrationEntity, () => Promise<SimulatedRecord[]>> = {
  [IntegrationEntity.CUSTOMER]: buildCustomerRecords,
  [IntegrationEntity.PRODUCT]: buildProductRecords,
  [IntegrationEntity.INVENTORY]: buildInventoryRecords,
  [IntegrationEntity.ORDER]: buildOrderRecords,
};

const REJECTION_REASON: Record<IntegrationEntity, string> = {
  [IntegrationEntity.CUSTOMER]: "record rejected by the external system",
  [IntegrationEntity.PRODUCT]: "record rejected by the external system",
  [IntegrationEntity.INVENTORY]: "zero-quantity stock records are not accepted by the external system",
  [IntegrationEntity.ORDER]: "cancelled orders are excluded from the external sync",
};

function buildErrorMessage(entity: IntegrationEntity, failed: number, total: number): string | undefined {
  if (failed === 0) return undefined;
  return `${failed} of ${total} record${total === 1 ? "" : "s"} failed: ${REJECTION_REASON[entity]}.`;
}

export async function runSync(entity: IntegrationEntity) {
  const startedAt = new Date();
  const records = await RECORD_BUILDERS[entity]();

  await sleep(Math.min(MAX_SIMULATED_LATENCY_MS, 20 + records.length * 10));

  const completedAt = new Date();
  const recordsProcessed = records.length;
  const recordsSucceeded = records.filter((r) => r.success).length;
  const recordsFailed = recordsProcessed - recordsSucceeded;

  const status: IntegrationSyncStatus =
    recordsProcessed === 0 || recordsFailed === 0
      ? IntegrationSyncStatus.SUCCESS
      : recordsSucceeded === 0
        ? IntegrationSyncStatus.FAILED
        : IntegrationSyncStatus.PARTIAL;

  const payloadSummary = JSON.stringify(
    records.slice(0, PAYLOAD_SAMPLE_SIZE).map((r) => r.dto),
    null,
    2,
  ).slice(0, MAX_PAYLOAD_SUMMARY_LENGTH);

  return prisma.integrationSync.create({
    data: {
      entity,
      status,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      recordsProcessed,
      recordsSucceeded,
      recordsFailed,
      errorMessage: buildErrorMessage(entity, recordsFailed, recordsProcessed),
      payloadSummary,
    },
  });
}

export async function runSyncAll() {
  const results = [];
  for (const entity of [
    IntegrationEntity.CUSTOMER,
    IntegrationEntity.PRODUCT,
    IntegrationEntity.INVENTORY,
    IntegrationEntity.ORDER,
  ]) {
    results.push(await runSync(entity));
  }

  const overallStatus: IntegrationSyncStatus = results.every((r) => r.status === IntegrationSyncStatus.SUCCESS)
    ? IntegrationSyncStatus.SUCCESS
    : results.every((r) => r.status === IntegrationSyncStatus.FAILED)
      ? IntegrationSyncStatus.FAILED
      : IntegrationSyncStatus.PARTIAL;

  return {
    status: overallStatus,
    recordsProcessed: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
    recordsSucceeded: results.reduce((sum, r) => sum + r.recordsSucceeded, 0),
    recordsFailed: results.reduce((sum, r) => sum + r.recordsFailed, 0),
    results,
  };
}

export async function getStatus() {
  const [lastSync, total, successful, failed, partial] = await Promise.all([
    prisma.integrationSync.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.integrationSync.count(),
    prisma.integrationSync.count({ where: { status: IntegrationSyncStatus.SUCCESS } }),
    prisma.integrationSync.count({ where: { status: IntegrationSyncStatus.FAILED } }),
    prisma.integrationSync.count({ where: { status: IntegrationSyncStatus.PARTIAL } }),
  ]);

  return {
    externalSystem: EXTERNAL_SYSTEM,
    connectionStatus: "Priority Integration Simulator — simulated ERP connection, not a live link",
    lastSyncAt: lastSync?.createdAt ?? null,
    totalSyncs: total,
    successfulSyncs: successful,
    failedSyncs: failed,
    partialSyncs: partial,
  };
}

export interface HistoryListParams {
  page: number;
  limit: number;
  entity?: IntegrationEntity;
  status?: IntegrationSyncStatus;
  sortOrder: "asc" | "desc";
}

export async function listHistory(params: HistoryListParams) {
  const { page, limit, entity, status, sortOrder } = params;

  const where: Prisma.IntegrationSyncWhereInput = {
    ...(entity ? { entity } : {}),
    ...(status ? { status } : {}),
  };

  const [syncs, total] = await Promise.all([
    prisma.integrationSync.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: sortOrder },
    }),
    prisma.integrationSync.count({ where }),
  ]);

  return {
    syncs,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}
