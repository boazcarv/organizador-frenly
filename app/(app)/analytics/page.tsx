"use client";

import { Download } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { MetricCard } from "@/components/charts/metric-card";
import { Segmented } from "@/components/ui/segmented";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDate } from "@/lib/format";
import { useAnalytics } from "@/lib/queries";
import type { AnalyticsPeriod } from "@/lib/types";

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

const periodOptions: { value: AnalyticsPeriod; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("month");

  // The window is resolved server-side, so the cards, the chart and the CSV
  // always describe exactly the same stretch of time.
  const { data, isPending } = useAnalytics(period);

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
    const header = ["data", "entregas", "periodo_anterior", "media_7d"];
    const rows = data.throughput.map((point) => [
      formatShortDate(point.date),
      String(point.current),
      String(point.previous),
      String(point.average),
    ]);

    // Semicolons and a BOM: what Excel in pt-BR expects when opening a CSV.
    const csv = [header, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `frenly-entregas-${period}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado", { description: `frenly-entregas-${period}.csv` });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Analytics" subtitle="Horas, entregas e capacidade do time, calculados a partir do que foi registrado.">
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
          <MetricCard key={metric.key} metric={metric} value={metric.value} spark={metric.spark} delay={index * 0.06} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <AreaThroughput data={data.throughput} />
        <DonutBreakdown slices={data.donut} />
      </div>

      <WorkloadBars
        data={data.workload}
        onSeeAll={() =>
          toast("Capacidade do time", { description: "A visão detalhada por pessoa chega em breve." })
        }
      />
    </div>
  );
}
