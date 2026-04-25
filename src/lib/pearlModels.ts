// Maps Pearl Inverter AC tonnage to model code
// 1 ton -> POMD12, 1.5 ton -> POMD18, 2 ton -> POMD24, 4 ton -> POMD48
const PEARL_MODEL_BY_TON: Record<string, string> = {
  "1": "POMD12",
  "1.5": "POMD18",
  "2": "POMD24",
  "3": "POMD36",
  "4": "POMD48",
};

const isPearlInverterAc = (name: string): boolean => {
  const n = name.toLowerCase();
  return (
    n.includes("pearl") &&
    (n.includes("inverter") || n.includes("ac") || n.includes("air condition"))
  );
};

const extractTon = (name: string): string | null => {
  // Match patterns like "1 ton", "1.5 ton", "1.5-ton", "2ton"
  const m = name.toLowerCase().match(/(\d+(?:\.\d+)?)\s*-?\s*ton/);
  if (!m) return null;
  const val = m[1];
  return PEARL_MODEL_BY_TON[val] ? val : null;
};

/**
 * If the item name matches a Pearl Inverter AC and includes a known tonnage,
 * append the model code (e.g. "POMD18") to the name. Skips if model already present.
 */
export const enrichWithPearlModel = (name: string): string => {
  if (!name) return name;
  if (!isPearlInverterAc(name)) return name;
  const ton = extractTon(name);
  if (!ton) return name;
  const model = PEARL_MODEL_BY_TON[ton];
  if (!model) return name;
  if (name.toUpperCase().includes(model)) return name;
  return `${name} (${model})`;
};

export const getPearlModelByTon = (ton: number | string): string | null => {
  const key = String(ton);
  return PEARL_MODEL_BY_TON[key] || null;
};
