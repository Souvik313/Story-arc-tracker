import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import "./SentimentChart.css";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getSentimentColor(value) {
  if (value >= 0.3) return "#16a34a";
  if (value <= -0.3) return "#dc2626";
  return "#64748b";
}

function CustomDot(props) {
  const { cx, cy, payload, index } = props;
  const color = getSentimentColor(payload.sentiment);
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="#ffffff"
      strokeWidth={2}
      style={{
        cursor: "pointer",
        filter: `drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))`,
      }}
      data-key={payload.key}
    />
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const color = getSentimentColor(data.sentiment);

  return (
    <div className="sentiment-tooltip">
      <p className="sentiment-tooltip-date">{formatDate(data.date)}</p>
      <p className="sentiment-tooltip-headline">{data.headline}</p>
      <p className="sentiment-tooltip-score" style={{ color }}>
        Sentiment: {data.sentiment >= 0 ? "+" : ""}
        {data.sentiment.toFixed(2)}
      </p>
    </div>
  );
}

export default function SentimentChart({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="sentiment-empty">
        No sentiment data available for this story.
      </div>
    );
  }

  // Sort by date and prepare chart data
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Count occurrences of each date to handle duplicates
  const dateCount = {};
  const dateIndex = {};

  sortedTimeline.forEach((event) => {
    dateCount[event.date] = (dateCount[event.date] || 0) + 1;
    dateIndex[event.date] = 0;
  });

  const processedChartData = sortedTimeline.map((event, index) => {
    const currentDateIndex = dateIndex[event.date];
    dateIndex[event.date]++;
    const totalForDate = dateCount[event.date];
    const formattedLabel = formatDate(event.date);

    const xValue =
      totalForDate > 1
        ? index + (currentDateIndex - (totalForDate - 1) / 2) * 0.001
        : index;

    return {
      date: event.date,
      headline: event.headline,
      sentiment: parseFloat(event.sentiment) || 0,
      label: formattedLabel,
      key: `${event.date}-${currentDateIndex}`,
      xValue, 
    };
  });

  // Find min/max sentiment for context labels
  const maxEvent = processedChartData.reduce((a, b) =>
    a.sentiment > b.sentiment ? a : b
  );
  const minEvent = processedChartData.reduce((a, b) =>
    a.sentiment < b.sentiment ? a : b
  );

  return (
    <div className="sentiment-wrapper">
      
      <div className="sentiment-summary">
        <div className="sentiment-pill sentiment-pill-positive">
          <span className="sentiment-pill-dot" />
          Most positive: {formatDate(maxEvent.date)}
        </div>
        <div className="sentiment-pill sentiment-pill-negative">
          <span className="sentiment-pill-dot sentiment-dot-negative" />
          Most negative: {formatDate(minEvent.date)}
        </div>
      </div>
      
      <div className="sentiment-chart-container">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={processedChartData}
            margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
            wrapperStyle={{ position: "relative" }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e4eaf2"
              vertical={false}
            />
            <XAxis
              type="number"
              dataKey="xValue"
              tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "sans-serif" }}
              tickFormatter={(value) => {
                const index = Math.round(value);
                return processedChartData[index]?.label || "";
              }}
              tickLine={false}
              axisLine={{ stroke: "#e4eaf2" }}
              domain={[0, processedChartData.length - 1]}
              interval={Math.floor(processedChartData.length / 5) || 0}
            />
            <YAxis
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "sans-serif" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 0 ? `+${v}` : `${v}`)}
              width={36}
            />
            <ReferenceLine
              y={0}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ strokeDasharray: "3 3", stroke: "#94a3b8" }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="sentiment"
              stroke="#1a4b8c"
              strokeWidth={2.5}
              dot={<CustomDot />}
              activeDot={{ r: 7, fill: "#1a4b8c", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="sentiment-y-labels">
        <span className="sentiment-y-positive">Positive coverage</span>
        <span className="sentiment-y-neutral">Neutral</span>
        <span className="sentiment-y-negative">Negative coverage</span>
      </div>
    </div>
  );
}