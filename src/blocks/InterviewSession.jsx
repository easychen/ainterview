import React, { useState, useEffect } from 'react';
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
  IconBulb
} from '@tabler/icons-react';
import { useInterviewStore } from '../hooks/useInterviewStore.jsx';

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
        // 检查是否应该结束访谈
        if (answeredQuestions >= 5) { // 可以设置最少问题数
          // 可以选择结束或继续
        } else {
          await handleGenerateQuestion();
        }
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
          <div>
            <Title order={3}>AI 访谈进行中</Title>
            <Text size="sm" color="dimmed">
              已完成 {answeredQuestions} 个问题。
              {isReadyToComplete ? '已达到最少问题数，可以结束访谈。' : `至少需要 ${minQuestions} 个问题。`}
              {totalQuestions > 0 && `当前第 ${sessionState.currentQuestionIndex + 1} 题`}
            </Text>
          </div>
          <Badge 
            color={progress >= 100 ? 'green' : progress >= 60 ? 'yellow' : 'blue'}
            variant="light"
            size="lg"
          >
            {Math.round(progress)}% 完成
            {progress >= 100 && ' ✓'}
          </Badge>
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
                <Textarea
                  placeholder="请输入您的回答..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  minRows={4}
                  maxRows={8}
                  autosize
                />
                
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
                    {answeredQuestions >= 3 && (
                      <Button 
                        variant="outline"
                        onClick={handleCompleteInterview}
                        leftIcon={<IconPlayerStop size={16} />}
                      >
                        结束访谈
                      </Button>
                    )}
                    {/* 当问答数量达到一定数量时，显示生成访谈稿按钮 */}
                    {answeredQuestions >= 5 && (
                      <Button 
                        color="green"
                        onClick={() => updateInterviewState({ currentStep: 'completed' })}
                        leftIcon={<IconCheck size={16} />}
                      >
                        生成访谈稿
                      </Button>
                    )}
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