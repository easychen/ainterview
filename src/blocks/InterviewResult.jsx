import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Stack, 
  Group, 
  Text, 
  Title, 
  Button,
  Badge,
  Alert,
  LoadingOverlay,
  Textarea,
  Select,
  ActionIcon,
  Tooltip,
  Divider,
  CopyButton
} from '@mantine/core';
import { 
  IconDownload,
  IconRefresh,
  IconCheck,
  IconCopy,
  IconFile,
  IconFileText,
  IconMarkdown,
  IconAlertCircle,
  IconShare,
  IconEdit,
  IconClock
} from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useInterviewStore } from '../hooks/useInterviewStore.jsx';

export function InterviewResult() {
  const { 
    resultState, 
    sessionState,
    contentState,
    generateInterviewScriptStream,
    generateInterviewScriptWithStyle,
    switchInterviewStyle,
    updateResultState,
    resetInterview
  } = useInterviewStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedScript, setEditedScript] = useState('');
  const [exportFormat, setExportFormat] = useState('markdown');
  const [selectedStyle, setSelectedStyle] = useState('default');
  
  // 写作风格选项
  const styleOptions = [
    { value: 'default', label: '默认风格', description: '亲和生动，深度人物特稿' },
    { value: 'qa', label: '问答风格', description: '保持原始问答格式，优化错别字' },
    { value: 'emotional', label: '情感风格', description: '情感充沛，直击痛点，引发共鸣' },
    { value: 'tech', label: '科技风格', description: '理性客观，实用导向，专业深度' },
    { value: 'literary', label: '文学风格', description: '文学性强，诗意优美，哲理思辨' },
    { value: 'business', label: '商业风格', description: '数据驱动，分析深入，实操性强' }
  ];
  
  // 初始化时生成访谈稿
  useEffect(() => {
    if (!resultState.interviewScripts[resultState.currentStyle] && !resultState.isGenerating) {
      handleGenerateScript(resultState.currentStyle);
    }
  }, []);
  
  // 当访谈稿或流式访谈稿生成后，设置编辑内容
  useEffect(() => {
    const currentScript = resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript;
    if (currentScript) {
      setEditedScript(currentScript.content);
      // 更新选中的风格
      if (currentScript.style) {
        setSelectedStyle(currentScript.style);
      }
    } else if (resultState.streamingScript) {
      setEditedScript(resultState.streamingScript.content);
      if (resultState.streamingScript.style) {
        setSelectedStyle(resultState.streamingScript.style);
      }
    }
  }, [resultState.interviewScripts, resultState.currentStyle, resultState.interviewScript, resultState.streamingScript]);
  
  // 生成访谈稿（使用流式输出和风格选择）
  const handleGenerateScript = async (style = selectedStyle) => {
    try {
      await generateInterviewScriptWithStyle(style);
    } catch (error) {
      console.error('Failed to generate interview script:', error);
    }
  };
  
  // 切换风格（智能切换：已生成则显示，未生成则生成）
  const handleStyleChange = async (newStyle) => {
    try {
      setSelectedStyle(newStyle);
      await switchInterviewStyle(newStyle);
    } catch (error) {
      console.error('Failed to switch style:', error);
    }
  };
  
  // 保存编辑
  const handleSaveEdit = () => {
    const currentScript = resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript;
    if (currentScript) {
      const updatedScript = {
        ...currentScript,
        content: editedScript,
        lastEditedAt: new Date().toISOString()
      };
      
      // 更新多风格结构中的对应风格
      updateResultState({ 
        interviewScripts: {
          ...resultState.interviewScripts,
          [resultState.currentStyle]: updatedScript
        },
        interviewScript: updatedScript  // 保持兼容性
      });
    }
    setIsEditing(false);
  };
  
  // 取消编辑
  const handleCancelEdit = () => {
    const currentScript = resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript;
    setEditedScript(currentScript?.content || '');
    setIsEditing(false);
  };
  
  // 导出文件
  const handleExport = () => {
    const currentScript = resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript;
    if (!currentScript) return;
    
    const content = isEditing ? editedScript : currentScript.content;
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm', { locale: zhCN });
    
    let filename, mimeType;
    
    switch (exportFormat) {
      case 'txt':
        filename = `访谈稿-${timestamp}.txt`;
        mimeType = 'text/plain';
        break;
      case 'html':
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>访谈稿</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding-left: 1em; color: #666; }
    pre { background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
${convertMarkdownToHtml(content)}
</body>
</html>`;
        filename = `访谈稿-${timestamp}.html`;
        mimeType = 'text/html';
        downloadFile(htmlContent, filename, mimeType);
        return;
      default: // markdown
        filename = `访谈稿-${timestamp}.md`;
        mimeType = 'text/markdown';
        break;
    }
    
    downloadFile(content, filename, mimeType);
  };
  
  // 下载文件
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 导出原始问答记录
  const handleExportQA = () => {
    if (!sessionState.questions || sessionState.questions.length === 0) return;
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm', { locale: zhCN });
    
    // 生成问答内容
    const qaContent = sessionState.questions.map((q, index) => {
      const answer = sessionState.answers[q.id]?.content || '（未回答）';
      return `Q${index + 1}: ${q.content}\n\nA${index + 1}: ${answer}\n\n${'='.repeat(50)}\n`;
    }).join('\n');
    
    const fullContent = `访谈问答记录\n生成时间：${format(new Date(), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}\n总问题数：${sessionState.questions.length}\n已回答数：${Object.keys(sessionState.answers).length}\n\n${'='.repeat(80)}\n\n${qaContent}`;
    
    const filename = `访谈问答记录-${timestamp}.txt`;
    downloadFile(fullContent, filename, 'text/plain');
  };
  
  // 简单的Markdown转HTML（实际项目中可能需要更完善的转换）
  const convertMarkdownToHtml = (markdown) => {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');
  };
  
  // 开始新访谈
  const handleNewInterview = () => {
    resetInterview();
  };
  
  // 计算统计信息
  const stats = {
    totalQuestions: sessionState.questions.length,
    totalAnswers: Object.keys(sessionState.answers).length,
    wordCount: (resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript)?.wordCount || 0,
    estimatedReadTime: (resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript)?.estimatedReadTime || 0
  };
  
  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={resultState.isGenerating} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }} />
      
      {/* 头部信息 */}
      <Card withBorder padding="md" mb="md">
        <Group position="apart" align="flex-start">
          <div>
            <Title order={2} mb="xs">访谈完成</Title>
            <Text size="sm" color="dimmed">
              AI 已根据您的问答内容生成了完整的访谈稿
            </Text>
          </div>
          <Badge color="green" variant="light" size="lg">
            已完成
          </Badge>
        </Group>
        
        {/* 统计信息 */}
        <Group mt="md" spacing="xl">
          <div>
            <Text size="xl" weight={700} color="blue">
              {stats.totalQuestions}
            </Text>
            <Text size="xs" color="dimmed">总问题数</Text>
          </div>
          <div>
            <Text size="xl" weight={700} color="green">
              {stats.totalAnswers}
            </Text>
            <Text size="xs" color="dimmed">已回答</Text>
          </div>
          <div>
            <Text size="xl" weight={700} color="orange">
              {stats.wordCount}
            </Text>
            <Text size="xs" color="dimmed">字数</Text>
          </div>
          <div>
            <Text size="xl" weight={700} color="purple">
              {stats.estimatedReadTime}
            </Text>
            <Text size="xs" color="dimmed">预计阅读时间(分钟)</Text>
          </div>
        </Group>
      </Card>
      
      {/* 错误提示 */}
      {resultState.error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="生成错误" 
          color="red"
          variant="light"
          mb="md"
        >
          {resultState.error}
        </Alert>
      )}
      
      {/* 访谈稿内容 */}
      {(resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript || resultState.streamingScript) && (
        <Card shadow="sm" padding="xl" withBorder mb="md">
          <Group position="apart" mb="md">
            <Group spacing="xs">
              <Title order={3}>访谈稿</Title>
              {resultState.streamingScript && (
                <Badge color="blue" variant="light" size="sm">
                  生成中...
                </Badge>
              )}
              {(resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript)?.style && (
                <Badge color="indigo" variant="light" size="sm">
                  {styleOptions.find(s => s.value === (resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript).style)?.label || '默认风格'}
                </Badge>
              )}
            </Group>
            <Group spacing="xs">
              <CopyButton value={isEditing ? editedScript : ((resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript)?.content || resultState.streamingScript?.content || '')}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? '已复制' : '复制内容'}>
                    <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
              
              {!resultState.streamingScript && (
                <>
                  <Tooltip label="重新生成">
                    <ActionIcon 
                      variant="light" 
                      onClick={() => handleGenerateScript()}
                      loading={resultState.isGenerating}
                    >
                      <IconRefresh size={16} />
                    </ActionIcon>
                  </Tooltip>
                  
                  <Tooltip label={isEditing ? '保存编辑' : '编辑内容'}>
                    <ActionIcon 
                      variant="light" 
                      color={isEditing ? 'green' : 'blue'}
                      onClick={isEditing ? handleSaveEdit : () => setIsEditing(true)}
                    >
                      {isEditing ? <IconCheck size={16} /> : <IconEdit size={16} />}
                    </ActionIcon>
                  </Tooltip>
                </>
              )}
            </Group>
          </Group>
          
          {/* 写作风格选择器 */}
          {!resultState.streamingScript && (
            <Card withBorder padding="sm" mb="md" style={{ backgroundColor: '#f8f9fa' }}>
              <Title order={5} mb="sm">写作风格</Title>
              <Group spacing="xs" mb="xs">
                {styleOptions.map((style) => (
                  <Button
                    key={style.value}
                    variant={selectedStyle === style.value ? 'filled' : 'light'}
                    size="xs"
                    onClick={() => handleStyleChange(style.value)}
                    loading={resultState.isGenerating && selectedStyle === style.value}
                  >
                    {style.label}
                  </Button>
                ))}
              </Group>
              <Text size="xs" color="dimmed">
                当前风格：{styleOptions.find(s => s.value === selectedStyle)?.description || '默认风格'}
              </Text>
            </Card>
          )}
          
          {isEditing ? (
            <Stack spacing="md">
              <Textarea
                value={editedScript}
                onChange={(e) => setEditedScript(e.target.value)}
                minRows={20}
                maxRows={30}
                autosize
                placeholder="编辑访谈稿内容..."
              />
              <Group position="right">
                <Button variant="subtle" onClick={handleCancelEdit}>
                  取消
                </Button>
                <Button onClick={handleSaveEdit}>
                  保存
                </Button>
              </Group>
            </Stack>
          ) : (
            <div style={{ 
              maxHeight: '600px', 
              overflowY: 'auto', 
              border: '1px solid #eee', 
              borderRadius: '8px', 
              padding: '16px',
              backgroundColor: '#fafafa'
            }}>
              <ReactMarkdown>
                {resultState.streamingScript?.content || (resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript)?.content || ''}
              </ReactMarkdown>
            </div>
          )}
          
          {((resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript)?.generatedAt || resultState.streamingScript?.generatedAt) && (
            <Text size="xs" color="dimmed" mt="md" align="right">
              生成时间: {format(new Date(((resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript) || resultState.streamingScript).generatedAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
              {(resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript)?.lastEditedAt && (
                <> · 最后编辑: {format(new Date((resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript).lastEditedAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}</>
              )}
            </Text>
          )}
        </Card>
      )}
      
      {/* 导出选项 */}
      <Card withBorder padding="md" mb="md">
        <Title order={4} mb="md">导出访谈内容</Title>
        <Stack spacing="md">
          <Group spacing="md" align="flex-end">
            <Select
              label="访谈稿导出格式"
              value={exportFormat}
              onChange={setExportFormat}
              data={[
                { value: 'markdown', label: 'Markdown (.md)', icon: IconMarkdown },
                { value: 'txt', label: '纯文本 (.txt)', icon: IconFileText },
                { value: 'html', label: 'HTML (.html)', icon: IconFile }
              ]}
              style={{ minWidth: 200 }}
            />
            <Button 
              leftIcon={<IconDownload size={16} />}
              onClick={handleExport}
              disabled={!(resultState.interviewScripts[resultState.currentStyle] || resultState.interviewScript)}
            >
              下载访谈稿
            </Button>
          </Group>
          
          <Group spacing="md">
            <Text size="sm" color="dimmed">
              或者导出原始问答记录：
            </Text>
            <Button 
              variant="outline"
              size="sm"
              leftIcon={<IconFileText size={14} />}
              onClick={handleExportQA}
              disabled={!sessionState.questions || sessionState.questions.length === 0}
            >
              导出问答记录
            </Button>
          </Group>
        </Stack>
      </Card>
      
      {/* 操作按钮 */}
      <Group position="center" mt="xl">
        <Button 
          variant="outline" 
          onClick={handleNewInterview}
          leftIcon={<IconRefresh size={16} />}
        >
          开始新访谈
        </Button>
        <Button 
          variant="subtle"
          onClick={() => window.print()}
          leftIcon={<IconFile size={16} />}
        >
          打印访谈稿
        </Button>
      </Group>
    </div>
  );
}