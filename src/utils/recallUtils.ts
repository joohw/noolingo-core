// @/utils/colorUtils.ts
// 颜色相关的工具函数


import { ColorLabel } from "../note/note_model";
import { Recall, getRecallMastery } from "../fsrs/recall";


export const getHeatmapColor = (intensity: number, baseColor: string): string => {
  const adjustedIntensity = intensity === 0
    ? 0.05
    : Math.max(0.2, Math.min(intensity * 0.7 + 0.1, 0.8)); // 20% - 80% 范围

  if (baseColor.startsWith('#')) {
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${adjustedIntensity})`;
  }
  return `hsla(30, 90%, 50%, ${adjustedIntensity})`;
};



// HSL 转 RGB 的辅助函数
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // 无色彩，灰色
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};


// 根据索引获取颜色（支持 HSL 和 RGB 格式）
export function getColorByIndex(
  hue: number,
  saturation: number,
  lightness: number,
  alpha: number = 1,
  format: 'hsl' | 'rgb' = 'hsl',
): string {
  if (format === 'rgb') {
    const [r, g, b] = hslToRgb(hue, saturation, lightness);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // 默认返回 HSL 格式
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}



export function getRecallColor(
  recall: Recall,
  retentionDays: number = 180,
  darkMode: boolean = false,
  archived: boolean = false,
  alpha: number = 1,
  format: 'hsl' | 'rgb' = 'hsl'
): string {
  const mastery = getRecallMastery(recall, retentionDays);
  // 根据深色模式设置合适的 lightness 值
  const lightness = darkMode ? 15 : 92;

  if (mastery >= 1 || archived) {
    const masteryHue = darkMode ? 150 : 145;
    const masterySaturation = darkMode ? 25 : 35;
    return getColorByIndex(masteryHue, masterySaturation, lightness, alpha, format);
  }

  if (mastery === 0) {
    // 灰色 - 新卡片
    return getColorByIndex(0, 0, lightness, alpha, format);
  }

  let hue: number;
  let saturation: number;

  if (darkMode) {
    if (mastery < 0.3) {
      hue = 350; // 柔和的粉红色调
      saturation = 25;
    } else if (mastery < 0.7) {
      hue = 35; // 柔和的暖灰色调
      saturation = 30;
    } else {
      hue = 195; // 柔和的灰蓝色调
      saturation = 28;
    }
  } else {
    if (mastery < 0.3) {
      hue = 0;
    } else if (mastery < 0.7) {
      hue = 35;
    } else {
      hue = 200;
    }
    saturation = 55 + (mastery * 5);
  }

  return getColorByIndex(hue, saturation, lightness, alpha, format);
}




export function getLabelColor(priority: ColorLabel, opacity: number = 1): string {
  switch (priority) {
    case ColorLabel.ORANGE:  // 4 -> 橙色
      return `rgba(249, 115, 22, ${opacity})`;   // orange-500
    case ColorLabel.PURPLE:  // 3 -> 紫色
      return `rgba(168, 85, 247, ${opacity})`;   // purple-500
    case ColorLabel.BLUE:    // 2 -> 蓝色
      return `rgba(59, 130, 246, ${opacity})`;   // blue-500
    case ColorLabel.GREEN:   // 1 -> 绿色
      return `rgba(34, 197, 94, ${opacity})`;    // green-500
    case ColorLabel.RED:     // 5 -> 红色
      return `rgba(244, 67, 54, ${opacity})`;    // red-500
    case ColorLabel.YELLOW:  // 6 -> 黄色
      return `rgba(255, 235, 59, ${opacity})`;   // yellow-500
    case ColorLabel.PINK:    // 7 -> 粉色
      return `rgba(233, 30, 99, ${opacity})`;    // pink-500
    case ColorLabel.CYAN:    // 8 -> 青色
      return `rgba(0, 188, 212, ${opacity})`;    // cyan-500
    case ColorLabel.TEAL:   // 9 -> 青绿色
      return `rgba(0, 150, 136, ${opacity})`;    // teal-500
    case ColorLabel.INDIGO: // 10 -> 靛蓝色
      return `rgba(63, 81, 181, ${opacity})`;    // indigo-500
    case ColorLabel.BROWN:   // 11 -> 棕色
      return `rgba(121, 85, 72, ${opacity})`;    // brown-500
    case ColorLabel.AMBER:   // 12 -> 琥珀色
      return `rgba(255, 193, 7, ${opacity})`;    // amber-500
    case ColorLabel.GRAY:    // 0 -> 灰色（默认）
    default:
      return `rgba(156, 163, 175, ${opacity})`;  // gray-400
  }
}