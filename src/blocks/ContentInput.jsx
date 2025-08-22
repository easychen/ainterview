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
  IconListDetails
} from '@tabler/icons-react';
import { useInterviewStore } from '../hooks/useInterviewStore.jsx';

export function ContentInput() {
  const { 
    contentState, 
    addContentSource, 
    removeContentSource, 
    analyzeContent,
    updateInterviewState 
  } = useInterviewStore();
  
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [activeTab, setActiveTab] = useState('url');
  
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
  
  // 处理文件上传
  const handleFileUpload = async (file) => {
    if (!file) return;
    
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
      console.error('Failed to read file:', error);
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
          <Title order={2} size="h3" mb="xs">
            访谈内容准备
          </Title>
          <Text color="dimmed" size="sm">
            添加网址、文档或文本内容，AI将基于这些内容生成有深度的访谈问题
          </Text>
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
              />
              <Alert color="blue" variant="light" title="支持的文件格式">
                目前支持纯文本文件，如 .txt、.md、.json、.csv 等格式
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
              <Group>
                <ThemeIcon color="green" variant="light">
                  <IconCheck size={16} />
                </ThemeIcon>
                <Text weight={500}>内容分析完成</Text>
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
              
              <Badge 
                color={
                  contentState.analysisResult.difficulty === 'beginner' ? 'green' :
                  contentState.analysisResult.difficulty === 'intermediate' ? 'yellow' : 'red'
                }
                variant="light"
              >
                难度: {
                  contentState.analysisResult.difficulty === 'beginner' ? '初级' :
                  contentState.analysisResult.difficulty === 'intermediate' ? '中级' : '高级'
                }
              </Badge>
            </Stack>
          </Card>
        )}
        
        {/* 操作按钮 */}
        <Group position="right" mt="md">
          {contentState.sources.length > 0 && !contentState.analysisResult && (
            <Button 
              onClick={handleStartAnalysis}
              loading={contentState.isAnalyzing}
              leftIcon={<IconAnalyze size={16} />}
            >
              开始分析内容
            </Button>
          )}
          
          {contentState.analysisResult && (
            <Button 
              onClick={() => updateInterviewState({ currentStep: 'interviewing' })}
            >
              开始访谈
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  );
}