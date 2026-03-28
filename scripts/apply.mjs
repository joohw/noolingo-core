import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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


// 保存语言数据到文件
function saveLanguageData(langDir, data) {
    if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
    }
    for (const [fileName, fileData] of Object.entries(data)) {
        const filePath = path.join(langDir, `${fileName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2) + '\n', 'utf8');
    }
}


// 设置嵌套值
function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    for (const key of keys) {
        if (!current[key]) {
            current[key] = {};
        }
        current = current[key];
    }
    current[lastKey] = value;
}


// 删除嵌套值
function removeNestedValue(obj, path) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    // 遍历到倒数第二层
    for (const key of keys) {
        if (!current[key]) return; // 如果路径不存在，直接返回
        current = current[key];
    }
    // 删除最后一个键
    delete current[lastKey];
    // 清理空对象（可选）
    if (Object.keys(current).length === 0 && keys.length > 0) {
        removeNestedValue(obj, keys.join('.'));
    }
}


// 应用翻译差异
function applyTranslations(targetData, translations) {
    const newData = _.cloneDeep(targetData);
    // 处理 more 对象中的多余键（需要删除的键）
    if (translations.more) {
        for (const fullPath of Object.keys(translations.more)) {
            const parts = fullPath.split('.');
            const fileName = parts[0];
            const restPath = parts.slice(1).join('.');
            if (newData[fileName] && restPath) {
                try {
                    removeNestedValue(newData[fileName], restPath);
                } catch (error) {
                    console.error(`删除路径失败 ${fullPath}:`, error.message);
                }
            }
        }
    }
    // 处理 loss 对象中的缺失键（需要添加的键）
    if (translations.loss) {
        for (const [fullPath, { value, reference }] of Object.entries(translations.loss)) {
            const parts = fullPath.split('.');
            const fileName = parts[0];
            const restPath = parts.slice(1).join('.');
            if (!newData[fileName]) {
                newData[fileName] = {};
            }
            // 如果 value 为空，直接使用空字符串，不添加 TODO
            const finalValue = value || '';
            try {
                setNestedValue(newData[fileName], restPath, finalValue);
            } catch (error) {
                console.error(`设置路径失败 ${fullPath}:`, error.message);
            }
        }
    }
    return newData;
}


// 主函数
function main() {
    const diffPath = path.join(__dirname, 'translation_diff.json');
    if (!fs.existsSync(diffPath)) {
        console.error('translation_diff.json not found. Please run i18n:diff first.');
        process.exit(1);
    }
    let content = fs.readFileSync(diffPath, 'utf8');
    // 移除 BOM
    content = content.replace(/^\uFEFF/, '').trim();
    const diffData = JSON.parse(content);
    for (const [lang, translations] of Object.entries(diffData)) {
        const langDir = path.join(__dirname, `../../noolingo-core/locales/${lang}`);
        if (!fs.existsSync(langDir)) {
            console.error(`Language directory not found: ${langDir}`);
            continue;
        }
        const langData = loadLanguageData(langDir);
        const updatedData = applyTranslations(langData, translations);
        saveLanguageData(langDir, updatedData);
        console.log(`Updated translations applied to ${lang}/`);
    }
    fs.unlinkSync(diffPath);
    console.log('Diff file removed');
}

main();
