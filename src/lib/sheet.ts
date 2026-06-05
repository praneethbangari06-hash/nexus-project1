import Papa from "papaparse";

export const SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/15QnUa4zyQc1luH5nYfJAMtc2o2oNL0A1R2XHX_5Qy88/export?format=csv&gid=1346140858";

export type Row = {
  client: string;
  amount: number;
  industry: string;
  gmail: string;
};

export async function fetchSheet(): Promise<Row[]> {
  const res = await fetch(`${SHEET_CSV}&_t=${Date.now()}`, { cache: "no-store" });
  const text = await res.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return parsed.data
    .map((r) => {
      const get = (keys: string[]) => {
        for (const k of Object.keys(r)) {
          if (keys.some((x) => k.trim().toLowerCase() === x)) return r[k];
        }
        return "";
      };
      const amountRaw = get(["amount payed", "amount paid", "amount", "revenue"]);
      return {
        client: (get(["client", "name"]) || "").trim(),
        amount: Number(String(amountRaw).replace(/[^0-9.-]/g, "")) || 0,
        industry: (get(["industry"]) || "Unknown").trim() || "Unknown",
        gmail: (get(["gmail", "email"]) || "").trim(),
      };
    })
    .filter((r) => r.client);
}

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const formatINRCompact = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
};
