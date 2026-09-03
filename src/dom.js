/* Tiny DOM helpers shared by every panel and figure. */

/** Element by id. */
export const $ = id => document.getElementById(id);

/** Current value of a CSS custom property, so canvas drawing follows the theme. */
export const col = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
