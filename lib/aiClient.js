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
      'emotional': '你是一位情感犀利的自媒体作者，擅长情感风格的写作。你的文章情感充沛、节奏明快、直击痛点，能够在短时间内抓住读者注意力并引发强烈共鸣。用大白话说出扎心真话，制造情感跌宕起伏。',
      'tech': '你是一位专业的科技媒体编辑，擅长科技风格的深度文章。你的文章理性客观、逻辑清晰、实用性强，能够为读者提供有价值的信息和可行动的建议。重点挖掘工具和方法论。',
      'literary': '你是一位资深的人物传记作者，擅长用文学性的笔触来刻画人物的精神世界。你的文章富有诗意、细腻深刻，能够从个体经历中提炼普世的人生智慧。注重心理描摹和细节刻画。',
      'business': '你是一位资深的商业记者，擅长从商业角度解读创作者的成功路径。你的文章数据驱动、分析深入，能够为读者提供具体的商业经验和可复制的成功方法。突出商业敏锐度和策略思维。'
    };
    return stylePrompts[style] || stylePrompts['default'];
  }

  // 生成访谈稿提纲
  async generateInterviewOutline(sessionData, style = 'default') {
    const prompt = this.buildOutlinePrompt(sessionData, style);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的内容策划师，擅长为访谈稿设计结构清晰、层次分明的文章提纲。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.5
      });
      
      return this.parseOutlineResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // 生成访谈稿提纲（流式）
  async generateInterviewOutlineStream(sessionData, style = 'default', onChunk) {
    const prompt = this.buildOutlinePrompt(sessionData, style);
    
    try {
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的内容策划师，擅长为访谈稿设计结构清晰、层次分明的文章提纲。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.5,
        stream: true
      });
      
      let fullContent = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          if (onChunk) {
            await new Promise(resolve => setTimeout(resolve, 30));
            onChunk(content, fullContent);
          }
        }
      }
      
      return this.parseOutlineResponse({ choices: [{ message: { content: fullContent } }] });
    } catch (error) {
      throw error;
    }
  }

  // 基于初稿进行风格润色
  async polishDraftWithStyle(draftContent, style = 'default') {
    const prompt = this.buildPolishPrompt(draftContent, style);
    
    try {
      const response = await this.client.chat.completions.create({
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
        max_tokens: 7000,
        temperature: this.getTemperatureForStyle(style)
      });
      
      return this.parseScriptResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // 基于初稿进行风格润色（流式）
  async polishDraftWithStyleStream(draftContent, style = 'default', onChunk) {
    const prompt = this.buildPolishPrompt(draftContent, style);
    
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
        max_tokens: 8000,
        temperature: this.getTemperatureForStyle(style),
        stream: true
      });
      
      let fullContent = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          if (onChunk) {
            // 润色生成速度适中，25ms延迟
            await new Promise(resolve => setTimeout(resolve, 25));
            onChunk(content, fullContent);
          }
        }
      }
      
      return this.parseScriptResponse({ choices: [{ message: { content: fullContent } }] });
    } catch (error) {
      throw error;
    }
  }

  // 生成单个章节内容
  async generateSectionContent(sessionData, outline, sectionIndex, previousContent = '', style = 'default') {
    const prompt = this.buildSectionPrompt(sessionData, outline, sectionIndex, previousContent, style);
    
    try {
      const response = await this.client.chat.completions.create({
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
        max_tokens: 2000,
        temperature: this.getTemperatureForStyle(style)
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      throw error;
    }
  }

  // 生成单个章节内容（流式）
  async generateSectionContentStream(sessionData, outline, sectionIndex, previousContent = '', style = 'default', onChunk) {
    const prompt = this.buildSectionPrompt(sessionData, outline, sectionIndex, previousContent, style);
    
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
        max_tokens: 2000,
        temperature: this.getTemperatureForStyle(style),
        stream: true
      });
      
      let fullContent = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          if (onChunk) {
            // 章节生成稍快一些，15ms延迟
            await new Promise(resolve => setTimeout(resolve, 15));
            onChunk(content, fullContent);
          }
        }
      }
      
      return fullContent;
    } catch (error) {
      throw error;
    }
  }

  // 根据风格获取温度参数
  getTemperatureForStyle(style) {
    const temperatures = {
      'default': 0.7,
      'qa': 0.3,        // 低温度，保持理性和一致性
      'emotional': 0.9, // 情感风格，高温度增加情感化表达
      'tech': 0.3,      // 科技风格，低温度保持理性和严谨
      'literary': 0.8,  // 文学风格，有一定创意性
      'business': 0.4   // 商业风格，偏理性但保持一定灵活性
    };
    return temperatures[style] || temperatures['default'];
  }

  // 构建提纲生成提示词
  buildOutlinePrompt(sessionData, style) {
    const qaContent = sessionData.questions?.map((q, i) => {
      const answer = sessionData.answers[q.id]?.content || '（未回答）';
      return `**问题${i + 1}：** ${q.content}\n\n**回答：** ${answer}\n`;
    }).join('\n') || '暂无问答内容';
    
    const contextSummary = sessionData.context?.analysisResult?.summary || '无特定背景';
    
    const styleDescriptions = {
      'default': '亲和生动的深度人物特稿，注重情感表达和故事性',
      'qa': '保持原始问答格式，优化文字表达',
      'emotional': '情感充沛，直击痛点，引发强烈共鸣',
      'tech': '理性客观，实用导向，专业深度分析',
      'literary': '文学性强，诗意优美，哲理思辨',
      'business': '数据驱动，商业分析，实操经验导向'
    };
    
    return getPrompt('interview_outline_generation', {
      contextSummary: contextSummary,
      qaContent: qaContent,
      style: styleDescriptions[style] || styleDescriptions['default']
    });
  }

  // 构建章节生成提示词
  buildSectionPrompt(sessionData, outline, sectionIndex, previousContent, style) {
    const section = outline.outline[sectionIndex];
    const qaContent = sessionData.questions?.map((q, i) => {
      const answer = sessionData.answers[q.id]?.content || '（未回答）';
      return `**问题${i + 1}：** ${q.content}\n\n**回答：** ${answer}\n`;
    }).join('\n') || '暂无问答内容';
    
    // 获取下一章节预告（用于过渡）
    const nextPreview = sectionIndex < outline.outline.length - 1 
      ? `下一章节将讲述：${outline.outline[sectionIndex + 1].title} - ${outline.outline[sectionIndex + 1].theme}`
      : '这是最后一个章节，需要有总结性的结尾';
    
    const styleDescriptions = {
      'default': '亲和生动的深度人物特稿风格',
      'qa': '保持问答格式，优化表达',
      'emotional': '情感风格，充满感染力',
      'tech': '科技风格，理性专业',
      'literary': '文学风格，富有诗意',
      'business': '商业风格，数据导向'
    };
    
    return getPrompt('interview_section_generation', {
      articleTitle: outline.title,
      sectionNumber: section.sectionNumber,
      sectionTitle: section.title,
      sectionTheme: section.theme,
      keyPoints: section.keyPoints.join('、'),
      tone: section.tone,
      style: styleDescriptions[style] || styleDescriptions['default'],
      targetWords: section.estimatedWords,
      qaContent: qaContent,
      previousContent: previousContent || '这是文章的第一部分',
      nextPreview: nextPreview
    });
  }

  // 构建润色提示词
  buildPolishPrompt(draftContent, style) {
    const styleDescriptions = {
      'default': '亲和生动的深度人物特稿风格',
      'qa': '保持问答格式，优化表达',
      'emotional': '情感风格，充满感染力',
      'tech': '科技风格，理性专业',
      'literary': '文学风格，富有诗意',
      'business': '商业风格，数据导向'
    };
    
    const templateMap = {
      'default': 'interview_article_generation',
      'qa': 'interview_article_qa',
      'emotional': 'interview_article_emotional',
      'tech': 'interview_article_sspai',
      'literary': 'interview_article_portrait',
      'business': 'interview_article_business'
    };
    
    const templateName = templateMap[style] || templateMap['default'];
    
    // 使用初稿作为输入材料，而不是原始问答
    return getPrompt(templateName, {
      contextSummary: '基于已生成的初稿进行风格润色和优化',
      qaContent: `初稿内容：\n\n${draftContent}\n\n请根据${styleDescriptions[style] || styleDescriptions['default']}的风格，对以上初稿进行润色和优化。保持内容的完整性，但要提升表达的精彩程度和风格特色。`
    });
  }

  // 解析提纲响应
  parseOutlineResponse(response) {
    try {
      const content = response.choices[0].message.content;
      
      // 尝试提取JSON
      let jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
      if (!jsonMatch) {
        jsonMatch = content.match(/{[\s\S]*}/);
      }
      
      if (jsonMatch) {
        const outline = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return {
          content: outline,
          format: 'json',
          generatedAt: new Date().toISOString()
        };
      } else {
        // 如果无法解析JSON，返回原始内容
        return {
          content: { error: '无法解析提纲格式', rawContent: content },
          format: 'text',
          generatedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        content: { error: '提纲解析失败', details: error.message },
        format: 'error',
        generatedAt: new Date().toISOString()
      };
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

请以JSON格式返回结果，格式如下：
{
  "summary": "内容摘要",
  "keyTopics": ["主题1", "主题2", "主题3"]
}`;
  }
  
  // 构建问题生成提示词
  buildQuestionPrompt(context, history) {
    const contextSummary = context.analysisResult?.summary || '无特定上下文';
    const keyTopics = context.analysisResult?.keyTopics?.join(', ') || '无特定主题';
    
    // 构建历史对话内容
    const previousQA = history.questions?.map((q, i) => {
      const answer = history.answers[q.id]?.content || '未回答';
      const questionSource = q.isFromPreview ? '(来自预览问题)' : '';
      return `第${i + 1}轮对话${questionSource}：\n问题：${q.content}\n回答：${answer}`;
    }).join('\n\n') || '暂无历史对话';
    
    // 添加预览问题的上下文信息
    let previewContext = '';
    if (context.previewQuestions && context.previewQuestions.length > 0) {
      const goodQuestions = context.previewQuestions.filter((q, index) => 
        context.questionFeedback && context.questionFeedback[index] === 'good'
      );
      const badQuestions = context.previewQuestions.filter((q, index) => 
        context.questionFeedback && context.questionFeedback[index] === 'bad'
      );
      
      if (goodQuestions.length > 0 || badQuestions.length > 0) {
        previewContext = '\n## 预览问题反馈\n';
        
        if (goodQuestions.length > 0) {
          previewContext += '用户认为不错的问题类型：\n';
          goodQuestions.forEach((q, index) => {
            previewContext += `- "${q.question}" (分类：${q.category || '未分类'})\n`;
          });
        }
        
        if (badQuestions.length > 0) {
          previewContext += '用户认为不好的问题类型：\n';
          badQuestions.forEach((q, index) => {
            previewContext += `- "${q.question}" (分类：${q.category || '未分类'})\n`;
          });
        }
        
        previewContext += '\n请参考用户反馈，多生成用户认为“不错”的问题风格，避免用户认为“不好”的问题类型。\n';
      }
    }
    
    // 使用新的专业提示词模板
    return getPrompt('creator_question_generation', {
      summary: contextSummary,
      keyTopics: keyTopics,
      previousQA: previousQA + previewContext
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
  
  // 构建带风格的访谈稿生成提示词
  buildScriptPromptWithStyle(sessionData, style = 'default') {
    const qaContent = sessionData.questions?.map((q, i) => {
      const answer = sessionData.answers[q.id]?.content || '（未回答）';
      return `**问题${i + 1}：** ${q.content}\n\n**回答：** ${answer}\n`;
    }).join('\n') || '暂无问答内容';
    
    const contextSummary = sessionData.context?.analysisResult?.summary || '无特定背景';
    
    // 根据风格使用对应的模板
    const templateMap = {
      'default': 'interview_article_generation',
      'qa': 'interview_article_qa',
      'emotional': 'interview_article_emotional',
      'tech': 'interview_article_sspai',
      'literary': 'interview_article_portrait',
      'business': 'interview_article_business'
    };
    
    const templateName = templateMap[style] || templateMap['default'];
    
    // 使用具体的模板来生成提示词
    return getPrompt(templateName, {
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
    
    // 使用通用的字数统计函数
    const wordCount = this.countWords(content);
    
    return {
      content,
      format: 'markdown',
      wordCount: wordCount,
      estimatedReadTime: Math.ceil(wordCount / 200),
      generatedAt: new Date().toISOString()
    };
  }
  
  // 通用字数统计函数
  countWords(text) {
    if (!text) return 0;
    // 移除Markdown标记和多余空白
    const cleanText = text
      .replace(/#+\s/g, '') // 移除标题标记
      .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
      .replace(/\*([^*]+)\*/g, '$1') // 移除斜体标记
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
      .replace(/`([^`]+)`/g, '$1') // 移除代码标记
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim();
    
    // 分别统计中文字符和英文单词
    const chineseChars = (cleanText.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = cleanText
      .replace(/[\u4e00-\u9fff]/g, '') // 移除中文字符
      .split(/\s+/)
      .filter(word => word.length > 0).length;
    
    return chineseChars + englishWords;
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