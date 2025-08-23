import { create } from 'zustand';
import { APIConfigManager } from '../../lib/apiConfig.js';
import { AIAPIClient } from '../../lib/aiClient.js';

// 初始化时自动加载保存的配置
const initializeConfig = () => {
  const config = APIConfigManager.loadConfig();
  if (config && config.apiKey) {
    return {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.siliconflow.cn/v1',
      model: config.model || 'qwen/Qwen2.5-7B-Instruct',
      // 如果配置存在就认为已配置，即使尚未验证
      isConfigured: true,
      isValidating: false,
      lastValidated: config.lastValidated,
      error: config.isValid === false ? '配置需要重新验证' : null,
    };
  }
  return {
    apiKey: null,
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'qwen/Qwen2.5-7B-Instruct',
    isConfigured: false,
    isValidating: false,
    lastValidated: null,
    error: null,
  };
};

export const useInterviewStore = create((set, get) => ({
  // API配置状态
  apiState: initializeConfig(),
  
  // 访谈流程状态
  interviewState: {
    currentStep: initializeConfig().isConfigured ? 'content-input' : 'api-config',
    sessionId: null,
    createdAt: null,
  },
  
  // 内容分析状态
  contentState: {
    sources: [], // 网址和文档列表
    analysisResult: null, // AI分析结果
    previewQuestions: [], // 问题预览列表
    questionFeedback: {}, // 问题反馈 {questionIndex: 'good'|'bad'}
    isAnalyzing: false,
    error: null,
  },
  
  // 访谈会话状态
  sessionState: {
    questions: [], // AI生成的问题列表
    answers: {}, // 用户回答记录
    currentQuestionIndex: 0,
    isGeneratingQuestion: false,
    isComplete: false,
    error: null,
    streamingQuestion: null, // 流式生成中的问题内容
  },
  
  // 访谈结果状态
  resultState: {
    interviewScripts: {}, // 多个风格的访谈稿: { style: script }
    currentStyle: 'default', // 当前选中的风格
    exportFormat: 'pdf', // markdown | pdf | docx
    isGenerating: false,
    error: null,
    streamingScript: null, // 流式生成中的访谈稿内容
  },
  
  // Actions
  updateApiState: (updates) => set((state) => ({
    apiState: { ...state.apiState, ...updates }
  })),
  
  // 验证API配置
  validateApiConfig: async (config) => {
    set((state) => ({ 
      apiState: { ...state.apiState, isValidating: true, error: null } 
    }));
    
    try {
      const isValid = await APIConfigManager.validateConfig(config);
      if (isValid) {
        set((state) => ({
          apiState: {
            ...state.apiState,
            ...config,
            isValidating: false,
            isConfigured: true,
            lastValidated: new Date().toISOString()
          },
          interviewState: {
            ...state.interviewState,
            currentStep: 'content-input'
          }
        }));
      } else {
        set((state) => ({
          apiState: {
            ...state.apiState,
            isValidating: false,
            error: 'API配置验证失败，请检查API密钥和URL'
          }
        }));
      }
      return isValid;
    } catch (error) {
      set((state) => ({
        apiState: {
          ...state.apiState,
          isValidating: false,
          error: error.message
        }
      }));
      throw error;
    }
  },
  
  // 加载已保存的API配置
  loadApiConfig: () => {
    const config = APIConfigManager.loadConfig();
    if (config && config.apiKey) {
      set((state) => ({
        apiState: {
          ...state.apiState,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
          // 如果配置存在就认为已配置，即使尚未验证
          isConfigured: true,
          lastValidated: config.lastValidated,
          error: config.isValid === false ? '配置需要重新验证' : null
        }
      }));
      return true;
    }
    return false;
  },
  
  // 清除API配置
  clearApiConfig: () => {
    APIConfigManager.clearConfig();
    set((state) => ({
      apiState: {
        apiKey: null,
        baseUrl: 'https://api.siliconflow.cn/v1',
        model: 'qwen/Qwen2.5-7B-Instruct',
        isConfigured: false,
        isValidating: false,
        lastValidated: null,
        error: null,
      },
      interviewState: {
        ...state.interviewState,
        currentStep: 'api-config'
      }
    }));
  },
  
  // 更新访谈流程状态
  updateInterviewState: (updates) => {
    console.log('updateInterviewState 被调用:', updates);
    
    set((state) => ({
      interviewState: { ...state.interviewState, ...updates }
    }));
    
    // 访谈状态变化时保存数据
    setTimeout(() => get().saveSessionData(), 100);
    
    console.log('状态更新完成');
  },

  // 更新内容状态
  updateContentState: (updates) => set((state) => ({
    contentState: { ...state.contentState, ...updates }
  })),

  // 记录问题反馈
  setQuestionFeedback: (questionIndex, feedback) => {
    set((state) => ({
      contentState: {
        ...state.contentState,
        questionFeedback: {
          ...state.contentState.questionFeedback,
          [questionIndex]: feedback
        }
      }
    }));
    // 用户反馈时保存数据
    setTimeout(() => get().saveSessionData(), 100);
  },
  
  // 添加内容源
  addContentSource: (source) => {
    set((state) => ({
      contentState: {
        ...state.contentState,
        sources: [...state.contentState.sources, { 
          ...source, 
          id: `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          addedAt: new Date().toISOString()
        }]
      }
    }));
    // 用户添加内容源时保存数据
    setTimeout(() => get().saveSessionData(), 100);
  },
  
  // 删除内容源
  removeContentSource: (sourceId) => {
    set((state) => ({
      contentState: {
        ...state.contentState,
        sources: state.contentState.sources.filter(s => s.id !== sourceId)
      }
    }));
    // 用户删除内容源时保存数据
    setTimeout(() => get().saveSessionData(), 100);
  },
  
  // 分析内容
  analyzeContent: async () => {
    const { apiState, contentState } = get();
    
    if (!apiState.isConfigured || contentState.sources.length === 0) {
      throw new Error('API未配置或没有内容源');
    }
    
    set((state) => ({
      contentState: { ...state.contentState, isAnalyzing: true, error: null }
    }));
    
    try {
      const client = new AIAPIClient(apiState);
      const analysisResult = await client.analyzeContent(contentState.sources);
      
      set((state) => ({
        contentState: {
          ...state.contentState,
          isAnalyzing: false,
          analysisResult
        }
      }));
      
      // 内容分析完成时保存数据
      setTimeout(() => get().saveSessionData(), 100);
      
      return analysisResult;
    } catch (error) {
      set((state) => ({
        contentState: {
          ...state.contentState,
          isAnalyzing: false,
          error: error.message
        }
      }));
      throw error;
    }
  },
  
  // 生成问题列表预览
  generateQuestionListPreview: async () => {
    const { apiState, contentState } = get();
    
    if (!apiState.isConfigured || !contentState.analysisResult) {
      throw new Error('API未配置或内容未分析');
    }
    
    try {
      const client = new AIAPIClient(apiState);
      const questionList = await client.generateQuestionListPreview(contentState);
      
      // 保存预览问题到全局状态
      set((state) => ({
        contentState: {
          ...state.contentState,
          previewQuestions: questionList || []
        }
      }));
      
      // 自动保存数据
      setTimeout(() => get().saveSessionData(), 100);
      
      return questionList;
    } catch (error) {
      throw error;
    }
  },

  // 生成问题（流式）
  generateQuestionStream: async () => {
    const { apiState, contentState, sessionState } = get();
    
    if (!apiState.isConfigured) {
      throw new Error('API未配置');
    }
    
    set((state) => ({
      sessionState: { ...state.sessionState, isGeneratingQuestion: true, error: null }
    }));
    
    try {
      const client = new AIAPIClient(apiState);
      let streamingContent = '';
      
      const question = await client.generateQuestionStream(
        contentState, 
        sessionState,
        (chunk, fullContent) => {
          // 更新流式内容
          streamingContent = fullContent;
          set((state) => ({
            sessionState: {
              ...state.sessionState,
              streamingQuestion: streamingContent
            }
          }));
        }
      );
      
      set((state) => ({
        sessionState: {
          ...state.sessionState,
          isGeneratingQuestion: false,
          questions: [...state.sessionState.questions, question],
          streamingQuestion: null
        }
      }));
      
      // 自动保存数据
      get().saveSessionData();
      
      return question;
    } catch (error) {
      set((state) => ({
        sessionState: {
          ...state.sessionState,
          isGeneratingQuestion: false,
          error: error.message,
          streamingQuestion: null
        }
      }));
      throw error;
    }
  },
  
  // 保存回答（自动保存数据）
  saveAnswer: (questionId, answer) => {
    set((state) => ({
      sessionState: {
        ...state.sessionState,
        answers: {
          ...state.sessionState.answers,
          [questionId]: {
            content: answer,
            timestamp: new Date().toISOString()
          }
        }
      }
    }));
    get().saveSessionData();
  },
  
  // 移动到下一个问题
  nextQuestion: () => set((state) => ({
    sessionState: {
      ...state.sessionState,
      currentQuestionIndex: state.sessionState.currentQuestionIndex + 1
    }
  })),
  
  // 结束访谈
  completeInterview: () => {
    set((state) => ({
      sessionState: {
        ...state.sessionState,
        isComplete: true
      },
      interviewState: {
        ...state.interviewState,
        currentStep: 'completed'
      }
    }));
    // 完成访谈时保存数据
    setTimeout(() => get().saveSessionData(), 100);
  },
  
  // 切换访谈风格
  switchInterviewStyle: async (style) => {
    const { resultState } = get();
    
    // 如果该风格已生成，直接切换
    if (resultState.interviewScripts[style]) {
      set((state) => ({
        resultState: {
          ...state.resultState,
          currentStyle: style,
          interviewScript: resultState.interviewScripts[style]
        }
      }));
      return resultState.interviewScripts[style];
    }
    
    // 如果未生成，自动生成该风格的访谈稿
    return await get().generateInterviewScriptWithStyle(style);
  },

  // 生成访谈稿（流式，支持风格选择）
  generateInterviewScriptWithStyle: async (style = 'default') => {
    const { apiState, contentState, sessionState } = get();
    
    if (!apiState.isConfigured) {
      throw new Error('API未配置');
    }
    
    set((state) => ({
      resultState: { ...state.resultState, isGenerating: true, error: null }
    }));
    
    try {
      const client = new AIAPIClient(apiState);
      const sessionData = {
        context: contentState,
        questions: sessionState.questions,
        answers: sessionState.answers
      };
      
      let streamingContent = '';
      
      const script = await client.generateScriptStreamWithStyle(
        sessionData,
        style,
        (chunk, fullContent) => {
          // 更新流式内容
          streamingContent = fullContent;
          set((state) => ({
            resultState: {
              ...state.resultState,
              streamingScript: {
                content: streamingContent,
                style: style,
                format: 'markdown',
                wordCount: streamingContent.split(/\s+/).length,
                estimatedReadTime: Math.ceil(streamingContent.split(/\s+/).length / 200),
                generatedAt: new Date().toISOString()
              }
            }
          }));
        }
      );
      
      set((state) => ({
        resultState: {
          ...state.resultState,
          isGenerating: false,
          interviewScripts: {
            ...state.resultState.interviewScripts,
            [style]: { ...script, style: style }
          },
          currentStyle: style,
          interviewScript: { ...script, style: style }, // 保持兼容性
          streamingScript: null
        }
      }));
      
      // 自动保存数据
      get().saveSessionData();
      
      return script;
    } catch (error) {
      set((state) => ({
        resultState: {
          ...state.resultState,
          isGenerating: false,
          error: error.message,
          streamingScript: null
        }
      }));
      throw error;
    }
  },

  // 生成访谈稿（流式）
  generateInterviewScriptStream: async () => {
    const { apiState, contentState, sessionState } = get();
    
    if (!apiState.isConfigured) {
      throw new Error('API未配置');
    }
    
    set((state) => ({
      resultState: { ...state.resultState, isGenerating: true, error: null }
    }));
    
    try {
      const client = new AIAPIClient(apiState);
      const sessionData = {
        context: contentState,
        questions: sessionState.questions,
        answers: sessionState.answers
      };
      
      let streamingContent = '';
      
      const script = await client.generateScriptStream(
        sessionData,
        (chunk, fullContent) => {
          // 更新流式内容
          streamingContent = fullContent;
          set((state) => ({
            resultState: {
              ...state.resultState,
              streamingScript: {
                content: streamingContent,
                format: 'pdf',
                wordCount: streamingContent.split(/\s+/).length,
                estimatedReadTime: Math.ceil(streamingContent.split(/\s+/).length / 200),
                generatedAt: new Date().toISOString()
              }
            }
          }));
        }
      );
      
      set((state) => ({
        resultState: {
          ...state.resultState,
          isGenerating: false,
          interviewScript: script,
          streamingScript: null
        }
      }));
      
      // 自动保存数据
      get().saveSessionData();
      
      return script;
    } catch (error) {
      set((state) => ({
        resultState: {
          ...state.resultState,
          isGenerating: false,
          error: error.message,
          streamingScript: null
        }
      }));
      throw error;
    }
  },
  
  // 重置访谈（同时清除持久化数据）
  resetInterview: () => {
    get().clearSessionData();
    set((state) => ({
      interviewState: {
        currentStep: 'content-input',
        sessionId: null,
        createdAt: null,
      },
      contentState: {
        sources: [],
        analysisResult: null,
        previewQuestions: [],
        isAnalyzing: false,
        error: null,
      },
      sessionState: {
        questions: [],
        answers: {},
        currentQuestionIndex: 0,
        isGeneratingQuestion: false,
        isComplete: false,
        error: null,
        streamingQuestion: null,
      },
      resultState: {
        interviewScripts: {},
        currentStyle: 'default',
        exportFormat: 'pdf',
        isGenerating: false,
        error: null,
        streamingScript: null,
      }
    }));
  },
  
  // 更新状态的通用方法（暂时禁用自动保存）
  updateContentState: (updates) => {
    set((state) => ({
      contentState: { ...state.contentState, ...updates }
    }));
    // 暂时禁用自动保存
    // get().saveSessionData();
  },
  
  updateSessionState: (updates) => {
    set((state) => ({
      sessionState: { ...state.sessionState, ...updates }
    }));
    // 暂时禁用自动保存
    // get().saveSessionData();
  },
  
  updateResultState: (updates) => {
    set((state) => ({
      resultState: { ...state.resultState, ...updates }
    }));
    // 暂时禁用自动保存
    // get().saveSessionData();
  },

  // 生成问题（原始方法，保持兼容性）
  generateQuestion: async () => {
    const { apiState, contentState, sessionState } = get();
    
    if (!apiState.isConfigured) {
      throw new Error('API未配置');
    }
    
    set((state) => ({
      sessionState: { ...state.sessionState, isGeneratingQuestion: true, error: null }
    }));
    
    try {
      const client = new AIAPIClient(apiState);
      const question = await client.generateQuestion(contentState, sessionState);
      
      set((state) => ({
        sessionState: {
          ...state.sessionState,
          isGeneratingQuestion: false,
          questions: [...state.sessionState.questions, question]
        }
      }));
      
      // 自动保存数据
      get().saveSessionData();
      
      return question;
    } catch (error) {
      set((state) => ({
        sessionState: {
          ...state.sessionState,
          isGeneratingQuestion: false,
          error: error.message
        }
      }));
      throw error;
    }
  },
  
  // 生成访谈稿（原始方法，保持兼容性）
  generateInterviewScript: async () => {
    const { apiState, contentState, sessionState } = get();
    
    if (!apiState.isConfigured) {
      throw new Error('API未配置');
    }
    
    set((state) => ({
      resultState: { ...state.resultState, isGenerating: true, error: null }
    }));
    
    try {
      const client = new AIAPIClient(apiState);
      const sessionData = {
        context: contentState,
        questions: sessionState.questions,
        answers: sessionState.answers
      };
      
      const script = await client.generateScript(sessionData);
      
      set((state) => ({
        resultState: {
          ...state.resultState,
          isGenerating: false,
          interviewScript: script
        }
      }));
      
      // 自动保存数据
      get().saveSessionData();
      
      return script;
    } catch (error) {
      set((state) => ({
        resultState: {
          ...state.resultState,
          isGenerating: false,
          error: error.message
        }
      }));
      throw error;
    }
  },
  
  // 数据持久化方法
  saveSessionData: () => {
    const { interviewState, contentState, sessionState, resultState } = get();
    // 只保存会话相关数据，不保存API配置（API配置有独立的持久化机制）
    const sessionData = {
      interviewState,
      contentState,
      sessionState,
      resultState,
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem('interview_session_data', JSON.stringify(sessionData));
    } catch (error) {
      console.error('保存会话数据失败:', error);
    }
  },
  
  loadSessionData: () => {
    try {
      const savedData = localStorage.getItem('interview_session_data');
      if (savedData) {
        const sessionData = JSON.parse(savedData);
        const { interviewState, contentState, sessionState, resultState } = sessionData;
        
        // 恢复会话数据，但不影响API配置状态（API配置有自己的持久化机制）
        set((state) => ({
          interviewState: { ...state.interviewState, ...interviewState },
          contentState: { ...state.contentState, ...contentState },
          sessionState: { ...state.sessionState, ...sessionState },
          resultState: { ...state.resultState, ...resultState }
          // 注意：不更新 apiState
        }));
        
        return true;
      }
    } catch (error) {
      console.error('加载会话数据失败:', error);
    }
    return false;
  },
  
  clearSessionData: () => {
    try {
      localStorage.removeItem('interview_session_data');
    } catch (error) {
      console.error('清除会话数据失败:', error);
    }
  },
}));