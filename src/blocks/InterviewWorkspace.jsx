import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Stepper, 
  Group, 
  Button,
  Text,
  Stack,
  Paper,
  Center,
  Alert,
  Modal
} from '@mantine/core';
import { 
  IconSettings, 
  IconFileText, 
  IconMessages, 
  IconCheck,
  IconAlertCircle
} from '@tabler/icons-react';
import { useInterviewStore } from '../hooks/useInterviewStore.jsx';
import { APIConfig } from './APIConfig.jsx';
import { ContentInput } from './ContentInput.jsx';
import { InterviewSession } from './InterviewSession.jsx';
import { InterviewResult } from './InterviewResult.jsx';

export function InterviewWorkspace() {
  const { 
    interviewState, 
    apiState,
    contentState,
    sessionState,
    loadApiConfig,
    loadSessionData,
    updateInterviewState,
    updateContentState,
    clearApiConfig,
    resetQuestionList
  } = useInterviewStore();
  
  // 确认对话框状态
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  
  // 监控状态变化
  useEffect(() => {
    // console.log('InterviewWorkspace: interviewState 变化:', interviewState);
  }, [interviewState]);
  
  // 组件初始化时加载保存的会话数据
  useEffect(() => {
    console.log('InterviewWorkspace: 组件初始化');
    
    // 首先加载API配置
    const hasApiConfig = loadApiConfig();
    console.log('API配置加载结果:', hasApiConfig);
    
    // 然后加载会话数据
    const hasSessionData = loadSessionData();
    console.log('会话数据加载结果:', hasSessionData);
    
    // 如果没有保存的数据，设置默认状态
    if (!hasSessionData) {
      if (!hasApiConfig) {
        console.log('设置为 API 配置步骤');
        updateInterviewState({ currentStep: 'api-config' });
      }
    }
  }, []); // 只在组件初始化时运行一次
  
  // 获取当前步骤索引
  const getStepIndex = () => {
    switch (interviewState.currentStep) {
      case 'api-config': return 0;
      case 'content-input': return 1;
      case 'analyzing': return 1;
      case 'interviewing': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };
  
  // 步骤配置
  const steps = [
    {
      value: 'api-config',
      label: 'API 配置',
      description: '配置 AI API 密钥和服务地址',
      icon: IconSettings,
      component: APIConfig
    },
    {
      value: 'content-input',
      label: '内容准备',
      description: '添加访谈上下文内容',
      icon: IconFileText,
      component: ContentInput
    },
    {
      value: 'interviewing',
      label: '进行访谈',
      description: 'AI 提问，创作者回答',
      icon: IconMessages,
      component: InterviewSession
    },
    {
      value: 'completed',
      label: '生成访谈稿',
      description: '查看和导出访谈结果',
      icon: IconCheck,
      component: InterviewResult
    }
  ];
  
  const currentStepIndex = getStepIndex();
  const currentStepConfig = steps[currentStepIndex];
  const CurrentComponent = currentStepConfig?.component;
  
  // 手动切换步骤（增强版本，支持更多条件切换）
  const handleStepChange = (stepIndex) => {
    console.log('handleStepChange 被调用，目标步骤索引:', stepIndex);
    const step = steps[stepIndex];
    if (!step) return;
    
    // 检查是否允许切换到该步骤
    if (stepIndex === 0) {
      // 总是允许回到API配置
      updateInterviewState({ currentStep: 'api-config' });
    } else if (stepIndex === 1 && apiState.isConfigured) {
      // 只有在API配置完成后才能进入内容准备
      updateInterviewState({ currentStep: 'content-input' });
    } else if (stepIndex === 2 && apiState.isConfigured && contentState.analysisResult) {
      // 只有在API配置完成且内容已分析后才能进入访谈
      updateInterviewState({ currentStep: 'interviewing' });
    } else if (stepIndex === 3 && sessionState.questions.length > 0 && Object.keys(sessionState.answers).length >= 3) {
      // 只有在有问题且已回答至少3个问题后才能查看结果
      updateInterviewState({ currentStep: 'completed' });
    }
    // 其他情况不允许跳转，可以添加提示
  };
  
  // 重置配置
  const handleResetConfig = () => {
    console.log('警告：handleResetConfig 被调用！');
    // 清除内容分析结果，但保留内容源
    updateContentState({ 
      analysisResult: null, 
      error: null 
    });
    // 跳回内容准备步骤
    updateInterviewState({ currentStep: 'content-input' });
  };
  
  // 重新生成问题（显示确认对话框）
  const handleResetQuestions = () => {
    setResetConfirmOpen(true);
  };
  
  // 确认重置问题列表
  const handleResetConfirm = () => {
    resetQuestionList();
    setResetConfirmOpen(false);
  };
  
  return (
    <Container size="xl" py="xl" >
      <Stack spacing="xl">
        {/* 页面标题 */}
        <div>
          <Text size="xl" weight={700} mb="xs">
            🍒 樱桃钨
          </Text>
          <Text color="dimmed">
            AI 驱动的智能访谈工具，帮助独立创作者完成高质量访谈
          </Text>
        </div>
        
        {/* 步骤指示器 */}
        <Paper padding="md">
          <Stepper 
            active={currentStepIndex} 
            onStepClick={handleStepChange}
            breakpoint="sm"
            allowNextStepsSelect={false}
          >
            {steps.map((step, index) => {
              // 动态计算每个步骤是否可选择
              let allowStepSelect = false;
              if (index === 0) {
                // API配置步骤总是可选择的
                allowStepSelect = true;
              } else if (index === 1 && apiState.isConfigured) {
                // 内容准备步骤在API配置完成后可选择
                allowStepSelect = true;
              } else if (index === 2 && apiState.isConfigured && contentState.analysisResult) {
                // 访谈步骤在内容分析完成后可选择
                allowStepSelect = true;
              } else if (index === 3 && sessionState.questions.length > 0 && Object.keys(sessionState.answers).length >= 3) {
                // 结果步骤在有足够的问答后可选择
                allowStepSelect = true;
              }
              
              return (
                <Stepper.Step
                  key={step.value}
                  label={step.label}
                  description={step.description}
                  icon={<step.icon size={18} />}
                  allowStepSelect={allowStepSelect}
                  style={{
                    cursor: allowStepSelect ? 'pointer' : 'default'
                  }}
                />
              );
            })}
          </Stepper>
        </Paper>
        
        {/* 步骤状态提示 */}
        {interviewState.currentStep === 'analyzing' && (
          <Alert color="blue" title="正在分析内容">
            AI 正在分析您提供的内容，准备生成访谈问题...
          </Alert>
        )}
        
        {/* 快捷操作 */}
        <Group position="apart">
          <Group spacing="xs">
            <Text size="sm" color="dimmed">
              当前步骤: {currentStepConfig?.label}
            </Text>
          </Group>
          
          <Group spacing="xs">
            {currentStepIndex === 1 && (
              <Button 
                variant="subtle" 
                size="sm" 
                onClick={handleResetConfig}
              >
                重新准备
              </Button>
            )}
            {currentStepIndex === 2 && (
              <Button 
                variant="subtle" 
                size="sm" 
                onClick={handleResetQuestions}
              >
                重新生成问题
              </Button>
            )}
            {currentStepIndex === 0 && (
              <Button 
                variant="subtle" 
                size="sm" 
                onClick={() => clearApiConfig()}
              >
                清除配置
              </Button>
            )}
          </Group>
        </Group>
        
        {/* 当前步骤内容 */}
        <Paper shadow="sm" withBorder>
          {CurrentComponent ? (
            <CurrentComponent />
          ) : (
            <Center p="xl">
              <Stack align="center" spacing="md">
                <IconAlertCircle size={48} color="gray" />
                <Text color="dimmed">未知的步骤状态</Text>
                <Button onClick={() => updateInterviewState({ currentStep: 'api-config' })}>
                  返回首页
                </Button>
              </Stack>
            </Center>
          )}
        </Paper>
        
        {/* 重置问题确认对话框 */}
        <Modal
          opened={resetConfirmOpen}
          onClose={() => setResetConfirmOpen(false)}
          title="确认重新生成问题"
          size="sm"
        >
          <Stack spacing="md">
            <Text>
              重新生成问题将清除当前的访谈进度，包括：
            </Text>
            <Text size="sm" color="dimmed" ml="md">
              • 所有已生成的问题<br/>
              • 所有问题的回答记录<br/>
              • 当前访谈进度
            </Text>
            <Text size="sm" color="orange">
              内容分析结果将保留，您可以重新开始问答。
            </Text>
            <Group position="right" mt="md">
              <Button variant="outline" onClick={() => setResetConfirmOpen(false)}>
                取消
              </Button>
              <Button color="orange" onClick={handleResetConfirm}>
                确认重置
              </Button>
            </Group>
          </Stack>
        </Modal>
        
        {/* 底部帮助信息 */}
        {/* <Paper withBorder padding="sm" style={{ backgroundColor: '#f8f9fa' }}>
          <Group position="center">
            <Text size="xs" color="dimmed" align="center">
              使用提示: 依次完成 API 配置 → 内容准备 → 进行访谈 → 生成访谈稿
            </Text>
          </Group>
        </Paper> */}
      </Stack>
    </Container>
  );
}