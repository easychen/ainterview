import { useState, useEffect, useRef } from 'react';

/**
 * 语音识别自定义Hook
 * 封装了浏览器的Web Speech API，提供语音转文字功能
 */
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [currentLang, setCurrentLang] = useState('zh-CN');
  
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  
  // 检查浏览器是否支持语音识别
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      
      // 配置语音识别
      recognition.continuous = true; // 持续监听
      recognition.interimResults = true; // 返回中间结果
      recognition.maxAlternatives = 1;
      
      // 直接使用中文，不再支持语言切换
      try {
        recognition.lang = 'zh-CN';
        setCurrentLang('zh-CN');
      } catch (e) {
        // 如果中文不支持，使用默认语言
        const defaultLang = navigator.language || 'zh-CN';
        recognition.lang = defaultLang;
        setCurrentLang(defaultLang);
      }
      
      // 监听识别结果
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // 处理识别结果
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        // 更新转录文本
        setTranscript(finalTranscript + interimTranscript);
        
        // 如果有最终结果，更新转录文本（移除自动停止功能）
        if (finalTranscript) {
          // 移除自动停止功能，由用户手动控制
        }
      };
      
      // 监听开始事件
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        console.log('语音识别开始');
      };
      
      // 监听结束事件
      recognition.onend = () => {
        setIsListening(false);
        console.log('语音识别结束');
        
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      };
      
      // 监听错误事件
      recognition.onerror = (event) => {
        setError(event.error);
        setIsListening(false);
        console.error('语音识别错误:', event.error);
        
        // 处理不同类型的错误
        switch (event.error) {
          case 'no-speech':
            setError('未检测到语音，请重试');
            break;
          case 'audio-capture':
            setError('无法访问麦克风，请检查权限');
            break;
          case 'not-allowed':
            setError('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风');
            break;
          case 'network':
            setError('网络错误，请检查网络连接');
            break;
          case 'service-not-allowed':
            setError('语音识别服务不可用');
            break;
          case 'language-not-supported':
            setError('当前语言不支持，请使用键盘输入');
            break;
          case 'bad-grammar':
            setError('语法错误，请重试');
            break;
          default:
            setError(`语音识别出现错误（${event.error}），请重试`);
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    // 清理函数
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);
  
  // 开始监听
  const startListening = () => {
    if (!isSupported) {
      setError('您的浏览器不支持语音识别功能');
      return;
    }
    
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('启动语音识别失败:', error);
        setError('启动语音识别失败，请重试');
      }
    }
  };
  
  // 停止监听
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
  };
  
  // 清除转录文本
  const clearTranscript = () => {
    setTranscript('');
  };
  
  // 重置错误状态
  const clearError = () => {
    setError(null);
  };

  return {
    isListening,
    transcript,
    error,
    isSupported,
    currentLang,
    startListening,
    stopListening,
    clearTranscript,
    clearError
  };
}