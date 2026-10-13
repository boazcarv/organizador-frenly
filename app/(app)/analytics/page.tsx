"use client";

import { Download } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MetricCard } from "@/components/charts/metric-card";
import { Segmented } from "@/components/ui/segmented";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDate } from "@/lib/format";
import { useAnalytics } from "@/lib/queries";
import type { Metric } from "@/lib/types";

const AreaThroughput = dynamic(
  () => import("@/components/charts/area-throughput").then((module) => module.AreaThroughput),
  { ssr: false, loading: () => <Skeleton className="h-[420px] rounded-[20px]" /> },
);

const DonutBreakdown = dynamic(
  () => import("@/components/charts/donut-breakdown").then((module) => module.DonutBreakdown),
  { ssr: false, loading: () => <Skeleton className="h-[340px] rounded-[20px]" /> },
);

const WorkloadBars = dynamic(
  () => import("@/components/charts/workload-bars").then((module) => module.WorkloadBars),
  { ssr: false, loading: () => <Skeleton className="h-[300px] rounded-[20px]" /> },
);

type Period = "today" | "week" | "month";

const periodOptions: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

/** Period scaling: month is the baseline the mock data is authored in. */
function scaleFor(period: Period) {
  if (period === "today") return 1 / 30;
  if (period === "week") return 1 / 4.33;
  return 1;
}

function sparkFor(spark: number[], period: Period) {
  if (period === "month") return spark;
  if (period === "week") return spark.slice(-7);
  return spark.slice(-4);
}

function deltaFor(metric: Metric, period: Period) {
  if (period === "month") return metric.delta;
  const damping = period === "week" ? 0.72 : 0.5;
  return Number((metric.delta * damping).toFixed(4));
}

export default function AnalyticsPage() {
  const { data, isPending } = useAnalytics();
  const [period, setPeriod] = useState<Period>("month");

  const scale = scaleFor(period);

  const throughputForPeriod = useMemo(() => {
    if (!data) return [];
    if (period === "month") return data.throughput;
    const size = period === "week" ? 7 : 3;
    return data.throughput
      .slice(-size)
      .map((point) => ({ ...point, current: Math.max(0, Math.round(point.current * 0.42)) }));
  }, [data, period]);

  if (isPending || !data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-52 rounded-full" />
            <Skeleton className="h-3.5 w-72 rounded-full" />
          </div>
          <Skeleton className="h-9 w-64 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[196px] rounded-[20px]" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Skeleton className="h-[420px] rounded-[20px]" />
          <Skeleton className="h-[420px] rounded-[20px]" />
        </div>
        <Skeleton className="h-[320px] rounded-[20px]" />
      </div>
    );
  }

  const exportCsv = () => {
    const header = ["data", "entregas", "anterior", "media_7d"];
    const rows = data.throughput.map((point) => [
      formatShortDate(point.date),
      String(point.current),
      String(point.previous),
      String(point.average),
    ]);
    const csv = [header, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `frenly-throughput-${period}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado", { description: `frenly-throughput-${period}.csv` });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Analytics"
        subtitle="Horas, entregas e capacidade do time — atualizado a cada 15 minutos."
      >
        <Segmented
          aria-label="Período de análise"
          options={periodOptions}
          value={period}
          onChange={setPeriod}
        />
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-[13px] font-medium text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
        >
          <Download className="size-4" aria-hidden />
          Exportar CSV
        </button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric, index) => (
          <MetricCard
            key={metric.key}
            metric={{ ...metric, delta: deltaFor(metric, period) }}
            value={
              metric.format === "percent"
                ? Math.min(100, Math.round(metric.value * (period === "month" ? 1 : 1)))
                : Math.max(0, Math.round(metric.value * scale))
            }
            spark={sparkFor(metric.spark, period)}
            delay={index * 0.06}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <AreaThroughput data={throughputForPeriod} />
        <DonutBreakdown slices={data.donut} />
      </div>

      <WorkloadBars
        data={data.workload}
        onSeeAll={() =>
          toast("Capacidade do time", { description: "Abrindo a visão detalhada por pessoa (demo)." })
        }
      />
    </div>
  );
}
