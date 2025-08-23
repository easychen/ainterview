import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Stack, 
  Group, 
  Text, 
  Title, 
  Textarea,
  Button,
  Badge,
  Progress,
  Alert,
  LoadingOverlay,
  Timeline,
  ActionIcon,
  Tooltip,
  Divider
} from '@mantine/core';
import { 
  IconMessageQuestion,
  IconMessageCheck,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconBulb,
  IconMicrophone,
  IconMicrophoneOff
} from '@tabler/icons-react';
import { useInterviewStore } from '../hooks/useInterviewStore.jsx';
import { useAPISpeechRecognition } from '../hooks/useAPISpeechRecognition.jsx';
import { APIConfigManager } from '../../lib/apiConfig.js';

export function InterviewSession() {
  const { 
    sessionState, 
    contentState,
    generateQuestionStream, 
    saveAnswer, 
    nextQuestion,
    completeInterview,
    updateInterviewState,
    loadSessionData
  } = useInterviewStore();
  
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  
  // API语音识别功能
  const {
    isListening,
    transcript,
    error: speechError,
    isProcessing,
    isAvailable: speechAvailable,
    currentLang,
    startListening,
    stopListening,
    clearTranscript,
    clearError: clearSpeechError,
    switchLanguage,
    forceStop
  } = useAPISpeechRecognition();
  
  // 检查是否应该显示语音按钮
  const shouldShowSpeechButton = speechAvailable;
  
  // 当语音识别结束时，将结果添加到输入框
  useEffect(() => {
    if (transcript && !isListening) {
      // 将语音识别结果添加到当前答案
      setCurrentAnswer(prev => {
        // 如果已有内容，在后面添加空格
        const separator = prev.trim() ? ' ' : '';
        return prev + separator + transcript;
      });
      clearTranscript();
    }
  }, [transcript, isListening, clearTranscript]);
  
  const currentQuestion = sessionState.questions[sessionState.currentQuestionIndex];
  const totalQuestions = sessionState.questions.length;
  const answeredQuestions = Object.keys(sessionState.answers).length;
  
  // 暂时禁用初始化时的数据加载，避免状态冲突
  // useEffect(() => {
  //   // 尝试加载保存的数据
  //   const loaded = loadSessionData();
  //   
  //   // 如果没有保存的数据或没有问题，生成第一个问题
  //   if (!loaded || (sessionState.questions.length === 0 && !sessionState.isGeneratingQuestion)) {
  //     handleGenerateQuestion();
  //   }
  // }, []);
  
  // 初始化时生成第一个问题（如果没有）
  useEffect(() => {
    if (sessionState.questions.length === 0 && !sessionState.isGeneratingQuestion) {
      console.log('InterviewSession: 初始化，生成第一个问题');
      handleGenerateQuestion();
    }
  }, []);
  
  // 生成新问题（使用流式输出）
  const handleGenerateQuestion = async () => {
    try {
      await generateQuestionStream();
    } catch (error) {
      console.error('Failed to generate question:', error);
    }
  };
  
  // 提交答案
  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !currentQuestion) return;
    
    setIsAnswering(true);
    try {
      // 保存当前答案
      saveAnswer(currentQuestion.id, currentAnswer.trim());
      
      // 清空输入框
      setCurrentAnswer('');
      
      // 移动到下一个问题
      nextQuestion();
      
      // 自动生成下一个问题（如果还没有足够的问题）
      if (sessionState.currentQuestionIndex + 1 >= sessionState.questions.length) {
        // 总是生成下一个问题，不受最小问题数限制
        await handleGenerateQuestion();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsAnswering(false);
    }
  };
  
  // 跳过当前问题
  const handleSkipQuestion = () => {
    if (!currentQuestion) return;
    
    saveAnswer(currentQuestion.id, '（跳过）');
    nextQuestion();
    
    // 如果需要生成新问题
    if (sessionState.currentQuestionIndex + 1 >= sessionState.questions.length) {
      handleGenerateQuestion();
    }
  };
  
  // 结束访谈
  const handleCompleteInterview = () => {
    completeInterview();
    updateInterviewState({ currentStep: 'completed' });
  };
  
  // 自动检查是否可以结束访谈
  useEffect(() => {
    // 当回答数量达到足够多时，自动显示完成按钮
    if (answeredQuestions >= 5 && !sessionState.isComplete) {
      // 可以在这里添加一些提示，告诉用户可以结束访谈了
    }
  }, [answeredQuestions, sessionState.isComplete]);
  
  // 语音输入：点击切换录音状态
  const handleVoiceToggle = () => {
    if (isProcessing) return; // 正在处理时不允许操作
    
    if (isListening) {
      // 当前正在录音，点击停止
      stopListening();
    } else {
      // 当前未录音，点击开始
      clearSpeechError();
      startListening();
    }
  };

  // 重新生成当前问题
  const handleRegenerateQuestion = async () => {
    try {
      await generateQuestionStream();
    } catch (error) {
      console.error('Failed to regenerate question:', error);
    }
  };
  
  // 渲染问题历史
  const renderQuestionHistory = () => {
    const answeredQuestions = sessionState.questions.slice(0, sessionState.currentQuestionIndex);
    
    if (answeredQuestions.length === 0) return null;
    
    return (
      <Card withBorder padding="md" mb="md">
        <Title order={4} mb="md">访谈记录</Title>
        <Timeline active={answeredQuestions.length} bulletSize={24} lineWidth={2}>
          {answeredQuestions.map((question, index) => (
            <Timeline.Item
              key={question.id}
              bullet={<IconCheck size={12} />}
              title={`问题 ${index + 1}`}
            >
              <Text size="sm" color="dimmed" mb="xs">
                {question.content}
              </Text>
              <Text size="sm">
                {sessionState.answers[question.id]?.content || '（未回答）'}
              </Text>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    );
  };
  
  // 计算进度（最少5个问题为100%）
  const minQuestions = 5;
  const progress = Math.min((answeredQuestions / minQuestions) * 100, 100);
  const isReadyToComplete = answeredQuestions >= minQuestions;
  
  return (
    <div>
      <LoadingOverlay visible={sessionState.isGeneratingQuestion && sessionState.questions.length === 0} />
      
      {/* 访谈进度 */}
      <Card withBorder padding="md" mb="md">
        <Group position="apart" mb="md">
          <div style={{ flex: 1 }}>
            <Title order={3}>AI 访谈进行中</Title>
            <Text size="sm" color="dimmed">
              已完成 {answeredQuestions} 个问题。
              {isReadyToComplete ? '已达到最少问题数，可以结束访谈或继续提问。' : `至少需要 ${minQuestions} 个问题。`}
              {totalQuestions > 0 && `当前第 ${sessionState.currentQuestionIndex + 1} 题`}
            </Text>
          </div>
          
          <Group spacing="xs">
            <Badge 
              color={progress >= 100 ? 'green' : progress >= 60 ? 'yellow' : 'blue'}
              variant="light"
              size="lg"
            >
              {Math.round(progress)}% 完成
              {progress >= 100 && ' ✓'}
            </Badge>
            
            {/* 当达到最少问题数时显示操作按钮 */}
            {isReadyToComplete && (
              <Group spacing="xs">
                <Button 
                  color="green"
                  size="sm"
                  onClick={() => updateInterviewState({ currentStep: 'completed' })}
                  leftIcon={<IconCheck size={14} />}
                >
                  生成访谈稿
                </Button>
              </Group>
            )}
          </Group>
        </Group>
        <Progress value={progress} size="sm" />
      </Card>
      
      {/* 错误提示 */}
      {sessionState.error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="访谈错误" 
          color="red"
          variant="light"
          mb="md"
        >
          {sessionState.error}
        </Alert>
      )}
      
      {/* 当前问题 */}
      {(currentQuestion || sessionState.streamingQuestion) && (
        <Card shadow="sm" padding="xl" withBorder mb="md">
          <Stack spacing="md">
            <Group position="apart" align="flex-start">
              <div style={{ flex: 1 }}>
                <Group spacing="xs" mb="sm">
                  <IconMessageQuestion size={20} color="blue" />
                  <Badge variant="light">
                    问题 {sessionState.currentQuestionIndex + 1}
                  </Badge>
                  {currentQuestion?.category && (
                    <Badge variant="outline" size="sm">
                      {currentQuestion.category}
                    </Badge>
                  )}
                  {currentQuestion?.isFromPreview && (
                    <Badge color="green" variant="light" size="sm">
                      ⭐ 预设精选
                    </Badge>
                  )}
                  {currentQuestion?.isFollowUp && (
                    <Badge color="orange" variant="light" size="sm">
                      追问
                    </Badge>
                  )}
                  {sessionState.streamingQuestion && (
                    <Badge color="blue" variant="light" size="sm">
                      生成中...
                    </Badge>
                  )}
                </Group>
                
                <Text size="lg" weight={500} mb="md">
                  {sessionState.streamingQuestion || currentQuestion?.content}
                </Text>
                
                {currentQuestion?.explanation && (
                  <Alert color="blue" variant="light" title="问题说明" mb="md">
                    <Text size="sm">{currentQuestion.explanation}</Text>
                  </Alert>
                )}
              </div>
              
              <Group spacing="xs">
                <Tooltip label="重新生成问题">
                  <ActionIcon 
                    variant="light" 
                    onClick={handleRegenerateQuestion}
                    loading={sessionState.isGeneratingQuestion}
                    disabled={sessionState.streamingQuestion}
                  >
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
            
            {/* 只有在问题生成完成且不是流式生成中时才显示回答框 */}
            {currentQuestion && !sessionState.streamingQuestion && (
              <>
                {/* 语音错误提示 */}
                {speechError && (
                  <Alert color="red" variant="light" mb="sm" onClose={clearSpeechError}>
                    <Group position="apart">
                      <Text size="sm">{speechError}</Text>
                      {speechError.includes('语言不支持') && (
                        <Button size="xs" variant="subtle" onClick={() => switchLanguage('en-US')}>
                          切换为英文
                        </Button>
                      )}
                    </Group>
                  </Alert>
                )}
                
                {/* 语音识别状态提示 */}
                {isListening && (
                  <Alert color="blue" variant="light" mb="sm">
                    <Group spacing="xs">
                      <IconMicrophone size={16} />
                      <div style={{ flex: 1 }}>
                        <Text size="sm">
                          正在录音中，请说话...（中文模式）
                        </Text>
                        {transcript && (
                          <Text size="xs" color="dimmed" mt="xs">实时识别：{transcript}</Text>
                        )}
                      </div>
                    </Group>
                  </Alert>
                )}
                
                {/* 语音处理状态提示 */}
                {isProcessing && (
                  <Alert color="yellow" variant="light" mb="sm">
                    <Group spacing="xs">
                      <IconClock size={16} />
                      <Text size="sm">正在处理语音识别，请稍候...</Text>
                    </Group>
                  </Alert>
                )}
                
                <div style={{ position: 'relative' }}>
                  <Textarea
                    placeholder="请输入您的回答..."
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    minRows={4}
                    maxRows={8}
                    autosize
                    rightSection={
                      shouldShowSpeechButton ? (
                        <Tooltip label={isListening ? '点击停止录音' : '点击开始录音'}>
                          <ActionIcon
                            size="lg"
                            color={isListening ? 'red' : 'blue'}
                            variant={isListening ? 'filled' : 'light'}
                            onClick={handleVoiceToggle}
                            disabled={isProcessing}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '12px',
                              zIndex: 1,
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            {isListening ? (
                              <IconMicrophoneOff size={18} />
                            ) : (
                              <IconMicrophone size={18} />
                            )}
                          </ActionIcon>
                        </Tooltip>
                      ) : null
                    }
                    rightSectionWidth={shouldShowSpeechButton ? 60 : 0}
                  />
                  
                  {/* 语音相关提示 */}
                  {!shouldShowSpeechButton ? (
                    <Text size="xs" color="dimmed" mt="xs">
                      要使用语音功能，请确保：1) 在 API 配置中启用并配置语音识别 API；2) 使用支持语音录制的现代浏览器；3) 网站运行在安全上下文（HTTPS）中
                    </Text>
                  ) : (
                    <Text size="xs" color="dimmed" mt="xs">
                      语音识别语言：中文 | 点击麦克风按钮开始/停止录音
                    </Text>
                  )}
                </div>
                
                <Group position="apart">
                  <Group>
                    <Button 
                      variant="subtle" 
                      onClick={handleSkipQuestion}
                      disabled={isAnswering}
                    >
                      跳过此题
                    </Button>
                    <Text size="xs" color="dimmed">
                      字数: {currentAnswer.length}
                    </Text>
                  </Group>
                  
                  <Group>
                    <Button 
                      onClick={handleSubmitAnswer}
                      disabled={!currentAnswer.trim() || isAnswering}
                      loading={isAnswering}
                      leftIcon={<IconMessageCheck size={16} />}
                    >
                      提交回答
                    </Button>
                  </Group>
                </Group>
              </>
            )}
          </Stack>
        </Card>
      )}
      
      {/* 生成下一个问题 */}
      {sessionState.isGeneratingQuestion && currentQuestion && (
        <Card withBorder padding="md" mb="md">
          <Group>
            <IconBulb size={20} color="yellow" />
            <Text>AI 正在根据您的回答生成下一个问题...</Text>
          </Group>
        </Card>
      )}
      
      {/* 访谈历史 */}
      {renderQuestionHistory()}
      
      {/* 上下文信息 */}
      {contentState.analysisResult && (
        <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa' }}>
          <Title order={5} mb="sm">访谈上下文</Title>
          <Text size="sm" color="dimmed" mb="xs">
            <strong>内容摘要：</strong>{contentState.analysisResult.summary}
          </Text>
          {contentState.analysisResult.keyTopics?.length > 0 && (
            <Group spacing="xs">
              <Text size="sm" color="dimmed">关键主题：</Text>
              {contentState.analysisResult.keyTopics.map((topic, index) => (
                <Badge key={index} size="xs" variant="light">{topic}</Badge>
              ))}
            </Group>
          )}
        </Card>
      )}
    </div>
  );
}