import Api2d from 'api2d';
import prompts from './prompts.js';

export function hello() {
    console.log('Hello World!');
}

export async function genImage(text, style = '') {
    if (!text) return false;
    if (!style) style = 'cinematic';

    const payload = {
        "text_prompts": [
            { "text": text, "weight": 1 }
        ],
        "style_preset": style,
        "samples": 1,
    }

    // 注意：这个功能需要API密钥，在前端实际使用时需要配置
    const api = new Api2d(
        process.env.API2d_KEY || '', 
        process.env.API2d_ENDPOINT || '', 
        60 * 5 * 1000
    );
    
    try {
        const result = await api.request({
            path: '/sd/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return result;
    } catch (error) {
        console.error('Image generation failed:', error);
        return false;
    }
}

export async function chat(message, onMessage = null, onEnd = null) {
    // 注意：这个功能需要API密钥，在前端实际使用时需要配置
    const api = new Api2d(
        process.env.OPENAI_API_KEY || '', 
        process.env.OPENAI_API_ENDPOINT || '', 
        60 * 5 * 1000
    );
    
    try {
        const response = await api.completion({
            messages: [{ "role": "user", "content": message }],
            stream: true,
            model: process.env.OPENAI_API_MODEL || "gpt-4-32k",
            onMessage: onMessage,
            onEnd: onEnd,
            noCache: true,
        });
        return response;
    } catch (error) {
        console.error('Chat failed:', error);
        throw error;
    }
}

export async function gen(text, callback = (message, char) => console.log(char), tag = null) {
    try {
        const content = await chat(text, callback);
        const jsonString = extractJSON(content, tag);
        const obj = jsonString ? JSON.parse(jsonString) : null;
        return {
            content,
            json: obj,
        };
    } catch (error) {
        console.error('Generation failed:', error);
        return {
            content: '',
            json: null,
        };
    }
}

export function getPrompt(key, data) {
    const template = prompts[key];
    if (!template) {
        throw new Error(`Prompt template '${key}' not found`);
    }
    
    // 从template中提取`{{...}}`形式的变量
    const matches = template.matchAll(/{{(.*?)}}/g);
    // 将变量替换为data中的值
    let result = template;
    for (const match of matches) {
        const [placeholder, dataKey] = match;
        result = result.replace(placeholder, data[dataKey] || '');
    }
    return result;
}

export function extractJSON(dialogue, tag = null) {
    if (tag) {
        // 提取 <tag>...</tag> 中间的内容
        const reg = new RegExp(`<${tag}>(.*?)</${tag}>`, 'gs');
        const match = reg.exec(` ${dialogue} `);
        const match_1 = match && match[1] ? match[1] : null;
        return JSON.stringify({ [tag]: match_1 });
    } else {
        const reg = /^.+?(\{.+\}).*?$/gs;
        const match = reg.exec(` ${dialogue} `);
        const match_1 = match && match[1] ? match[1] : null;
        if (match_1 && canJsonParse(match_1)) return match_1;
        
        // 然后匹配 []
        const reg2 = /^.+?(\[.+\]).*?$/gs;
        const match2 = reg2.exec(` ${dialogue} `);
        const match2_1 = match2 && match2[1] ? match2[1] : null;
        if (match2_1 && canJsonParse(match2_1)) return match2_1;
        return false;
    }
}

function canJsonParse(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        console.log('JSON parse error:', str, e);
        return false;
    }
}

// 简单的Web内容获取功能（使用浏览器原生fetch）
export async function fetchWebContent(url, options = {}) {
    try {
        const { timeout = 10000 } = options;
        
        // 创建AbortController用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
            signal: controller.signal,
            ...options
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        
        // 简单的HTML内容提取（在实际项目中可能需要更复杂的处理）
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        
        // 移除脚本和样式
        const scripts = doc.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        
        const title = doc.querySelector('title')?.textContent || '';
        const content = doc.body?.textContent || '';
        
        return {
            title: title.trim(),
            content: content.trim().substring(0, 3000), // 限制长度
            url
        };
    } catch (error) {
        console.error('Fetch web content failed:', error);
        return null;
    }
}