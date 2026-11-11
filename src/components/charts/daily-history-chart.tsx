"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export interface DailyHistoryPoint {
  date: string;
  tempMaxC: number | null;
  tempMinC: number | null;
  precipitationMm: number | null;
}

export function DailyHistoryChart({ days }: { days: DailyHistoryPoint[] }) {
  const maxRain = days.reduce((max, day) => Math.max(max, day.precipitationMm ?? 0), 0);

  if (days.length === 0) {
    return (
      <div className="h-[320px] flex items-center justify-center text-xs font-mono text-slate-400 text-center px-6">
        No historical daily values were returned. Nothing synthetic is drawn.
      </div>
    );
  }

  return (
    <div className="h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#24364B" opacity={0.5} />
          <XAxis
            dataKey="date"
            stroke="#94A3B8"
            fontSize={10}
            fontFamily="monospace"
            tickFormatter={(value: string) => value.slice(5)}
            interval={4}
          />
          <YAxis yAxisId="temp" stroke="#22D3EE" fontSize={10} fontFamily="monospace" domain={["auto", "auto"]} />
          <YAxis
            yAxisId="rain"
            orientation="right"
            stroke="#3B82F6"
            fontSize={10}
            fontFamily="monospace"
            domain={[0, Math.max(5, Math.ceil(maxRain))]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0B1728",
              borderColor: "#24364B",
              borderRadius: "8px",
              fontSize: "11px",
              fontFamily: "monospace",
              color: "#F8FAFC",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace", paddingTop: "8px" }} />
          <Bar yAxisId="rain" dataKey="precipitationMm" name="Rainfall (mm)" fill="#3B82F6" radius={[3, 3, 0, 0]} />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="tempMaxC"
            name="Max temp (°C)"
            stroke="#22D3EE"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="tempMinC"
            name="Min temp (°C)"
            stroke="#94A3B8"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
