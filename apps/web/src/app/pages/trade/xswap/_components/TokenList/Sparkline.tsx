import React from 'react';

import { Area, AreaChart, YAxis } from 'recharts';

export default function Sparkline({ data }: { data: any }) {
  if (!data) return null;

  const symbol = data[0].symbol;
  const color = data[0].price > data[data.length - 1].price ? '#fb6a6a' : '#2ca9b7';

  return (
    <AreaChart width={150} height={40} data={data}>
      <defs>
        <linearGradient id={`gradientSpark-${symbol}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.75} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area dataKey="price" type="monotone" stroke={color} fill={`url(#gradientSpark-${symbol}`} strokeWidth={2} />
      <YAxis dataKey="price" axisLine={false} tickLine={false} tick={false} width={0} domain={['auto', 'auto']} />
    </AreaChart>
  );
}
