/**
 * Utility helper functions for the application.
 * Import as: import { cn, formatDate, formatCurrency } from "@/lib/utils";
 */

import { CURRENCY } from "./constants";

/**
 * Conditionally join CSS class names together.
 * Filters out falsy values so you can do: cn("base", condition && "extra")
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a date string or Date object into a human-readable format.
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(new Date(date));
}

/**
 * Format a date into short date + time.
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

/**
 * Format a number as currency with the app's configured symbol.
 */
export function formatCurrency(amount: number): string {
  return `${CURRENCY}${amount.toLocaleString("en-PH")}`;
}

/**
 * Generate a short receipt/transaction ID.
 */
export function generateReceiptId(): string {
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `TXN-${num}`;
}

/**
 * Get a time-based greeting.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Async sleep helper for delays.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely parse JSON with a fallback value.
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Get initials from a full name.
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number = 30): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}
