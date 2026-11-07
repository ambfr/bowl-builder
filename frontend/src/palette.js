// Colors come from the food itself. Unknown ingredients get a neutral fallback.
export const SWATCH = {
  Acai: "#5b2a86",
  Pitaya: "#d6336c",
  Banana: "#f1dc8a",
  Strawberry: "#d6304a",
  Granola: "#b98a54",
  Honey: "#e0a526",
  "Peanut Butter": "#a8743f",
};

export const swatchFor = (name) => SWATCH[name] || "#9a8aa8";