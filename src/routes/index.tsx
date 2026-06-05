import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, FunnelChart, Funnel, LabelList,
} from "recharts";
import {
  Activity, TrendingUp, Users, Briefcase, Mail, Zap, Target,
  GripVertical, RefreshCw, Crown, Sparkles,
} from "lucide-react";
import { fetchSheet, formatINR, formatINRCompact, type Row } from "@/lib/sheet";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const WIDGET_IDS = ["revenue", "performance", "industry", "funnel", "engagement", "clients"] as const;
type WidgetId = (typeof WIDGET_IDS)[number];

const PURPLE = "oklch(0.72 0.3 305)";
const PURPLE_2 = "oklch(0.6 0.28 320)";
const RED = "oklch(0.78 0.18 195)";
const RED_2 = "oklch(0.65 0.2 210)";
const PALETTE = [PURPLE, RED, PURPLE_2, "oklch(0.7 0.22 280)", RED_2, "oklch(0.75 0.2 340)"];

function Dashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pulse, setPulse] = useState(0);
  const [order, setOrder] = useState<WidgetId[]>([...WIDGET_IDS]);
  const prevHash = useRef("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await fetchSheet();
        if (!alive) return;
        const hash = JSON.stringify(data);
        if (hash !== prevHash.current) {
          prevHash.current = hash;
          setRows(data);
          setPulse((p) => p + 1);
        }
        setLastSync(new Date());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const k = useMemo(() => {
    const totalRevenue = rows.reduce((s, r) => s + r.amount, 0);
    const clients = rows.length;
    const avg = clients ? totalRevenue / clients : 0;
    const industries = new Map<string, number>();
    rows.forEach((r) => industries.set(r.industry, (industries.get(r.industry) || 0) + r.amount));
    const industryData = [...industries.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const sorted = [...rows].sort((a, b) => b.amount - a.amount);
    const top = sorted[0];
    const gmailDomains = new Set(rows.map((r) => r.gmail.split("@")[1]).filter(Boolean));
    return { totalRevenue, clients, avg, industryData, sorted, top, gmailDomains: gmailDomains.size };
  }, [rows]);

  const trendData = useMemo(() => {
    return k.sorted.slice().reverse().map((r, i) => ({
      name: r.client.split(" ")[0],
      revenue: r.amount,
      cumulative: k.sorted.slice().reverse().slice(0, i + 1).reduce((s, x) => s + x.amount, 0),
    }));
  }, [k.sorted]);

  const funnelData = useMemo(() => {
    const total = k.clients || 1;
    return [
      { name: "Leads", value: Math.round(total * 4.2), fill: PURPLE },
      { name: "Qualified", value: Math.round(total * 2.6), fill: PURPLE_2 },
      { name: "Proposals", value: Math.round(total * 1.6), fill: "oklch(0.65 0.28 350)" },
      { name: "Negotiations", value: Math.round(total * 1.15), fill: RED_2 },
      { name: "Won", value: total, fill: RED },
    ];
  }, [k.clients]);

  const engagementData = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      active: Math.round(20 + Math.sin(i / 3 + pulse * 0.2) * 18 + Math.random() * 10 + (i > 8 && i < 22 ? 25 : 0)),
    })), [pulse]);

  const perfData = useMemo(() => [
    { name: "Conversion", value: 78, fill: PURPLE },
    { name: "Retention", value: 64, fill: RED },
    { name: "Engagement", value: 89, fill: PURPLE_2 },
    { name: "Satisfaction", value: 72, fill: "oklch(0.7 0.25 340)" },
  ], []);

  return (
    <div className="min-h-screen grid-bg">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <Header lastSync={lastSync} loading={loading} count={rows.length} />

        <KpiRow k={k} pulse={pulse} />

        <Reorder.Group
          axis="y"
          values={order}
          onReorder={setOrder}
          className="mt-6 grid grid-cols-1 lg:grid-cols-6 gap-5"
        >
          {order.map((id) => (
            <Reorder.Item
              key={id}
              value={id}
              className={cardSpan(id)}
              whileDrag={{ scale: 1.02, zIndex: 50 }}
            >
              <WidgetCard id={id}>
                {id === "revenue" && <RevenueWidget data={trendData} />}
                {id === "industry" && <IndustryWidget data={k.industryData} />}
                {id === "funnel" && <FunnelWidget data={funnelData} />}
                {id === "engagement" && <EngagementWidget data={engagementData} />}
                {id === "clients" && <ClientsWidget rows={k.sorted} />}
                {id === "performance" && <PerformanceWidget data={perfData} />}
              </WidgetCard>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        <footer className="mt-10 text-center text-xs text-muted-foreground/70">
          Live stream from Google Sheets · Auto-refresh every 5s · Drag widgets to rearrange
        </footer>
      </div>
    </div>
  );
}

function cardSpan(id: WidgetId) {
  switch (id) {
    case "revenue": return "lg:col-span-4";
    case "performance": return "lg:col-span-2";
    case "industry": return "lg:col-span-2";
    case "funnel": return "lg:col-span-2";
    case "engagement": return "lg:col-span-2";
    case "clients": return "lg:col-span-6";
  }
}

function Header({ lastSync, loading, count }: { lastSync: Date | null; loading: boolean; count: number }) {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="size-12 rounded-2xl glass-strong grid place-items-center animate-pulse-glow">
            <Sparkles className="size-6 text-[color:var(--neon)]" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            <span className="text-glow">NEXUS</span>
            <span className="text-muted-foreground font-light"> · Control Room</span>
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Realtime business intelligence · {count} records live
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-mono w-fit">
        <span className="live-dot" />
        <span className="text-muted-foreground">
          {loading ? "SYNCING..." : `LIVE · ${lastSync?.toLocaleTimeString() ?? "—"}`}
        </span>
        <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
      </div>
    </header>
  );
}

type KpiData = {
  totalRevenue: number; clients: number; avg: number;
  industryData: { name: string; value: number }[];
  sorted: Row[]; top: Row | undefined; gmailDomains: number;
};
function KpiRow({ k, pulse }: { k: KpiData; pulse: number }) {
  const items = [
    { label: "Total Revenue", value: formatINR(k.totalRevenue), icon: TrendingUp, color: "neon", sub: "Across all clients" },
    { label: "Active Clients", value: String(k.clients), icon: Users, color: "danger", sub: `${k.gmailDomains} unique domains` },
    { label: "Avg. Deal Size", value: formatINRCompact(k.avg), icon: Target, color: "neon", sub: "Per client" },
    { label: "Top Client", value: k.top?.client ?? "—", icon: Crown, color: "danger", sub: k.top ? formatINRCompact(k.top.amount) : "" },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="glass-strong rounded-2xl p-5 relative overflow-hidden group"
        >
          <div
            className="absolute -top-12 -right-12 size-32 rounded-full blur-3xl opacity-40 group-hover:opacity-70 transition-opacity"
            style={{ background: it.color === "neon" ? PURPLE : RED }}
          />
          <div className="flex items-center justify-between relative">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">{it.label}</span>
            <it.icon className="size-4" style={{ color: it.color === "neon" ? PURPLE : RED }} />
          </div>
          <motion.div
            key={`${it.label}-${pulse}`}
            initial={{ opacity: 0.5, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.5 }}
            className={`mt-3 text-2xl md:text-3xl font-bold relative ${it.color === "neon" ? "text-glow" : "text-glow-red"}`}
          >
            {it.value}
          </motion.div>
          <div className="mt-1 text-xs text-muted-foreground relative">{it.sub}</div>
        </motion.div>
      ))}
    </div>
  );
}



function WidgetCard({ children, id }: { children: React.ReactNode; id: WidgetId }) {
  const title: Record<WidgetId, { t: string; sub: string; icon: any }> = {
    revenue: { t: "Revenue Trend", sub: "Cumulative across clients", icon: TrendingUp },
    industry: { t: "Industry Distribution", sub: "Revenue by sector", icon: Briefcase },
    funnel: { t: "Conversion Funnel", sub: "Lead → Won", icon: Zap },
    engagement: { t: "User Engagement", sub: "Activity / 24h", icon: Activity },
    clients: { t: "Client Insights", sub: "All accounts", icon: Mail },
    performance: { t: "Performance", sub: "Key indicators", icon: Target },
  };
  const meta = title[id];
  return (
    <div className="glass-strong rounded-2xl p-5 h-full relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl grid place-items-center"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.27 305 / 0.3), oklch(0.6 0.28 22 / 0.3))" }}>
            <meta.icon className="size-4 text-[color:var(--neon)]" />
          </div>
          <div>
            <h3 className="font-semibold tracking-tight">{meta.t}</h3>
            <p className="text-xs text-muted-foreground font-mono">{meta.sub}</p>
          </div>
        </div>
        <GripVertical className="size-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
      </div>
      {children}
    </div>
  );
}

const tooltipStyle = {
  background: "oklch(0.15 0.05 295 / 0.9)",
  border: "1px solid oklch(1 0 0 / 0.15)",
  borderRadius: 12,
  backdropFilter: "blur(12px)",
  color: "white",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 12,
};

function RevenueWidget({ data }: { data: any[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -10, right: 10, top: 10 }}>
          <defs>
            <linearGradient id="gPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PURPLE} stopOpacity={0.7} />
              <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={RED} stopOpacity={0.5} />
              <stop offset="100%" stopColor={RED} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="oklch(1 0 0 / 0.06)" />
          <XAxis dataKey="name" stroke="oklch(0.7 0.05 300)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="oklch(0.7 0.05 300)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatINRCompact} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
          <Area type="monotone" dataKey="cumulative" stroke={RED} strokeWidth={2} fill="url(#gRed)" />
          <Area type="monotone" dataKey="revenue" stroke={PURPLE} strokeWidth={2.5} fill="url(#gPurple)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function IndustryWidget({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatINR(v)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="-mt-4 flex flex-wrap gap-2 justify-center">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs font-mono">
            <span className="size-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="text-muted-foreground">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelWidget({ data }: { data: any[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <FunnelChart>
          <Tooltip contentStyle={tooltipStyle} />
          <Funnel dataKey="value" data={data} isAnimationActive>
            <LabelList position="right" fill="white" stroke="none" dataKey="name" fontSize={11} fontFamily="JetBrains Mono" />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
}

function EngagementWidget({ data }: { data: any[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
          <CartesianGrid strokeDasharray="3 6" stroke="oklch(1 0 0 / 0.06)" />
          <XAxis dataKey="hour" stroke="oklch(0.7 0.05 300)" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="oklch(0.7 0.05 300)" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="active" stroke={PURPLE} strokeWidth={2.5} dot={false}
            style={{ filter: `drop-shadow(0 0 6px ${PURPLE})` }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PerformanceWidget({ data }: { data: any[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <RadialBarChart innerRadius="25%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <RadialBar background={{ fill: "oklch(1 0 0 / 0.04)" }} dataKey="value" cornerRadius={8} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="-mt-6 grid grid-cols-2 gap-1 text-[11px] font-mono">
        {data.map((d) => (
          <div key={d.name} className="flex justify-between">
            <span className="text-muted-foreground">{d.name}</span>
            <span style={{ color: d.fill }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientsWidget({ rows }: { rows: Row[] }) {
  const max = rows[0]?.amount || 1;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground font-mono">
          <tr className="border-b border-white/10">
            <th className="py-3 pr-4">#</th>
            <th className="py-3 pr-4">Client</th>
            <th className="py-3 pr-4">Industry</th>
            <th className="py-3 pr-4">Gmail</th>
            <th className="py-3 pr-4">Revenue</th>
            <th className="py-3">Share</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {rows.map((r, i) => (
              <motion.tr
                key={r.client + r.gmail}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-white/5 hover:bg-white/[0.03]"
              >
                <td className="py-3 pr-4 font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</td>
                <td className="py-3 pr-4 font-medium">{r.client}</td>
                <td className="py-3 pr-4">
                  <span className="text-xs font-mono px-2 py-1 rounded-md glass">{r.industry}</span>
                </td>
                <td className="py-3 pr-4 text-muted-foreground font-mono text-xs truncate max-w-[220px]">{r.gmail}</td>
                <td className="py-3 pr-4 font-bold text-[color:var(--neon)]">{formatINR(r.amount)}</td>
                <td className="py-3 min-w-[140px]">
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(r.amount / max) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${PURPLE}, ${RED})` }}
                    />
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
