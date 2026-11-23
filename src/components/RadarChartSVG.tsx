import type { DimensionItem } from '../types/sartoria';

interface RadarChartSVGProps {
  dimensions: DimensionItem[];
}

export function RadarChartSVG({ dimensions }: RadarChartSVGProps) {
  const cx = 140;
  const cy = 128;
  const radius = 80;
  const count = dimensions.length || 6;

  const getPoint = (index: number, valueRatio: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius * valueRatio,
      y: cy + Math.sin(angle) * radius * valueRatio,
    };
  };

  const rings = [0.33, 0.66, 1];
  const dataPoints = dimensions
    .map((d, i) => {
      const pt = getPoint(i, Math.max(0.25, Math.min(1, d.score / 100)));
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox="0 0 280 256"
      width="100%"
      style={{ maxWidth: 260, display: 'block', margin: '0 auto' }}
      role="img"
      aria-label="六维定制审美雷达图"
    >
      {rings.map((r) => {
        const poly = Array.from({ length: count })
          .map((_, i) => {
            const pt = getPoint(i, r);
            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
          })
          .join(' ');
        return (
          <polygon
            key={r}
            points={poly}
            fill="none"
            stroke="rgba(17, 17, 17, 0.08)"
            strokeWidth="1"
          />
        );
      })}

      {dimensions.map((d, i) => {
        const edge = getPoint(i, 1);
        const labelPt = getPoint(i, 1.24);
        const dot = getPoint(i, d.score / 100);
        return (
          <g key={d.key}>
            <line
              x1={cx}
              y1={cy}
              x2={edge.x}
              y2={edge.y}
              stroke="rgba(17, 17, 17, 0.07)"
              strokeWidth="1"
            />
            <text
              x={labelPt.x}
              y={labelPt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#48484a"
              fontSize="10.5"
              fontWeight="500"
            >
              {d.label}
            </text>
            <text
              x={labelPt.x}
              y={labelPt.y + 13}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#86868b"
              fontSize="9.5"
              fontFamily="ui-monospace, monospace"
            >
              {d.score}
            </text>
            <circle cx={dot.x} cy={dot.y} r="3" fill="#111111" stroke="#ffffff" strokeWidth="1.2" />
          </g>
        );
      })}

      <polygon points={dataPoints} fill="rgba(17, 17, 17, 0.09)" stroke="#111111" strokeWidth="1.5" />
    </svg>
  );
}
