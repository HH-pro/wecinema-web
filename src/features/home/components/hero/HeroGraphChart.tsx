"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  LineController,
  PointElement,
  Filler,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";

// Only the line-chart pieces the hero needs (no doughnut). Registration is
// idempotent, so this coexists with the full dashboard's registration.
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  LineController,
  PointElement,
  Filler,
  Tooltip,
  Legend,
);

/**
 * Thin chart.js renderer, kept in its own module so it can be code-split out of
 * the main bundle via `next/dynamic`. All data/option shaping happens upstream
 * in `HeroGraph` using the shared `chartData` helpers.
 */
export default function HeroGraphChart({
  data,
  options,
}: {
  data: ChartData<"line">;
  options: ChartOptions<"line">;
}) {
  return <Line data={data} options={options} />;
}
