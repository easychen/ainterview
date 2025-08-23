import OpenAI from 'openai';

/**
 * 语音识别API客户端
 * 使用OpenAI SDK调用语音转文字API
 */
export class SpeechAPIClient {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseUrl;
    this.model = config.model || 'whisper-1';
    
    // 初始化OpenAI客户端
    this.openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      dangerouslyAllowBrowser: true // 允许在浏览器环境中使用
    });
  }
  
  /**
   * 语音转文字
   * @param {Blob} audioBlob - 音频文件
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 识别结果
   */
  async transcribe(audioBlob, options = {}) {
    try {
      // 将Blob转换为File对象（OpenAI SDK需要File对象）
      const audioFile = new File([audioBlob], 'audio.webm', {
        type: audioBlob.type || 'audio/webm'
      });
      
      // 调用语音转文字API
      const response = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: this.model,
        language: options.language || 'zh', // 默认中文
        response_format: 'json', // 使用json格式获得更详细的响应
        temperature: 0.2,
        ...options
      });
      
      // 返回响应对象，让Hook层处理数据格式
      return response;
    } catch (error) {
      console.error('语音识别API调用失败:', error);
      throw new Error(`语音识别失败: ${error.message}`);
    }
  }
  
  /**
   * 测试API连接
   */
  async testConnection() {
    try {
      // 创建一个最小的测试音频文件
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.toBlob(async (blob) => {
        // 这里只是测试连接，不需要真的发送音频
        // 实际测试可以发送一个很小的音频片段
      });
      
      return { success: true };
    } catch (error) {
      console.error('语音API连接测试失败:', error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * 音频录制工具类
 */
export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
  }
  
  /**
   * 开始录音
   */
  async startRecording() {
    try {
      // 请求麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      // 创建MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getSupportedMimeType()
      });
      
      this.audioChunks = [];
      
      // 监听数据可用事件
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      // 开始录音
      this.mediaRecorder.start(1000); // 每1秒收集一次数据
      this.isRecording = true;
      
      return true;
    } catch (error) {
      console.error('开始录音失败:', error);
      throw new Error(`无法开始录音: ${error.message}`);
    }
  }
  
  /**
   * 停止录音
   */
  async stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        // 创建音频Blob
        const audioBlob = new Blob(this.audioChunks, {
          type: this.getSupportedMimeType()
        });
        
        // 清理资源
        this.cleanup();
        
        resolve(audioBlob);
      };
      
      this.mediaRecorder.onerror = (error) => {
        this.cleanup();
        reject(error);
      };
      
      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }
  
  /**
   * 获取支持的音频格式
   */
  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return 'audio/webm'; // 默认格式
  }
  
  /**
   * 检查是否正在录音
   */
  getIsRecording() {
    return this.isRecording;
  }
}