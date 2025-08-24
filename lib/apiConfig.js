import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'ai-interview-tool-secret-key';
const CONFIG_STORAGE_KEY = 'ai_interview_api_config';
const SPEECH_CONFIG_STORAGE_KEY = 'ai_interview_speech_config';

export class APIConfigManager {
  // 保存API配置（加密存储）
  static saveConfig(config) {
    const encryptedConfig = {
      apiKey: CryptoJS.AES.encrypt(config.apiKey, ENCRYPTION_KEY).toString(),
      baseUrl: config.baseUrl,
      model: config.model,
      createdAt: new Date().toISOString(),
      isValid: false
    };
    
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(encryptedConfig));
    return encryptedConfig;
  }
  
  // 加载API配置（解密）
  static loadConfig() {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!stored) return null;
    
    try {
      const config = JSON.parse(stored);
      const decryptedApiKey = CryptoJS.AES.decrypt(config.apiKey, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      
      return {
        ...config,
        apiKey: decryptedApiKey
      };
    } catch (error) {
      console.error('Failed to load API config:', error);
      return null;
    }
  }
  
  // 验证API配置
  static async validateConfig(config) {
    try {
      const { AIAPIClient } = await import('./aiClient.js');
      const testResponse = await AIAPIClient.testConnection(config);
      
      if (testResponse.success) {
        // 更新配置为已验证
        const storedConfig = this.loadConfig();
        if (storedConfig) {
          storedConfig.isValid = true;
          storedConfig.lastValidated = new Date().toISOString();
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({
            ...storedConfig,
            apiKey: CryptoJS.AES.encrypt(config.apiKey, ENCRYPTION_KEY).toString()
          }));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('API validation failed:', error);
      return false;
    }
  }
  
  // 清除配置
  static clearConfig() {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  }
  
  // 检查配置是否存在且有效
  static hasValidConfig() {
    const config = this.loadConfig();
    return config && config.isValid && config.apiKey && config.baseUrl;
  }
  
  // 获取默认配置
  static getDefaultConfig() {
    return {
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'qwen/Qwen2.5-7B-Instruct',
      apiKey: '',
      maxTokens: 2000,
      temperature: 0.7
    };
  }
  
  // 保存语音API配置（加密存储）
  static saveSpeechConfig(config) {
    const encryptedConfig = {
      enabled: config.enabled,
      apiKey: config.enabled && config.apiKey ? CryptoJS.AES.encrypt(config.apiKey, ENCRYPTION_KEY).toString() : '',
      baseUrl: config.baseUrl,
      model: config.model,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(SPEECH_CONFIG_STORAGE_KEY, JSON.stringify(encryptedConfig));
    return encryptedConfig;
  }
  
  // 加载语音API配置（解密）
  static loadSpeechConfig() {
    const stored = localStorage.getItem(SPEECH_CONFIG_STORAGE_KEY);
    if (!stored) {
      return {
        enabled: false,
        apiKey: '',
        baseUrl: 'https://api.siliconflow.cn/v1',
        model: 'FunAudioLLM/SenseVoiceSmall'
      };
    }
    
    try {
      const config = JSON.parse(stored);
      let decryptedApiKey = '';
      
      if (config.enabled && config.apiKey) {
        decryptedApiKey = CryptoJS.AES.decrypt(config.apiKey, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      }
      
      return {
        enabled: config.enabled || false,
        apiKey: decryptedApiKey,
        baseUrl: config.baseUrl || 'https://api.siliconflow.cn/v1',
        model: config.model || 'FunAudioLLM/SenseVoiceSmall'
      };
    } catch (error) {
      console.error('Failed to load speech config:', error);
      return {
        enabled: false,
        apiKey: '',
        baseUrl: 'https://api.siliconflow.cn/v1',
        model: 'FunAudioLLM/SenseVoiceSmall'
      };
    }
  }
  
  // 清除语音配置
  static clearSpeechConfig() {
    localStorage.removeItem(SPEECH_CONFIG_STORAGE_KEY);
  }
  
  // 检查语音配置是否存在且有效
  static hasValidSpeechConfig() {
    const config = this.loadSpeechConfig();
    return config && config.enabled && config.apiKey && config.baseUrl;
  }

  // 生成预设配置字符串（用于分享）
  static generatePresetConfig() {
    const apiConfig = this.loadConfig();
    const speechConfig = this.loadSpeechConfig();
    
    if (!apiConfig || !apiConfig.apiKey) {
      throw new Error('未找到有效的API配置');
    }
    
    const presetData = {
      api: {
        apiKey: apiConfig.apiKey,
        baseUrl: apiConfig.baseUrl,
        model: apiConfig.model
      },
      speech: {
        enabled: speechConfig.enabled,
        apiKey: speechConfig.apiKey,
        baseUrl: speechConfig.baseUrl,
        model: speechConfig.model
      },
      timestamp: new Date().toISOString()
    };
    
    // 先JSON序列化，再Base64编码
    const jsonString = JSON.stringify(presetData);
    const base64String = btoa(unescape(encodeURIComponent(jsonString)));
    
    return base64String;
  }
  
  // 解析预设配置字符串
  static parsePresetConfig(presetString) {
    try {
      // Base64解码，再JSON解析
      const jsonString = decodeURIComponent(escape(atob(presetString)));
      const presetData = JSON.parse(jsonString);
      
      // 验证配置结构
      if (!presetData.api || !presetData.api.apiKey || !presetData.api.baseUrl) {
        throw new Error('预设配置格式无效：缺少必要的API配置');
      }
      
      return presetData;
    } catch (error) {
      console.error('解析预设配置失败:', error);
      throw new Error('预设配置格式无效，无法解析');
    }
  }
  
  // 应用预设配置
  static applyPresetConfig(presetData) {
    try {
      // 保存API配置
      if (presetData.api) {
        const apiConfig = {
          apiKey: presetData.api.apiKey,
          baseUrl: presetData.api.baseUrl || 'https://api.siliconflow.cn/v1',
          model: presetData.api.model || 'qwen/Qwen2.5-7B-Instruct'
        };
        this.saveConfig(apiConfig);
      }
      
      // 保存语音配置
      if (presetData.speech) {
        const speechConfig = {
          enabled: presetData.speech.enabled || false,
          apiKey: presetData.speech.apiKey || '',
          baseUrl: presetData.speech.baseUrl || 'https://api.siliconflow.cn/v1',
          model: presetData.speech.model || 'FunAudioLLM/SenseVoiceSmall'
        };
        this.saveSpeechConfig(speechConfig);
      }
      
      return true;
    } catch (error) {
      console.error('应用预设配置失败:', error);
      throw error;
    }
  }
}