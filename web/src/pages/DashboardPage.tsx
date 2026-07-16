import { type ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { resources } from "../lib/resources";
import {
  DashboardFunnelItem,
  DashboardStackDemandItem,
  DashboardSummary,
  DashboardTimelineItem,
  Stage,
  stages,
} from "../lib/types";
import { formatDate, humanize } from "../utils";

const chartInk = "var(--ink)";
const chartMuted = "var(--muted)";
const chartQuiet = "var(--quiet)";
const chartLine = "rgba(166, 173, 184, 0.18)";
const chartPrimary = "var(--chart-2)";
const chartCoral = "var(--chart-3)";

const forwardStages: Stage[] = ["POSTULADO", "ENTREVISTA", "PRUEBA_TECNICA", "OFERTA"];
const rangeOptions = [14, 30, 60] as const;

type TooltipRow = {
  name?: string;
  value?: number | string;
  dataKey?: string;
  payload?: unknown;
};

type DashboardTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: TooltipRow[];
};

type LabelProps = {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: number | string;
  payload?: unknown;
};

function toNumber(value: number | string | undefined) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function stageLabel(stage: Stage) {
  return humanize(stage);
}

function tooltipLabel(label: string | number | undefined) {
  if (!label) {
    return null;
  }

  const text = String(label);
  if (stages.includes(text as Stage)) {
    return stageLabel(text as Stage);
  }

  return /^\d{4}-\d{2}-\d{2}/.test(text) ? formatDate(text) : text;
}

function DashboardTooltip({ active, label, payload }: DashboardTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const formattedLabel = tooltipLabel(label);

  return (
    <div className="chart-tooltip">
      {formattedLabel ? <strong>{formattedLabel}</strong> : null}
      {payload.map((item) => (
        <span key={`${item.dataKey ?? item.name}-${item.value}`}>
          {item.name ?? item.dataKey}: <b>{item.value}</b>
        </span>
      ))}
    </div>
  );
}

function ChartState({ children }: { children: ReactNode }) {
  return <div className="chart-state">{children}</div>;
}

function ChartPanel({
  title,
  eyebrow,
  loading,
  empty,
  children,
}: {
  title: string;
  eyebrow: string;
  loading?: boolean;
  empty?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="panel chart-panel" aria-label={title}>
      <header className="chart-header">
        <div>
          <p className="placeholder-kicker">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </header>
      {loading ? <ChartState>Loading dashboard data...</ChartState> : empty ? <ChartState>No data yet.</ChartState> : children}
    </section>
  );
}

function KpiTiles({ summary, loading }: { summary?: DashboardSummary; loading: boolean }) {
  const tiles = [
    { label: "Open vacancies", value: summary?.openVacancies },
    { label: "Total candidates", value: summary?.totalCandidates },
    { label: "Active applications", value: summary?.activeApplications },
    {
      label: "Offers this month",
      value: summary?.offersThisMonth,
      subline: `${formatCount(summary?.rejectedThisMonth ?? 0)} rejected this month`,
    },
    {
      label: "Avg score active",
      value: summary?.avgScoreActive === null || summary?.avgScoreActive === undefined ? "--" : Math.round(summary.avgScoreActive),
    },
  ];

  return (
    <section className="kpi-grid" aria-label="Dashboard summary">
      {tiles.map((tile) => (
        <article className="panel kpi-tile" key={tile.label}>
          <span>{tile.label}</span>
          <strong>{loading ? "--" : typeof tile.value === "number" ? formatCount(tile.value) : tile.value ?? "--"}</strong>
          {tile.subline ? <small>{loading ? "-- rejected this month" : tile.subline}</small> : null}
        </article>
      ))}
    </section>
  );
}

function TimelineChart({
  data,
  loading,
  days,
  onDaysChange,
}: {
  data: DashboardTimelineItem[];
  loading: boolean;
  days: number;
  onDaysChange: (days: (typeof rangeOptions)[number]) => void;
}) {
  const hasOffers = data.some((item) => item.offers > 0);

  return (
    <section className="panel chart-panel chart-panel-wide" aria-label="Applications timeline">
      <header className="chart-header">
        <div>
          <p className="placeholder-kicker">Timeline</p>
          <h2>Applications per day</h2>
        </div>
        <div className="range-toggle" aria-label="Timeline range">
          {rangeOptions.map((option) => (
            <button
              className={`toggle-chip ${days === option ? "is-selected" : ""}`}
              key={option}
              onClick={() => onDaysChange(option)}
              type="button"
            >
              {option}d
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <ChartState>Loading dashboard data...</ChartState>
      ) : data.length === 0 ? (
        <ChartState>No applications in this range.</ChartState>
      ) : (
        <>
          <div className="chart-frame chart-frame-tall">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={data} margin={{ top: 10, right: 18, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="applicationsFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={chartPrimary} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={chartPrimary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartLine} vertical={false} />
                <XAxis
                  dataKey="date"
                  minTickGap={24}
                  stroke={chartQuiet}
                  tick={{ fill: chartMuted, fontSize: 12 }}
                  tickFormatter={formatDate}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  stroke={chartQuiet}
                  tick={{ fill: chartMuted, fontSize: 12 }}
                  tickLine={false}
                  width={34}
                />
                <Tooltip content={<DashboardTooltip />} cursor={{ stroke: chartMuted, strokeDasharray: "3 3" }} />
                <Area
                  activeDot={{ r: 4, fill: chartPrimary, stroke: chartInk }}
                  dataKey="applications"
                  fill="url(#applicationsFill)"
                  name="Applications"
                  stroke={chartPrimary}
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {hasOffers ? (
            <div className="offers-strip">
              <span>Offers</span>
              <div className="chart-frame chart-frame-small">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={chartLine} vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis allowDecimals={false} axisLine={false} tick={{ fill: chartMuted, fontSize: 11 }} tickLine={false} width={28} />
                    <Tooltip content={<DashboardTooltip />} cursor={{ stroke: chartMuted, strokeDasharray: "3 3" }} />
                    <Area dataKey="offers" fill="rgba(172, 132, 51, 0.08)" name="Offers" stroke={chartMuted} strokeWidth={2} type="monotone" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function FunnelEndLabel(props: LabelProps) {
  const x = toNumber(props.x);
  const y = toNumber(props.y);
  const width = toNumber(props.width);
  const height = toNumber(props.height);
  const payload = props.payload as DashboardFunnelItem | undefined;

  if (!payload) {
    return null;
  }

  return (
    <text className="chart-label" dominantBaseline="middle" fill={chartMuted} fontSize={12} x={x + width + 10} y={y + height / 2}>
      {formatCount(payload.count)} / {formatPercent(payload.conversionPct)}
    </text>
  );
}

function FunnelChart({ data, loading }: { data: DashboardFunnelItem[]; loading: boolean }) {
  const forwardData = forwardStages.map((stage) => data.find((item) => item.stage === stage) ?? { stage, count: 0, conversionPct: 0 });

  return (
    <ChartPanel eyebrow="Funnel" empty={forwardData.every((item) => item.count === 0)} loading={loading} title="Forward stages">
      <div className="chart-frame">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart barCategoryGap={2} data={forwardData} layout="vertical" margin={{ top: 4, right: 86, bottom: 0, left: 12 }}>
            <CartesianGrid horizontal={false} stroke={chartLine} />
            <XAxis allowDecimals={false} hide type="number" />
            <YAxis
              axisLine={false}
              dataKey="stage"
              stroke={chartQuiet}
              tick={{ fill: chartMuted, fontSize: 12 }}
              tickFormatter={(value: Stage) => stageLabel(value)}
              tickLine={false}
              type="category"
              width={112}
            />
            <Tooltip content={<DashboardTooltip />} cursor={{ fill: "rgba(166, 173, 184, 0.08)" }} />
            <Bar dataKey="count" fill={chartPrimary} name="Applications" radius={[0, 4, 4, 0]}>
              <LabelList content={<FunnelEndLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  );
}

function DemandLabel(props: LabelProps) {
  const x = toNumber(props.x);
  const y = toNumber(props.y);
  const width = toNumber(props.width);
  const height = toNumber(props.height);

  return (
    <text className="chart-label" dominantBaseline="middle" fill={chartMuted} fontSize={12} x={x + width + 8} y={y + height / 2}>
      {formatCount(toNumber(props.value))}
    </text>
  );
}

function DemandBars({
  data,
  metric,
  name,
}: {
  data: DashboardStackDemandItem[];
  metric: "openVacancies" | "activeApplications";
  name: string;
}) {
  return (
    <div className="demand-column">
      <span>{name}</span>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 2, right: 42, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={chartLine} />
          <XAxis allowDecimals={false} hide type="number" />
          <YAxis
            axisLine={false}
            dataKey="stack"
            stroke={chartQuiet}
            tick={{ fill: chartMuted, fontSize: 12 }}
            tickLine={false}
            type="category"
            width={62}
          />
          <Tooltip content={<DashboardTooltip />} cursor={{ fill: "rgba(166, 173, 184, 0.08)" }} />
          <Bar dataKey={metric} fill={chartPrimary} name={name} radius={[0, 4, 4, 0]}>
            <LabelList content={<DemandLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StackDemandChart({ data, loading }: { data: DashboardStackDemandItem[]; loading: boolean }) {
  return (
    <ChartPanel eyebrow="Demand" empty={data.length === 0} loading={loading} title="Stack demand">
      <div className="demand-legend" aria-label="Stack demand legend">
        <span>
          <i /> Open vacancies
        </span>
        <span>
          <i /> Active applications
        </span>
      </div>
      <div className="demand-grid">
        <DemandBars data={data} metric="openVacancies" name="Open vacancies" />
        <DemandBars data={data} metric="activeApplications" name="Active applications" />
      </div>
    </ChartPanel>
  );
}

function StageDistributionLabel(props: LabelProps) {
  const x = toNumber(props.x);
  const y = toNumber(props.y);
  const width = toNumber(props.width);
  const height = toNumber(props.height);

  return (
    <text className="chart-label" dominantBaseline="middle" fill={chartMuted} fontSize={12} x={x + width + 8} y={y + height / 2}>
      {formatCount(toNumber(props.value))}
    </text>
  );
}

function StageDistributionChart({ summary, loading }: { summary?: DashboardSummary; loading: boolean }) {
  const data = stages.map((stage) => ({
    stage,
    count: summary?.applicationsByStage[stage] ?? 0,
  }));

  return (
    <ChartPanel eyebrow="Distribution" empty={data.every((item) => item.count === 0)} loading={loading} title="Applications by stage">
      <div className="chart-frame chart-frame-compact">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart barCategoryGap={2} data={data} layout="vertical" margin={{ top: 4, right: 46, bottom: 0, left: 12 }}>
            <CartesianGrid horizontal={false} stroke={chartLine} />
            <XAxis allowDecimals={false} hide type="number" />
            <YAxis
              axisLine={false}
              dataKey="stage"
              stroke={chartQuiet}
              tick={{ fill: chartMuted, fontSize: 12 }}
              tickFormatter={(value: Stage) => stageLabel(value)}
              tickLine={false}
              type="category"
              width={112}
            />
            <Tooltip content={<DashboardTooltip />} cursor={{ fill: "rgba(166, 173, 184, 0.08)" }} />
            <Bar dataKey="count" name="Applications" radius={[0, 4, 4, 0]}>
              {data.map((item) => (
                <Cell fill={item.stage === "RECHAZADO" ? chartCoral : chartPrimary} key={item.stage} />
              ))}
              <LabelList content={<StageDistributionLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  );
}

export function DashboardPage() {
  const [days, setDays] = useState<(typeof rangeOptions)[number]>(30);
  const summary = useQuery({ queryKey: ["dashboard", "summary"], queryFn: resources.dashboard.summary });
  const funnel = useQuery({ queryKey: ["dashboard", "funnel"], queryFn: resources.dashboard.funnel });
  const stackDemand = useQuery({ queryKey: ["dashboard", "stack-demand"], queryFn: resources.dashboard.stackDemand });
  const timeline = useQuery({
    queryKey: ["dashboard", "timeline", days],
    queryFn: () => resources.dashboard.timeline(days),
  });

  const orderedStackDemand = useMemo(
    () => [...(stackDemand.data ?? [])].sort((left, right) => left.stack.localeCompare(right.stack)),
    [stackDemand.data],
  );

  return (
    <section className="module-page dashboard-page" aria-labelledby="dashboard-title">
      <header className="page-header">
        <div>
          <p className="placeholder-kicker">Metrics</p>
          <h1 id="dashboard-title">Dashboard</h1>
        </div>
        <span className="chip">Live API</span>
      </header>

      <KpiTiles loading={summary.isLoading} summary={summary.data} />

      <div className="dashboard-grid">
        <TimelineChart data={timeline.data ?? []} days={days} loading={timeline.isLoading} onDaysChange={setDays} />
        <FunnelChart data={funnel.data ?? []} loading={funnel.isLoading} />
        <StackDemandChart data={orderedStackDemand} loading={stackDemand.isLoading} />
        <StageDistributionChart loading={summary.isLoading} summary={summary.data} />
      </div>
    </section>
  );
}
