import React, { useEffect } from 'react';
import { 
  Container, 
  Stepper, 
  Group, 
  Button,
  Text,
  Stack,
  Paper,
  Center,
  Alert
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
    loadApiConfig,
    loadSessionData,
    updateInterviewState,
    clearApiConfig
  } = useInterviewStore();
  
  // 初始化时检查API配置和会话数据
  useEffect(() => {
    // 加载API配置
    const apiLoaded = loadApiConfig();
    
    // 加载会话数据
    const sessionLoaded = loadSessionData();
    
    // 根据加载的数据决定当前步骤
    if (apiLoaded && apiState.isConfigured) {
      if (sessionLoaded) {
        // 如果有保存的会话数据，根据数据决定步骤
        // 这里的逻辑将在状态加载时自动设置
      } else {
        updateInterviewState({ currentStep: 'content-input' });
      }
    }
  }, []);
  
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
  
  // 手动切换步骤（仅在某些条件下允许）
  const handleStepChange = (stepIndex) => {
    const step = steps[stepIndex];
    if (!step) return;
    
    // 检查是否允许切换到该步骤
    if (stepIndex === 0) {
      // 总是允许回到API配置
      updateInterviewState({ currentStep: 'api-config' });
    } else if (stepIndex === 1 && apiState.isConfigured) {
      // 只有在API配置完成后才能进入内容准备
      updateInterviewState({ currentStep: 'content-input' });
    }
    // 其他步骤不允许手动跳转
  };
  
  // 重置配置
  const handleResetConfig = () => {
    clearApiConfig();
    updateInterviewState({ currentStep: 'api-config' });
  };
  
  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        {/* 页面标题 */}
        <div>
          <Text size="xl" weight={700} mb="xs">
            AI 访谈工具
          </Text>
          <Text color="dimmed">
            通过 AI 自动生成深度访谈问题，帮助独立创作者完成高质量访谈
          </Text>
        </div>
        
        {/* 步骤指示器 */}
        <Paper withBorder padding="md">
          <Stepper 
            active={currentStepIndex} 
            onStepClick={handleStepChange}
            breakpoint="sm"
            allowNextStepsSelect={false}
          >
            {steps.map((step, index) => (
              <Stepper.Step
                key={step.value}
                label={step.label}
                description={step.description}
                icon={<step.icon size={18} />}
                allowStepSelect={
                  index === 0 || // 总是允许回到API配置
                  (index === 1 && apiState.isConfigured) // API配置完成后可以回到内容准备
                }
              />
            ))}
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
            {currentStepIndex > 0 && (
              <Button 
                variant="subtle" 
                size="sm" 
                onClick={handleResetConfig}
              >
                重新配置
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
        
        {/* 底部帮助信息 */}
        <Paper withBorder padding="sm" style={{ backgroundColor: '#f8f9fa' }}>
          <Group position="center">
            <Text size="xs" color="dimmed" align="center">
              使用提示: 依次完成 API 配置 → 内容准备 → 进行访谈 → 生成访谈稿
            </Text>
          </Group>
        </Paper>
      </Stack>
    </Container>
  );
}