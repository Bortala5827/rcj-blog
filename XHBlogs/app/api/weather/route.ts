// app/api/weather/route.ts
// 免费天气数据源：Open-Meteo（https://open-meteo.com）
// 特点：完全免费、无需 API Key、无需注册、支持 CORS / 边缘运行时。
// 这里把 Open-Meteo 的 WMO 天气代码映射成前端 WeatherWidget 已有的
// 和风 V7 兼容结构 { code:"200", now:{ temp, text, icon } }。
import { NextResponse } from 'next/server';

export const runtime = 'edge';

// WMO Weather interpretation codes -> { 中文, 类QWeather图标码 }
// 图标码沿用前端 getWeatherIcon 的取值区间：100晴 / 101云 / 300雨 / 400雪
function mapWMO(code: number): { text: string; icon: string } {
  if (code === 0) return { text: '晴', icon: '100' };
  if (code === 1) return { text: '晴间多云', icon: '100' };
  if (code === 2) return { text: '多云', icon: '101' };
  if (code === 3) return { text: '阴', icon: '101' };
  if (code === 45 || code === 48) return { text: '雾', icon: '101' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { text: '小雨', icon: '300' };
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { text: '雪', icon: '400' };
  if (code >= 95) return { text: '雷阵雨', icon: '302' }; // 302 落在 300-399 -> 雨图标
  return { text: '未知', icon: '101' };
}

export async function GET() {
  // 位置可经环境变量覆盖；默认北京（中关村附近）
  const lat = process.env.WEATHER_LAT || '39.9042';
  const lon = process.env.WEATHER_LON || '116.4074';
  const city = process.env.WEATHER_CITY || '北京市';

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ code: '500', message: `Open-Meteo HTTP ${res.status}` }, { status: 500 });
    }
    const data = await res.json();
    const c = data?.current;
    if (!c) {
      return NextResponse.json({ code: '500', message: 'Open-Meteo 未返回 current 数据' }, { status: 500 });
    }

    const { text, icon } = mapWMO(Number(c.weather_code));
    return NextResponse.json({
      code: '200',
      now: {
        temp: Math.round(Number(c.temperature_2m)),
        text,
        icon,
        humidity: Number(c.relative_humidity_2m ?? 0),
        windSpeed: Number(c.wind_speed_10m ?? 0),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ code: '500', message: String(err?.message || err) }, { status: 500 });
  }
}
