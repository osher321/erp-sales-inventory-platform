import { listCustomers } from "../api/customers.api";
import { listOrders } from "../api/orders.api";
import { getLowStockProducts, getOutOfStockProducts, listProducts } from "../api/products.api";
import { ORDER_STATUSES } from "../lib/orderStatus";
import type { Order, OrderStatus, Product } from "../types/api";

export interface DailyRevenuePoint {
  date: string; // YYYY-MM-DD
  revenue: number;
}

export interface DashboardData {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  recentOrders: Order[];
  ordersByStatus: Record<OrderStatus, number>;
  salesOverTime: DailyRevenuePoint[];
}

// The orders list endpoint caps `limit` at 100 and has no dedicated revenue
// aggregate, so "Total Revenue" and the sales-over-time chart are computed
// from the most recent 100 orders. Accurate for this demo's data volume; a
// real deployment would add a server-side aggregate endpoint instead of
// summing/grouping a page of results.
const ORDERS_SAMPLE_LIMIT = 100;

function buildDailySeries(orders: Order[]): DailyRevenuePoint[] {
  const revenueByDay = new Map<string, number>();
  for (const order of orders) {
    const day = order.createdAt.slice(0, 10);
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(order.total));
  }
  if (revenueByDay.size === 0) return [];

  const days = Array.from(revenueByDay.keys()).sort();
  const start = new Date(days[0]);
  const end = new Date(days[days.length - 1]);

  const series: DailyRevenuePoint[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, revenue: revenueByDay.get(key) ?? 0 });
  }
  return series;
}

export async function loadDashboardData(): Promise<DashboardData> {
  const [customersResult, productsResult, ordersResult, lowStockProducts, outOfStockProducts, statusCounts] =
    await Promise.all([
      listCustomers({ limit: 1 }),
      listProducts({ limit: 1 }),
      listOrders({ limit: ORDERS_SAMPLE_LIMIT, sortBy: "createdAt", sortOrder: "desc" }),
      getLowStockProducts(),
      getOutOfStockProducts(),
      Promise.all(ORDER_STATUSES.map((status) => listOrders({ status, limit: 1 }))),
    ]);

  const totalRevenue = ordersResult.orders.reduce((sum, order) => sum + Number(order.total), 0);

  const ordersByStatus = ORDER_STATUSES.reduce(
    (acc, status, index) => {
      acc[status] = statusCounts[index].pagination.total;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );

  return {
    totalCustomers: customersResult.pagination.total,
    totalProducts: productsResult.pagination.total,
    totalOrders: ordersResult.pagination.total,
    totalRevenue,
    lowStockProducts,
    outOfStockProducts,
    recentOrders: ordersResult.orders.slice(0, 5),
    ordersByStatus,
    salesOverTime: buildDailySeries(ordersResult.orders),
  };
}
