import type { SupabaseClient } from "@supabase/supabase-js";
import { storefrontEventFromRow } from "@glamsite/shared/mappers";
import type { StorefrontEvent } from "@glamsite/shared/types";

export const ANALYTICS_PERIODS = ["7d", "30d", "month"] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export const ANALYTICS_PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
};

const EVENT_PAGE_SIZE = 1000;
const EXCLUDED_ORDER_STATUSES = new Set(["cancelled", "refunded"]);

export type AnalyticsChartPoint = {
  date: string;
  revenue: number;
  impressions: number;
};

export type TopViewedProduct = {
  productId: string;
  name: string;
  views: number;
};

export type AnalyticsSnapshot = {
  period: AnalyticsPeriod;
  pageViews: number;
  productViews: number;
  ordersPlaced: number;
  revenueCedis: number;
  averageOrderCedis: number;
  pageViewsDelta: number | null;
  productViewsDelta: number | null;
  ordersDelta: number | null;
  averageOrderDelta: number | null;
  chart: AnalyticsChartPoint[];
  topProducts: TopViewedProduct[];
};

export type OverviewStats = {
  revenueCedis: number;
  revenuePreviousCedis: number;
  revenueDelta: number | null;
  orders: number;
  ordersPrevious: number;
  ordersDelta: number | null;
  impressions: number;
  impressionsPrevious: number;
  impressionsDelta: number | null;
  conversion: number | null;
  conversionPrevious: number | null;
  conversionDelta: number | null;
};

export function parseAnalyticsPeriod(value: unknown): AnalyticsPeriod {
  return ANALYTICS_PERIODS.includes(value as AnalyticsPeriod) ? (value as AnalyticsPeriod) : "30d";
}

export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
}

export function conversionRate(orders: number, impressions: number): number | null {
  if (!Number.isFinite(orders) || !Number.isFinite(impressions) || impressions <= 0) {
    return null;
  }
  return (orders / impressions) * 100;
}

export function formatDeltaPercent(delta: number | null): string | undefined {
  if (delta == null || !Number.isFinite(delta)) return undefined;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

export function periodRange(period: AnalyticsPeriod, now = new Date()): { start: Date; end: Date } {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const start = new Date(end);
  if (period === "7d") {
    start.setUTCDate(start.getUTCDate() - 7);
  } else if (period === "30d") {
    start.setUTCDate(start.getUTCDate() - 30);
  } else {
    start.setUTCFullYear(now.getUTCFullYear(), now.getUTCMonth(), 1);
  }
  return { start, end };
}

function previousRange(start: Date, end: Date): { start: Date; end: Date } {
  const durationMs = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - durationMs), end: new Date(start) };
}

function utcDayKey(value: Date | string): string {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return value.slice(0, 10);
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

function eachUtcDay(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endMs = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  while (cursor.getTime() < endMs) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function formatDayLabel(day: string, period: AnalyticsPeriod): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  if (period === "7d") {
    return date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

async function fetchEventsInRange(
  supabase: SupabaseClient,
  sellerId: string,
  start: Date,
  end: Date
): Promise<StorefrontEvent[]> {
  const events: StorefrontEvent[] = [];
  for (let offset = 0; ; offset += EVENT_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("storefront_events")
      .select("id, seller_id, event_type, path, product_id, session_id, created_at")
      .eq("seller_id", sellerId)
      .in("event_type", ["page_view", "product_view"])
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true })
      .range(offset, offset + EVENT_PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data ?? []).map(storefrontEventFromRow);
    events.push(...rows);
    if (rows.length < EVENT_PAGE_SIZE) break;
  }
  return events;
}

async function fetchOrdersInRange(
  supabase: SupabaseClient,
  sellerId: string,
  start: Date,
  end: Date
): Promise<Array<{ createdAt: string; subtotalCedis: number; status: string }>> {
  const { data, error } = await supabase
    .from("orders")
    .select("created_at, subtotal_cedis, status")
    .eq("seller_id", sellerId)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());
  if (error) throw error;
  return (data ?? []).map((row) => ({
    createdAt: String(row.created_at ?? ""),
    subtotalCedis: Number(row.subtotal_cedis ?? 0),
    status: String(row.status ?? ""),
  }));
}

function summarizeEvents(events: StorefrontEvent[]) {
  let pageViews = 0;
  let productViews = 0;
  const viewsByDay = new Map<string, number>();
  const viewsByProduct = new Map<string, number>();

  for (const event of events) {
    const day = utcDayKey(new Date(event.createdAt).toISOString());
    if (event.eventType === "page_view") {
      pageViews += 1;
      viewsByDay.set(day, (viewsByDay.get(day) ?? 0) + 1);
    }
    if (event.eventType === "product_view") {
      productViews += 1;
      if (event.productId) {
        viewsByProduct.set(event.productId, (viewsByProduct.get(event.productId) ?? 0) + 1);
      }
    }
  }

  return { pageViews, productViews, viewsByDay, viewsByProduct };
}

function summarizeOrders(orders: Array<{ createdAt: string; subtotalCedis: number; status: string }>) {
  let ordersPlaced = 0;
  let revenueCedis = 0;
  const revenueByDay = new Map<string, number>();
  const ordersByDay = new Map<string, number>();

  for (const order of orders) {
    if (EXCLUDED_ORDER_STATUSES.has(order.status)) continue;
    const subtotal = Number.isFinite(order.subtotalCedis) ? order.subtotalCedis : 0;
    const day = utcDayKey(order.createdAt);
    ordersPlaced += 1;
    revenueCedis += subtotal;
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + subtotal);
    ordersByDay.set(day, (ordersByDay.get(day) ?? 0) + 1);
  }

  return { ordersPlaced, revenueCedis, revenueByDay, ordersByDay };
}

async function topProductsFromCounts(
  supabase: SupabaseClient,
  sellerId: string,
  viewsByProduct: Map<string, number>,
  limit = 5
): Promise<TopViewedProduct[]> {
  const ranked = [...viewsByProduct.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
  if (ranked.length === 0) return [];

  const ids = ranked.map(([id]) => id);
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .eq("seller_id", sellerId)
    .in("id", ids);
  if (error) throw error;

  const names = new Map<string, string>();
  for (const row of data ?? []) {
    names.set(String(row.id), String(row.name ?? "").trim() || "Untitled product");
  }

  return ranked.map(([productId, views]) => ({
    productId,
    name: names.get(productId) ?? "Deleted product",
    views,
  }));
}

export async function getPageViewStats(
  supabase: SupabaseClient,
  sellerId: string,
  period: AnalyticsPeriod
): Promise<{ current: number; previous: number; delta: number | null }> {
  const currentRange = periodRange(period);
  const prior = previousRange(currentRange.start, currentRange.end);

  const [currentCount, previousCount] = await Promise.all([
    countEvents(supabase, sellerId, "page_view", currentRange.start, currentRange.end),
    countEvents(supabase, sellerId, "page_view", prior.start, prior.end),
  ]);

  return {
    current: currentCount,
    previous: previousCount,
    delta: percentChange(currentCount, previousCount),
  };
}

export function emptyOverviewStats(): OverviewStats {
  return {
    revenueCedis: 0,
    revenuePreviousCedis: 0,
    revenueDelta: null,
    orders: 0,
    ordersPrevious: 0,
    ordersDelta: null,
    impressions: 0,
    impressionsPrevious: 0,
    impressionsDelta: null,
    conversion: null,
    conversionPrevious: null,
    conversionDelta: null,
  };
}

export async function getOverviewStats(
  supabase: SupabaseClient,
  sellerId: string
): Promise<OverviewStats> {
  const currentRange = periodRange("7d");
  const prior = previousRange(currentRange.start, currentRange.end);

  const [currentOrders, previousOrders, impressionStats] = await Promise.all([
    fetchOrdersInRange(supabase, sellerId, currentRange.start, currentRange.end),
    fetchOrdersInRange(supabase, sellerId, prior.start, prior.end),
    getPageViewStats(supabase, sellerId, "7d"),
  ]);

  const current = summarizeOrders(currentOrders);
  const previous = summarizeOrders(previousOrders);
  const conversion = conversionRate(current.ordersPlaced, impressionStats.current);
  const conversionPrevious = conversionRate(previous.ordersPlaced, impressionStats.previous);

  return {
    revenueCedis: current.revenueCedis,
    revenuePreviousCedis: previous.revenueCedis,
    revenueDelta: percentChange(current.revenueCedis, previous.revenueCedis),
    orders: current.ordersPlaced,
    ordersPrevious: previous.ordersPlaced,
    ordersDelta: percentChange(current.ordersPlaced, previous.ordersPlaced),
    impressions: impressionStats.current,
    impressionsPrevious: impressionStats.previous,
    impressionsDelta: impressionStats.delta,
    conversion,
    conversionPrevious,
    conversionDelta:
      conversion != null && conversionPrevious != null
        ? percentChange(conversion, conversionPrevious)
        : null,
  };
}

async function countEvents(
  supabase: SupabaseClient,
  sellerId: string,
  eventType: "page_view" | "product_view",
  start: Date,
  end: Date
): Promise<number> {
  const { count, error } = await supabase
    .from("storefront_events")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .eq("event_type", eventType)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());
  if (error) throw error;
  return count ?? 0;
}

export async function getSellerAnalytics(
  supabase: SupabaseClient,
  sellerId: string,
  period: AnalyticsPeriod
): Promise<AnalyticsSnapshot> {
  const currentRange = periodRange(period);
  const prior = previousRange(currentRange.start, currentRange.end);

  const [currentEvents, previousEvents, currentOrders, previousOrders] = await Promise.all([
    fetchEventsInRange(supabase, sellerId, currentRange.start, currentRange.end),
    fetchEventsInRange(supabase, sellerId, prior.start, prior.end),
    fetchOrdersInRange(supabase, sellerId, currentRange.start, currentRange.end),
    fetchOrdersInRange(supabase, sellerId, prior.start, prior.end),
  ]);

  const currentEventStats = summarizeEvents(currentEvents);
  const previousEventStats = summarizeEvents(previousEvents);
  const currentOrderStats = summarizeOrders(currentOrders);
  const previousOrderStats = summarizeOrders(previousOrders);

  const averageOrderCedis =
    currentOrderStats.ordersPlaced > 0
      ? currentOrderStats.revenueCedis / currentOrderStats.ordersPlaced
      : 0;
  const previousAverageOrderCedis =
    previousOrderStats.ordersPlaced > 0
      ? previousOrderStats.revenueCedis / previousOrderStats.ordersPlaced
      : 0;

  const chart = eachUtcDay(currentRange.start, currentRange.end).map((day) => ({
    date: formatDayLabel(day, period),
    revenue: currentOrderStats.revenueByDay.get(day) ?? 0,
    impressions: currentEventStats.viewsByDay.get(day) ?? 0,
  }));

  const topProducts = await topProductsFromCounts(
    supabase,
    sellerId,
    currentEventStats.viewsByProduct
  );

  return {
    period,
    pageViews: currentEventStats.pageViews,
    productViews: currentEventStats.productViews,
    ordersPlaced: currentOrderStats.ordersPlaced,
    revenueCedis: currentOrderStats.revenueCedis,
    averageOrderCedis,
    pageViewsDelta: percentChange(currentEventStats.pageViews, previousEventStats.pageViews),
    productViewsDelta: percentChange(currentEventStats.productViews, previousEventStats.productViews),
    ordersDelta: percentChange(currentOrderStats.ordersPlaced, previousOrderStats.ordersPlaced),
    averageOrderDelta: percentChange(averageOrderCedis, previousAverageOrderCedis),
    chart,
    topProducts,
  };
}

export function emptyAnalytics(period: AnalyticsPeriod): AnalyticsSnapshot {
  const { start, end } = periodRange(period);
  return {
    period,
    pageViews: 0,
    productViews: 0,
    ordersPlaced: 0,
    revenueCedis: 0,
    averageOrderCedis: 0,
    pageViewsDelta: null,
    productViewsDelta: null,
    ordersDelta: null,
    averageOrderDelta: null,
    chart: eachUtcDay(start, end).map((day) => ({
      date: formatDayLabel(day, period),
      revenue: 0,
      impressions: 0,
    })),
    topProducts: [],
  };
}
