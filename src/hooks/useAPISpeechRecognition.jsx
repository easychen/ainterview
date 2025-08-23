import { useState, useRef, useCallback } from 'react';
import { SpeechAPIClient, AudioRecorder } from '../../lib/speechClient.js';
import { APIConfigManager } from '../../lib/apiConfig.js';

/**
 * 基于API的语音识别Hook
 * 使用MediaRecorder录制音频，调用语音识别API进行转换
 */
export function useAPISpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLang, setCurrentLang] = useState('zh');
  
  const audioRecorderRef = useRef(null);
  const speechClientRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  
  // 初始化语音客户端
  const initializeSpeechClient = useCallback(() => {
    const speechConfig = APIConfigManager.loadSpeechConfig();
    if (speechConfig && speechConfig.enabled && speechConfig.apiKey) {
      speechClientRef.current = new SpeechAPIClient({
        apiKey: speechConfig.apiKey,
        baseUrl: speechConfig.baseUrl,
        model: speechConfig.model
      });
      return true;
    }
    return false;
  }, []);
  
  // 检查是否可以使用语音识别
  const isAvailable = useCallback(() => {
    // 检查浏览器支持
    if (!AudioRecorder.isSupported()) {
      return false;
    }
    // 检查API配置
    return initializeSpeechClient();
  }, [initializeSpeechClient]);
  
  // 开始录音和语音识别
  const startListening = useCallback(async () => {
    try {
      // 清除之前的状态
      setError(null);
      setTranscript('');
      
      // 检查浏览器支持
      if (!AudioRecorder.isSupported()) {
        setError('您的浏览器不支持语音录制功能，请使用Chrome、Firefox或Safari等现代浏览器');
        return;
      }
      
      // 检查配置
      if (!initializeSpeechClient()) {
        setError('语音识别API未配置，请在设置中配置语音识别API');
        return;
      }
      
      // 初始化录音器
      if (!audioRecorderRef.current) {
        audioRecorderRef.current = new AudioRecorder();
      }
      
      // 开始录音
      await audioRecorderRef.current.startRecording();
      setIsListening(true);
      
      // 移除自动停止功能，改为完全手动控制
      // 用户需要手动点击停止按钮来停止录音
      
    } catch (error) {
      console.error('开始语音识别失败:', error);
      setError(error.message);
      setIsListening(false);
    }
  }, [initializeSpeechClient]);
  
  // 停止录音并进行语音识别
  const stopListening = useCallback(async () => {
    try {
      if (!audioRecorderRef.current || !audioRecorderRef.current.getIsRecording()) {
        setIsListening(false);
        return;
      }
      
      setIsListening(false);
      setIsProcessing(true);
      
      // 清除可能存在的定时器
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      
      // 停止录音并获取音频数据
      const audioBlob = await audioRecorderRef.current.stopRecording();
      
      if (!audioBlob || audioBlob.size === 0) {
        setError('未录制到音频数据，请重试');
        setIsProcessing(false);
        return;
      }
      
      // 检查音频大小（太小可能是没有声音）
      if (audioBlob.size < 1000) { // 小于1KB
        setError('录音时间太短，请重试');
        setIsProcessing(false);
        return;
      }
      
      // 调用语音识别API
      if (speechClientRef.current) {
        const result = await speechClientRef.current.transcribe(audioBlob, {
          language: currentLang
        });
        
        // 处理不同的返回格式
        let transcriptText = '';
        if (typeof result === 'string') {
          transcriptText = result;
        } else if (result && typeof result === 'object' && result.text) {
          transcriptText = result.text;
        } else if (result && typeof result === 'object' && result.transcript) {
          transcriptText = result.transcript;
        }
        
        if (transcriptText && transcriptText.trim()) {
          setTranscript(transcriptText.trim());
        } else {
          setError('未识别到语音内容，请重试');
        }
      }
      
    } catch (error) {
      console.error('语音识别失败:', error);
      setError(`语音识别失败: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [currentLang]);
  
  // 清除转录文本
  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);
  
  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // 设置语言（保持兼容性，但默认中文）
  const switchLanguage = useCallback((lang) => {
    // 默认使用中文，保持方法以免破坏现有代码
    setCurrentLang('zh');
    setError(null);
  }, []);
  
  // 强制停止（清理资源）
  const forceStop = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cleanup();
    }
    
    setIsListening(false);
    setIsProcessing(false);
  }, []);
  
  return {
    isListening,
    transcript,
    error,
    isProcessing,
    isAvailable: isAvailable(),
    currentLang,
    startListening,
    stopListening,
    clearTranscript,
    clearError,
    switchLanguage,
    forceStop
  };
}