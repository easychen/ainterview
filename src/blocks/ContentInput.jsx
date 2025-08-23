import React, { useState } from 'react';
import { 
  TextInput, 
  Button, 
  Card, 
  Stack, 
  Group, 
  Text, 
  Title, 
  Textarea,
  FileInput,
  Badge,
  ActionIcon,
  Alert,
  LoadingOverlay,
  Tabs,
  List,
  ThemeIcon
} from '@mantine/core';
import { 
  IconLink, 
  IconUpload, 
  IconTrash, 
  IconFile, 
  IconWorld,
  IconPlus,
  IconAnalyze,
  IconAlertCircle,
  IconCheck,
  IconListDetails,
  IconMessageQuestion,
  IconRefresh,
  IconSettings,
  IconThumbUp,
  IconThumbDown,
  IconPlayerPlay
} from '@tabler/icons-react';
import { useInterviewStore } from '../hooks/useInterviewStore.jsx';

export function ContentInput() {
  const { 
    contentState, 
    sessionState,
    interviewState,
    apiState,
    addContentSource, 
    removeContentSource, 
    analyzeContent,
    generateQuestionListPreview,
    updateInterviewState,
    updateContentState,
    setQuestionFeedback,
    saveSessionData
  } = useInterviewStore();
  
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [activeTab, setActiveTab] = useState('url');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  // 添加网址
  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    
    setIsProcessingUrl(true);
    try {
      // 简单验证URL格式
      const url = new URL(urlInput.trim());
      
      // 创建基础的URL内容源
      const source = {
        type: 'url',
        title: url.hostname,
        content: `网址: ${url.href}\n\n由于浏览器CORS限制，无法直接获取网页内容。请手动将网页重要内容复制到文本输入框中。`,
        url: url.href,
        metadata: {
          url: url.href,
          addedAt: new Date().toISOString()
        }
      };
      
      addContentSource(source);
      setUrlInput('');
    } catch (error) {
      console.error('Invalid URL:', error);
      // 这里可以添加错误提示
    } finally {
      setIsProcessingUrl(false);
    }
  };
  
  // 添加文本内容
  const handleAddText = () => {
    if (!textInput.trim()) return;
    
    const source = {
      type: 'text',
      title: textTitle.trim() || '文本内容',
      content: textInput.trim(),
      metadata: {
        addedAt: new Date().toISOString(),
        wordCount: textInput.trim().split(/\s+/).length
      }
    };
    
    addContentSource(source);
    setTextInput('');
    setTextTitle('');
  };
  
  // 处理文件上传（支持多选）
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    // 处理多个文件
    for (const file of files) {
      try {
        const text = await file.text();
        const source = {
          type: 'document',
          title: file.name,
          content: text,
          metadata: {
            filename: file.name,
            size: file.size,
            type: file.type,
            addedAt: new Date().toISOString()
          }
        };
        
        addContentSource(source);
      } catch (error) {
        console.error(`Failed to read file ${file.name}:`, error);
      }
    }
  };
  
  // 开始分析内容
  const handleStartAnalysis = async () => {
    try {
      await analyzeContent();
    } catch (error) {
      console.error('Content analysis failed:', error);
    }
  };
  
  // 生成问题列表预览
  const handleGeneratePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      await generateQuestionListPreview();
    } catch (error) {
      console.error('Failed to generate preview questions:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };
  
  // 重新配置 - 清除内容分析结果和问题预览
  const handleReconfigure = () => {
    // 清除全局状态中的预览问题
    updateContentState({ 
      previewQuestions: [],
      questionFeedback: {},
      analysisResult: null,
      error: null 
    });
  };
  
  // 处理问题反馈
  const handleQuestionFeedback = (questionIndex, feedback) => {
    setQuestionFeedback(questionIndex, feedback);
  };
  
  // 开始访谈
  const handleStartInterview = () => {
    console.log('开始访谈按钮被点击');
    
    // 更新状态为 interviewing
    updateInterviewState({ currentStep: 'interviewing' });
    
    // 延迟保存数据和滚动
    setTimeout(() => {
      // 手动保存数据
      saveSessionData();
      // 平滑滚动到页面顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300); // 增加延迟时间，确保状态完全更新
  };
  

  
  // 渲染内容源列表
  const renderSourceItem = (source) => (
    <Card key={source.id} padding="sm" withBorder mb="xs">
      <Group position="apart" align="flex-start">
        <div style={{ flex: 1 }}>
          <Group spacing="xs" mb="xs">
            <ThemeIcon size="sm" variant="light">
              {source.type === 'url' && <IconWorld size={14} />}
              {source.type === 'text' && <IconListDetails size={14} />}
              {source.type === 'document' && <IconFile size={14} />}
            </ThemeIcon>
            <Text weight={500} size="sm">{source.title}</Text>
            <Badge size="xs" variant="light">
              {source.type === 'url' && '网址'}
              {source.type === 'text' && '文本'}
              {source.type === 'document' && '文档'}
            </Badge>
          </Group>
          <Text size="xs" color="dimmed" lineClamp={2}>
            {source.content.length > 100 
              ? `${source.content.substring(0, 100)}...` 
              : source.content
            }
          </Text>
          <Text size="xs" color="dimmed" mt="xs">
            添加时间: {new Date(source.metadata.addedAt).toLocaleString()}
            {source.metadata.wordCount && ` · ${source.metadata.wordCount} 字`}
          </Text>
        </div>
        <ActionIcon 
          color="red" 
          variant="light" 
          onClick={() => removeContentSource(source.id)}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
    </Card>
  );
  
  return (
    <Card shadow="sm" padding="xl" radius="md" withBorder>
      <LoadingOverlay visible={contentState.isAnalyzing} />
      
      <Stack spacing="md">
        <div>
          <Group position="apart" align="flex-start">
            <div>
              <Title order={2} size="h3" mb="xs">
                访谈内容准备
              </Title>
              <Text color="dimmed" size="sm">
                添加网址、文档或文本内容，AI将基于这些内容生成有深度的访谈问题
              </Text>
            </div>
            
            {/* 顶部操作按钮 */}
            <Group spacing="xs">
              {contentState.analysisResult && (
                <Button 
                  variant="light"
                  size="sm"
                  onClick={handleStartAnalysis}
                  loading={contentState.isAnalyzing}
                  leftIcon={<IconRefresh size={14} />}
                >
                  重新分析
                </Button>
              )}
              {contentState.sources.length > 0 && !contentState.analysisResult && (
                <Button 
                  size="sm"
                  onClick={handleStartAnalysis}
                  loading={contentState.isAnalyzing}
                  leftIcon={<IconAnalyze size={16} />}
                >
                  开始分析内容
                </Button>
              )}
            </Group>
          </Group>
        </div>
        
        {contentState.error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            title="处理错误" 
            color="red"
            variant="light"
          >
            {contentState.error}
          </Alert>
        )}
        
        <Tabs value={activeTab} onTabChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="url" icon={<IconLink size={14} />}>
              网址链接
            </Tabs.Tab>
            <Tabs.Tab value="text" icon={<IconListDetails size={14} />}>
              文本内容
            </Tabs.Tab>
            <Tabs.Tab value="file" icon={<IconUpload size={14} />}>
              文件上传
            </Tabs.Tab>
          </Tabs.List>
          
          <Tabs.Panel value="url" pt="md">
            <Stack spacing="sm">
              <TextInput
                placeholder="输入网址，如 https://example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                icon={<IconLink size={16} />}
                rightSection={
                  <Button 
                    size="xs" 
                    onClick={handleAddUrl}
                    loading={isProcessingUrl}
                    disabled={!urlInput.trim()}
                  >
                    <IconPlus size={14} />
                  </Button>
                }
              />
              <Alert color="blue" variant="light" title="提示">
                由于浏览器安全限制，添加网址后请手动复制网页重要内容到文本输入框中
              </Alert>
            </Stack>
          </Tabs.Panel>
          
          <Tabs.Panel value="text" pt="md">
            <Stack spacing="sm">
              <TextInput
                label="内容标题（可选）"
                placeholder="为这段内容起个标题"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
              />
              <Textarea
                label="文本内容"
                placeholder="粘贴或输入要分析的文本内容..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                minRows={4}
                maxRows={8}
                autosize
              />
              <Group position="right">
                <Button 
                  onClick={handleAddText}
                  disabled={!textInput.trim()}
                  leftIcon={<IconPlus size={14} />}
                >
                  添加文本
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>
          
          <Tabs.Panel value="file" pt="md">
            <Stack spacing="sm">
              <FileInput
                label="上传文件"
                placeholder="选择文本文件 (.txt, .md, .json 等)"
                accept=".txt,.md,.json,.csv,.log"
                onChange={handleFileUpload}
                icon={<IconUpload size={16} />}
                multiple
                value={null}
              />
              <Alert color="blue" variant="light" title="支持的文件格式">
                目前支持纯文本文件，如 .txt、.md、.json、.csv 等格式。支持多文件同时上传。
              </Alert>
            </Stack>
          </Tabs.Panel>
        </Tabs>
        
        {/* 已添加的内容源列表 */}
        {contentState.sources.length > 0 && (
          <div>
            <Group position="apart" mb="sm">
              <Text weight={500}>已添加的内容源 ({contentState.sources.length})</Text>
            </Group>
            <Stack spacing="xs" mb="md">
              {contentState.sources.map(renderSourceItem)}
            </Stack>
          </div>
        )}
        
        {/* 分析结果 */}
        {contentState.analysisResult && (
          <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa' }}>
            <Stack spacing="sm">
              <Group position="apart">
                <Group>
                  <ThemeIcon color="green" variant="light">
                    <IconCheck size={16} />
                  </ThemeIcon>
                  <Text weight={500}>内容分析完成</Text>
                </Group>
                <Button 
                  variant="subtle" 
                  size="xs" 
                  leftIcon={<IconSettings size={14} />}
                  onClick={handleReconfigure}
                >
                  重新配置
                </Button>
              </Group>
              
              <Text size="sm" color="dimmed">
                <strong>内容摘要：</strong>{contentState.analysisResult.summary}
              </Text>
              
              {contentState.analysisResult.keyTopics?.length > 0 && (
                <div>
                  <Text size="sm" weight={500} mb="xs">关键主题：</Text>
                  <Group spacing="xs">
                    {contentState.analysisResult.keyTopics.map((topic, index) => (
                      <Badge key={index} variant="light">{topic}</Badge>
                    ))}
                  </Group>
                </div>
              )}
              
              {contentState.analysisResult.suggestedQuestions?.length > 0 && (
                <div>
                  <Text size="sm" weight={500} mb="xs">建议的问题方向：</Text>
                  <List size="sm">
                    {contentState.analysisResult.suggestedQuestions.map((question, index) => (
                      <List.Item key={index}>{question}</List.Item>
                    ))}
                  </List>
                </div>
              )}

            </Stack>
          </Card>
        )}
        
        {/* 问题预览 */}
        {contentState.analysisResult && (
          <Card withBorder padding="md">
            <Stack spacing="md">
              <Group position="apart" align="flex-start">
                <Group>
                  <ThemeIcon color="blue" variant="light">
                    <IconMessageQuestion size={16} />
                  </ThemeIcon>
                  <Text weight={500}>问题预览</Text>
                </Group>
                <Group spacing="xs">
                  <Button 
                    size="xs" 
                    variant="light"
                    leftIcon={<IconRefresh size={14} />}
                    onClick={handleGeneratePreview}
                    loading={isGeneratingPreview}
                  >
                    {contentState.previewQuestions.length > 0 ? '重新生成' : '生成预览'}
                  </Button>
                </Group>
              </Group>
              
              {isGeneratingPreview && (
                <Alert color="blue" variant="light">
                  AI 正在生成问题预览列表...
                </Alert>
              )}
              
              {contentState.previewQuestions.length > 0 && (
                <Card withBorder padding="sm" style={{ backgroundColor: '#f0f7ff' }}>
                  <Stack spacing="sm">
                    <Text size="sm" weight={500} color="dimmed">
                      预览问题列表（按访谈顺序排列）
                    </Text>
                    {contentState.previewQuestions.map((q, index) => {
                      const feedback = contentState.questionFeedback?.[index];
                      return (
                        <Card key={index} withBorder padding="xs" style={{ backgroundColor: 'white' }}>
                          <Group position="apart" align="flex-start" mb="xs">
                            <Group spacing="xs">
                              <Badge size="xs" variant="light">
                                第{q.order || index + 1}问
                              </Badge>
                              <Badge size="xs" variant="outline">
                                {q.category || '一般'}
                              </Badge>
                            </Group>
                            <Group spacing="xs">
                              <ActionIcon 
                                size="sm" 
                                variant={feedback === 'good' ? 'filled' : 'light'}
                                color={feedback === 'good' ? 'green' : 'gray'}
                                onClick={() => handleQuestionFeedback(index, 'good')}
                              >
                                <IconThumbUp size={14} />
                              </ActionIcon>
                              <ActionIcon 
                                size="sm" 
                                variant={feedback === 'bad' ? 'filled' : 'light'}
                                color={feedback === 'bad' ? 'red' : 'gray'}
                                onClick={() => handleQuestionFeedback(index, 'bad')}
                              >
                                <IconThumbDown size={14} />
                              </ActionIcon>
                            </Group>
                          </Group>
                          <Text size="sm" weight={500} mb="xs">
                            {q.question}
                          </Text>
                          {q.purpose && (
                            <Text size="xs" color="dimmed">
                              <strong>目的：</strong>{q.purpose}
                            </Text>
                          )}
                          {feedback && (
                            <Badge 
                              size="xs" 
                              variant="light" 
                              color={feedback === 'good' ? 'green' : 'red'}
                              mt="xs"
                            >
                              {feedback === 'good' ? '你认为不错' : '你认为不好'}
                            </Badge>
                          )}
                        </Card>
                      );
                    })}
                  </Stack>
                </Card>
              )}
              
              <Text size="xs" color="dimmed">
                这是基于您的内容生成的预览问题列表，您可以点击“不错”或“不好”来反馈。实际访谈中的问题会根据对话进展动态调整。
              </Text>
              
              {/* 开始访谈按钮 */}
              {contentState.previewQuestions.length > 0 && (
                <Group position="center" mt="md">
                  <Button 
                    size="md"
                    leftIcon={<IconPlayerPlay size={16} />}
                    onClick={handleStartInterview}
                  >
                    开始访谈
                  </Button>
                </Group>
              )}
            </Stack>
          </Card>
        )}
        
        {/* 操作按钮 */}
      </Stack>
    </Card>
  );
}