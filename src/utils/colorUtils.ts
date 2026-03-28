// @/core/utils/colorUtils.ts
// 颜色转换工具函数


import { HSLColor } from '../constants/themeDefinitions';
import { ColorLabel } from '../note/note_model';
import { Recall, getRecallMastery } from '../fsrs/recall';


// 将 HSL 转换为十六进制颜色
export function hslToHex(hsl: HSLColor): string {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
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
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}


// 将 HSL 转换为 CSS HSL 字符串（用于 CSS 变量）
export function hslToCssString(hsl: HSLColor): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}


// 将十六进制颜色转换为 HSL
export function hexToHsl(hex: string): HSLColor {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
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







export function getRecallColor(recall: Recall, retentionDays: number = 180, darkMode: boolean = false, archived: boolean = false, alpha: number = 1): string {
  const mastery = getRecallMastery(recall, retentionDays);
  // 根据深色模式设置合适的 lightness 值
  const lightness = darkMode ? 15 : 92;
  if (mastery >= 1 || archived) {
    const masteryHue = darkMode ? 150 : 145;
    const masterySaturation = darkMode ? 25 : 35;
    return `hsla(${masteryHue}, ${masterySaturation}%, ${lightness}%, ${alpha})`;
  }
  if (mastery === 0) {
    return `hsla(0, 0%, ${lightness}%, ${alpha})`; // 灰色 - 新卡片
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
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

