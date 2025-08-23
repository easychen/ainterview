import OpenAI from 'openai';
import prompts from './prompts.js';
import { getPrompt } from './functions.js';

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
  
  // 生成问题列表预览
  async generateQuestionListPreview(context) {
    const prompt = this.buildQuestionListPrompt(context);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一位资深的媒体人，专门为独立创作者进行深度访谈。你的问题遵循循序渐进的逻辑：从基础了解开始，逐步深入到具体细节和深层思考。问题自然流畅，避免突兀和刻意。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });
      
      return this.parseQuestionListResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // 构建问题列表预览提示词
  buildQuestionListPrompt(context) {
    const contextSummary = context.analysisResult?.summary || '无特定上下文';
    const keyTopics = context.analysisResult?.keyTopics?.join(', ') || '无特定主题';
    
    // 处理用户反馈信息
    let feedbackSection = '';
    if (context.previewQuestions && context.questionFeedback && Object.keys(context.questionFeedback).length > 0) {
      feedbackSection = `\n## 用户反馈信息\n上一轮问题的用户反馈：\n`;
      context.previewQuestions.forEach((q, index) => {
        const feedback = context.questionFeedback[index];
        if (feedback) {
          feedbackSection += `问题${index + 1}："${q.question}" - 用户认为：${feedback === 'good' ? '不错' : '不好'}\n`;
        }
      });
      feedbackSection += `\n请根据用户反馈优化问题质量，避免用户认为"不好"的问题类型，多生成用户认为"不错"的问题风格。\n`;
    }
    
    return `基于以下内容分析结果，生成一个循序渐进的访谈问题列表（5-8个问题）：

## 内容分析
内容摘要：${contextSummary}
关键主题：${keyTopics}${feedbackSection}

## 问题设计原则
1. **循序渐进**：从基础认知开始，逐步深入
   - 第1-2个问题：是什么？基础了解和背景介绍
   - 第3-4个问题：为什么？动机、原因和初心
   - 第5-6个问题：怎么做？具体过程和方法
   - 第7-8个问题：有何感悟？经验总结和未来展望

2. **自然流畅**：问题之间有逻辑关联，避免突兀
3. **有趣有用**：既能引出有趣的故事，又能提供实用价值
4. **避免刻意**：不要过分寻找戏剧性场景，保持自然对话感

请返回JSON格式的问题列表：
{
  "questions": [
    {
      "order": 1,
      "question": "问题内容",
      "category": "问题分类",
      "purpose": "问题目的说明"
    }
  ]
}`;
  }

  // 解析问题列表响应
  parseQuestionListResponse(response) {
    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      let parsed;
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }
      
      return parsed.questions || [];
    } catch (error) {
      console.warn('Failed to parse question list response as JSON:', error);
      // 解析失败时返回默认问题列表
      return [
        {
          order: 1,
          question: "能先简单介绍一下您的创作背景吗？",
          category: "背景了解",
          purpose: "建立基础认知"
        },
        {
          order: 2,
          question: "是什么让您开始这个创作项目的？",
          category: "创作动机",
          purpose: "了解初心和动机"
        },
        {
          order: 3,
          question: "在创作过程中，您的工作流程是怎样的？",
          category: "创作方法",
          purpose: "了解具体做法"
        },
        {
          order: 4,
          question: "创作过程中遇到过什么挑战吗？",
          category: "挑战应对",
          purpose: "挖掘问题解决经验"
        },
        {
          order: 5,
          question: "对于想要开始类似创作的人，您有什么建议？",
          category: "经验分享",
          purpose: "提供实用价值"
        }
      ];
    }
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
            content: '你是一位资深的媒体人，专门为独立创作者进行深度访谈。你擅长设计有故事性、富有层次的问题，能引出创作者的真实经历和深层思考。你的问题保持中立立场，既探讨成功经验，也不回避挑战和困难。'
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
  
  // 生成访谈稿（真正的流式输出，支持风格选择）
  async generateScriptStreamWithStyle(sessionData, style = 'default', onChunk) {
    const prompt = this.buildScriptPromptWithStyle(sessionData, style);
    
    try {
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPromptForStyle(style)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: this.getTemperatureForStyle(style),
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

  // 根据风格获取系统提示词
  getSystemPromptForStyle(style) {
    const stylePrompts = {
      'default': '你是一位专业的内容编辑，擅长将访谈对话转化为引人入胜的深度文章。你的写作风格亲和生动，文章结构清晰，不是简单的问答记录，而是流畅的叙述性文章，具有很强的可读性。',
      'qa': '你是一位专业的访谈编辑，专门整理和优化原始问答内容。你的任务是保持问答的原始形式，但要让内容更加清晰、流畅和易读。你不添加原访谈中没有的内容，只做必要的文字优化和逻辑整理。',
      'mimeng': '你是一位情感犀利的自媒体作者，擅长用咪蒙式的写作风格。你的文章情感充沛、节奏明快、直击痛点，能够在短时间内抓住读者注意力并引发共鸣。',
      'sspai': '你是一位专业的科技媒体编辑，擅长用少数派的风格来撰写深度文章。你的文章理性客观、逻辑清晰、实用性强，能够为读者提供有价值的信息和可行动的建议。',
      'portrait': '你是一位资深的人物传记作者，擅长用文学性的笔触来刻画人物的精神世界。你的文章富有诗意、细腻深刻，能够从个体经历中提炼普世的人生智慧。',
      'business': '你是一位资深的商业记者，擅长从商业角度解读创作者的成功路径。你的文章数据翻实、分析深入，能够为读者提供具体的商业经验和可复制的成功方法。'
    };
    return stylePrompts[style] || stylePrompts['default'];
  }

  // 根据风格获取温度参数
  getTemperatureForStyle(style) {
    const temperatures = {
      'default': 0.7,
      'qa': 0.3,        // 低温度，保持理性和一致性
      'mimeng': 0.9,    // 更加情感化、兴奋
      'emotional': 0.9, // 情感风格
      'sspai': 0.3,     // 更加理性、严谨
      'tech': 0.3,      // 科技风格
      'portrait': 0.8,  // 有一定创意性
      'literary': 0.8,  // 文学风格
      'business': 0.4   // 偏理性但保持一定灵活性
    };
    return temperatures[style] || temperatures['default'];
  }

  // 构建带风格的访谈稿生成提示词
  buildScriptPromptWithStyle(sessionData, style) {
    const qaContent = sessionData.questions?.map((q, i) => {
      const answer = sessionData.answers[q.id]?.content || '（未回答）';
      return `**问题${i + 1}：** ${q.content}\n\n**回答：** ${answer}\n`;
    }).join('\n') || '暂无问答内容';
    
    const contextSummary = sessionData.context?.analysisResult?.summary || '无特定背景';
    
    // 根据风格选择不同的提示词模板
    const styleTemplates = {
      'default': 'interview_article_generation',
      'qa': 'interview_article_qa',
      'mimeng': 'interview_article_mimeng',
      'emotional': 'interview_article_mimeng', // 情感风格使用同样模板
      'sspai': 'interview_article_sspai',
      'tech': 'interview_article_sspai',       // 科技风格使用同样模板
      'portrait': 'interview_article_portrait',
      'literary': 'interview_article_portrait', // 文学风格使用同样模板
      'business': 'interview_article_business'
    };
    
    const templateName = styleTemplates[style] || styleTemplates['default'];
    
    return getPrompt(templateName, {
      contextSummary: contextSummary,
      qaContent: qaContent
    });
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

请以JSON格式返回结果，格式如下：
{
  "summary": "内容摘要",
  "keyTopics": ["主题1", "主题2", "主题3"],
  "suggestedQuestions": ["问题1", "问题2", "问题3"]
}`;
  }
  
  // 构建问题生成提示词
  buildQuestionPrompt(context, history) {
    const contextSummary = context.analysisResult?.summary || '无特定上下文';
    const keyTopics = context.analysisResult?.keyTopics?.join(', ') || '无特定主题';
    const previousQA = history.questions?.map((q, i) => {
      const answer = history.answers[q.id]?.content || '未回答';
      return `第${i + 1}轮对话：\n问题：${q.content}\n回答：${answer}`;
    }).join('\n\n') || '暂无历史对话';
    
    // 使用新的专业提示词模板
    return getPrompt('creator_question_generation', {
      summary: contextSummary,
      keyTopics: keyTopics,
      previousQA: previousQA
    });
  }
  
  // 构建访谈稿生成提示词
  buildScriptPrompt(sessionData) {
    const qaContent = sessionData.questions?.map((q, i) => {
      const answer = sessionData.answers[q.id]?.content || '（未回答）';
      return `**问题${i + 1}：** ${q.content}\n\n**回答：** ${answer}\n`;
    }).join('\n') || '暂无问答内容';
    
    const contextSummary = sessionData.context?.analysisResult?.summary || '无特定背景';
    
    // 使用新的文章化模板
    return getPrompt('interview_article_generation', {
      contextSummary: contextSummary,
      qaContent: qaContent
    });
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
        ]
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
        intent: parsed.intent || '',
        tone: parsed.tone || 'exploratory',
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
        intent: '探索创作者的经历和想法',
        tone: 'exploratory',
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
          content: '你是一位资深的媒体人，专门为独立创作者进行深度访谈。你擅长设计有故事性、富有层次的问题，能引出创作者的真实经历和深层思考。你的问题保持中立立场，既探讨成功经验，也不回避挑战和困难。'
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
          content: '你是一位专业的内容编辑，擅长将访谈对话转化为引人入胜的深度文章。你的写作风格亲和生动，文章结构清晰，不是简单的问答记录，而是流畅的叙述性文章，具有很强的可读性。'
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