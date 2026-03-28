import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 可用语言列表（从 languages.ts 中的 AVAILABLE_LANGUAGES 硬编码）
const AVAILABLE_LANGUAGES = [
    'br',  // Português (BR)
    'de',  // Deutsch
    'en',  // English
    'es',  // Español
    'fr',  // Français
    'ja',  // 日本語
    'ko',  // 한국어
    'pt',  // Português
    'ru',  // Русский
    'tw',  // 繁體中文
    'us',  // English (US)
    'zh'   // 中文
];

// 从语言文件夹中读取所有 JSON 文件并合并
function loadLanguageData(langDir) {
    const merged = {};
    if (!fs.existsSync(langDir)) {
        return merged;
    }
    const files = fs.readdirSync(langDir).filter(file => file.endsWith('.json'));
    for (const file of files) {
        const filePath = path.join(langDir, file);
        const fileName = path.basename(file, '.json');
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            // 移除 BOM (Byte Order Mark) 和其他不可见字符
            content = content.replace(/^\uFEFF/, '').trim();
            const fileData = JSON.parse(content);
            merged[fileName] = fileData;
        } catch (error) {
            console.error(`解析 JSON 文件失败: ${filePath}`, error.message);
            throw error;
        }
    }
    return merged;
}

// 获取所有键，使用文件名作为前缀
function getKeys(data, prefix = '') {
    const keys = {};
    for (const [k, v] of Object.entries(data)) {
        const fullPath = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            Object.assign(keys, getKeys(v, fullPath));
        } else {
            keys[fullPath] = v;
        }
    }
    return keys;
}

// 比较两个语言的数据
function compareJsonKeys(zhData, targetData) {
    const zhKeys = getKeys(zhData);
    const targetKeys = getKeys(targetData);
    const lossKeys = {};
    for (const [k, v] of Object.entries(zhKeys)) {
        // 如果 target 中没有这个键，或者 target 中的值是空字符串，且 zh 中的值不是空字符串
        if (v !== '' && (!targetKeys.hasOwnProperty(k) || targetKeys[k] === '')) {
            lossKeys[k] = {
                value: '',
                reference: v
            };
        }
    }
    const moreKeys = {};
    for (const [k, v] of Object.entries(targetKeys)) {
        // 如果 zh 中没有这个键，或者 zh 中的值是空字符串，且 target 中的值不是空字符串
        if (v !== '' && (!zhKeys.hasOwnProperty(k) || zhKeys[k] === '')) {
            moreKeys[k] = v;
        }
    }
    return {
        loss: lossKeys,
        more: moreKeys
    };
}


// 主函数
function main() {
    const zhDir = path.join(__dirname, '../../noolingo-core/locales/zh');
    const zhData = loadLanguageData(zhDir);
    const results = {};
    for (const lang of AVAILABLE_LANGUAGES) {
        if (lang === 'zh') continue;
        const langDir = path.join(__dirname, `../../noolingo-core/locales/${lang}`);
        if (!fs.existsSync(langDir)) continue;
        const langData = loadLanguageData(langDir);
        results[lang] = compareJsonKeys(zhData, langData);
    }
    const outputPath = path.join(__dirname, 'translation_diff.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`Diff file generated at: ${outputPath}`);
}
main();