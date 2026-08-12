"use client";

import { motion } from "framer-motion";

interface PerformanceChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
  type?: "line" | "bar" | "area";
}

export default function PerformanceChart({
  data,
  labels = [],
  color = "#8b5cf6",
  height = 200,
  type = "area",
}: PerformanceChartProps) {
  const width = 600;
  const padding = 30;
  const max = Math.max(...data) * 1.1;
  const min = 0;
  const range = max - min || 1;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y, value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x},${padding + chartHeight} L ${points[0].x},${padding + chartHeight} Z`;

  const gradientId = `perf-${color.replace("#", "")}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((tick) => (
        <line
          key={tick}
          x1={padding}
          x2={width - padding}
          y1={padding + chartHeight * tick}
          y2={padding + chartHeight * tick}
          stroke="rgba(255,255,255,0.06)"
          strokeDasharray="4 4"
        />
      ))}

      {type === "bar" ? (
        points.map((p, i) => (
          <motion.rect
            key={i}
            x={p.x - chartWidth / data.length / 3}
            y={padding + chartHeight}
            width={chartWidth / data.length / 1.5}
            height={0}
            rx="4"
            fill={color}
            initial={{ height: 0, y: padding + chartHeight }}
            animate={{ height: padding + chartHeight - p.y, y: p.y }}
            transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
          />
        ))
      ) : (
        <>
          {(type === "area" || type === "line") && (
            <motion.path
              d={areaPath}
              fill={`url(#${gradientId})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            />
          )}
          <motion.path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </>
      )}

      {type !== "bar" &&
        points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={color}
            stroke="#0b0b0f"
            strokeWidth="2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.05 }}
          />
        ))}

      {labels.map((label, i) => {
        const p = points[Math.min(i, points.length - 1)];
        return (
          <text
            key={label}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="10"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
