/**
 * Neuways CRM - Theme Definitions and Constants
 *
 * Provides type-safe access to design tokens and supports future theme switching
 * (e.g. Dark Mode or Tenant-branded themes).
 */

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  pageBg: string;
  cardBg: string;
  sidebarBg: string;
  headerBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export const lightTheme: ThemeColors = {
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  primaryLight: "#eff6ff",
  secondary: "#0f172a",
  pageBg: "#f8fafc",
  cardBg: "#ffffff",
  sidebarBg: "#ffffff",
  headerBg: "#ffffff",
  textPrimary: "#0f172a",
  textSecondary: "#334155",
  textMuted: "#64748b",
  textSubtle: "#94a3b8",
  border: "#e2e8f0",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#0284c7",
};

export const currentTheme = lightTheme;
