/**
 * utils/theme.js — Shared design tokens for Vercentic
 *
 * Import this instead of redefining `const C = {...}` in each file.
 * Usage:  import { C, F, STATUS_COLORS } from '../utils/theme';
 *
 * NOTE: New files should use this. Existing files can be migrated gradually.
 */

// ── Core colour palette ───────────────────────────────────────────────────────
export const C = {
  // Backgrounds
  bg:           "var(--t-bg,          #EEF2FF)",
  surface:      "var(--t-surface,     #FFFFFF)",
  card:         "var(--t-card,        #FFFFFF)",

  // Borders
  border:       "var(--t-border,      #E5E7EB)",
  border2:      "var(--t-border2,     #D1D5DB)",

  // Text
  text1:        "var(--t-text1,       #111827)",
  text2:        "var(--t-text2,       #374151)",
  text3:        "var(--t-text3,       #9CA3AF)",
  text4:        "var(--t-text4,       #6B7280)",

  // Accent (primary brand colour)
  accent:       "var(--t-accent,      #4361EE)",
  accentLight:  "var(--t-accent-light,#EEF2FF)",

  // Semantic colours
  green:        "#0CAF77",
  greenLight:   "#F0FDF4",
  amber:        "#F59F00",
  amberLight:   "#FFFBEB",
  red:          "#EF4444",
  redLight:     "#FEF2F2",
  purple:       "#7C3AED",
  purpleLight:  "#F5F3FF",
  blue:         "#3B82F6",
  blueLight:    "#EFF6FF",
};

// ── Typography ─────────────────────────────────────────────────────────────────
export const F = "'Geist', 'DM Sans', -apple-system, sans-serif";

// ── Common status → colour map ────────────────────────────────────────────────
// Used by FieldValue, TableView status pills, Kanban column headers etc.
export const STATUS_COLORS = {
  // Candidate pipeline
  Active:       C.green,
  Applied:      "#6366f1",
  Screening:    "#f59f00",
  Shortlisted:  "#3b82f6",
  Interview:    "#8b5cf6",
  Offer:        "#10b981",
  Hired:        "#059669",
  Rejected:     C.red,
  Withdrawn:    C.text3,

  // Job statuses
  Open:         C.green,
  Draft:        C.text3,
  Closed:       C.red,
  "On Hold":    C.amber,
  Filled:       "#6366f1",

  // Offer statuses
  pending_approval: C.amber,
  sent:             "#3b82f6",
  accepted:         C.green,
  declined:         C.red,
  expired:          C.text3,

  // Generic
  Active2:      C.green,   // alias
  Inactive:     C.text3,
  Pending:      C.amber,
  Approved:     C.green,
  Completed:    "#059669",
  Cancelled:    C.red,
};

// ── Shadow / elevation ────────────────────────────────────────────────────────
export const SHADOW = {
  sm:  "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  md:  "0 4px 12px rgba(0,0,0,0.08)",
  lg:  "0 8px 24px rgba(0,0,0,0.10)",
  xl:  "0 16px 40px rgba(0,0,0,0.12)",
};

// ── Border radius ─────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  20,
  full: 999,
};
