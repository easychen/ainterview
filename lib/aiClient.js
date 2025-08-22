import OpenAI from 'openai';

export class AIAPIClient {
  constructor(config) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      dangerouslyAllowBrowser: true // 允许在浏览器中使用
    });
  }
  
  // 测试API连接
  static async testConnection(config) {
    const client = new AIAPIClient(config);
    try {
      const response = await client.client.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });
      
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error.message
      };
    }
  }
  
  // 内容分析
  async analyzeContent(sources) {
    const prompt = this.buildContentAnalysisPrompt(sources);
    
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的访谈助手，擅长分析内容并生成有深度的访谈问题。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });
    
    return this.parseAnalysisResponse(response);
  }
  
  // 生成访谈问题（真正的流式输出）
  async generateQuestionStream(context, history, onChunk) {
    const prompt = this.buildQuestionPrompt(context, history);
    
    try {
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个经验丰富的访谈主持人，能够根据上下文和对话历史生成有深度、有启发性的访谈问题。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.8,
        stream: true
      });
      
      let fullContent = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          if (onChunk) {
            // 每个字符间50ms延迟，创造打字机效果
            await new Promise(resolve => setTimeout(resolve, 50));
            onChunk(content, fullContent);
          }
        }
      }
      
      return this.parseQuestionResponse({ choices: [{ message: { content: fullContent } }] });
    } catch (error) {
      throw error;
    }
  }
  
  // 生成访谈稿（真正的流式输出）
  async generateScriptStream(sessionData, onChunk) {
    const prompt = this.buildScriptPrompt(sessionData);
    
    try {
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的文字编辑，擅长将问答内容整理成结构清晰、阅读流畅的访谈稿。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.5,
        stream: true
      });
      
      let fullContent = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          if (onChunk) {
            // 访谈稿生成速度快一些，20ms延迟
            await new Promise(resolve => setTimeout(resolve, 20));
            onChunk(content, fullContent);
          }
        }
      }
      
      return this.parseScriptResponse({ choices: [{ message: { content: fullContent } }] });
    } catch (error) {
      throw error;
    }
  }
  
  // 构建内容分析提示词
  buildContentAnalysisPrompt(sources) {
    const sourceTexts = sources.map((source, index) => 
      `## 内容${index + 1}（${source.type}）\n标题：${source.title || '无标题'}\n内容：${source.content}`
    ).join('\n\n');
    
    return `请分析以下内容，并为即将进行的访谈做准备：

${sourceTexts}

请提供：
1. 内容摘要（200字以内）
2. 关键主题和亮点（3-5个）
3. 建议的访谈问题方向（5-8个）
4. 访谈难度评估（初级/中级/高级）

请以JSON格式返回结果，格式如下：
{
  "summary": "内容摘要",
  "keyTopics": ["主题1", "主题2", "主题3"],
  "suggestedQuestions": ["问题1", "问题2", "问题3"],
  "difficulty": "intermediate"
}`;
  }
  
  // 构建问题生成提示词
  buildQuestionPrompt(context, history) {
    const contextSummary = context.analysisResult?.summary || '无特定上下文';
    const keyTopics = context.analysisResult?.keyTopics?.join(', ') || '无特定主题';
    const previousQA = history.questions?.map((q, i) => 
      `Q${i + 1}: ${q.content}\nA${i + 1}: ${history.answers[q.id]?.content || '未回答'}`
    ).join('\n\n') || '暂无历史对话';
    
    return `基于以下上下文和对话历史，生成下一个有深度的访谈问题：

## 访谈上下文
内容摘要：${contextSummary}
关键主题：${keyTopics}

## 已完成的问答
${previousQA}

请生成一个：
1. 有深度和启发性的问题
2. 与上下文相关但不重复之前的问题
3. 能够引出创作者独特见解的问题
4. 问题长度适中，容易理解

请以JSON格式返回：
{
  "question": "问题内容", 
  "category": "问题分类", 
  "isFollowUp": false,
  "explanation": "问题设计思路"
}`;
  }
  
  // 构建访谈稿生成提示词
  buildScriptPrompt(sessionData) {
    const qaContent = sessionData.questions?.map((q, i) => 
      `**${i + 1}. ${q.content}**\n\n${sessionData.answers[q.id]?.content || '（未回答）'}\n`
    ).join('\n') || '暂无问答内容';
    
    const contextSummary = sessionData.context?.analysisResult?.summary || '无特定背景';
    
    return `请将以下问答内容整理成一份专业的访谈稿：

## 访谈背景
${contextSummary}

## 问答内容
${qaContent}

请按以下要求整理：
1. 添加适当的标题和副标题
2. 保持问答的完整性和逻辑性
3. 适当润色语言，提高可读性
4. 保持访谈者的原意不变
5. 使用Markdown格式
6. 添加访谈日期和基本信息

请直接返回整理好的访谈稿内容，不需要JSON格式。`;
  }
  
  // 解析分析响应
  parseAnalysisResponse(response) {
    try {
      const content = response.choices[0].message.content;
      // 尝试提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch (error) {
      console.warn('Failed to parse analysis response as JSON:', error);
      // 如果JSON解析失败，返回基础结构
      const content = response.choices[0].message.content;
      return {
        summary: content.substring(0, 200) + '...',
        keyTopics: ['创作思路', '个人经历', '未来规划'],
        suggestedQuestions: [
          '请分享一下您的创作初衷',
          '您在创作过程中遇到的最大挑战是什么',
          '对于未来的创作方向，您有什么规划'
        ],
        difficulty: 'intermediate'
      };
    }
  }
  
  // 解析问题响应
  parseQuestionResponse(response) {
    try {
      const content = response.choices[0].message.content;
      // 尝试提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      let parsed;
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }
      
      return {
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: parsed.question,
        category: parsed.category || 'general',
        isFollowUp: parsed.isFollowUp || false,
        explanation: parsed.explanation || '',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Failed to parse question response as JSON:', error);
      // JSON解析失败时的fallback
      const content = response.choices[0].message.content;
      return {
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        category: 'general',
        isFollowUp: false,
        explanation: '',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // 解析访谈稿响应
  parseScriptResponse(response) {
    const content = response.choices[0].message.content;
    return {
      content,
      format: 'markdown',
      wordCount: content.split(/\s+/).length,
      estimatedReadTime: Math.ceil(content.split(/\s+/).length / 200),
      generatedAt: new Date().toISOString()
    };
  }
  
  // 兼容方法：生成问题（非流式）
  async generateQuestion(context, history) {
    const prompt = this.buildQuestionPrompt(context, history);
    
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: '你是一个经验丰富的访谈主持人，能够根据上下文和对话历史生成有深度、有启发性的访谈问题。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.8
    });
    
    return this.parseQuestionResponse(response);
  }
  
  // 兼容方法：生成访谈稿（非流式）
  async generateScript(sessionData) {
    const prompt = this.buildScriptPrompt(sessionData);
    
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文字编辑，擅长将问答内容整理成结构清晰、阅读流畅的访谈稿。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.5
    });
    
    return this.parseScriptResponse(response);
  }
  
  // 获取网页内容（简单实现）
  async fetchWebContent(url) {
    try {
      // 注意：由于CORS限制，直接从前端获取网页内容可能会失败
      // 这里提供一个基础框架，实际使用时可能需要后端代理
      const response = await fetch(url);
      const text = await response.text();
      
      // 简单的HTML解析，提取文本内容
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      // 移除脚本和样式
      const scripts = doc.querySelectorAll('script, style');
      scripts.forEach(el => el.remove());
      
      const title = doc.querySelector('title')?.textContent || '';
      const content = doc.body?.textContent || '';
      
      return {
        title: title.trim(),
        content: content.trim(),
        url
      };
    } catch (error) {
      throw new Error(`无法获取网页内容: ${error.message}`);
    }
  }
}