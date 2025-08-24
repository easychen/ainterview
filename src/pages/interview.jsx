import React, { useEffect, useState } from 'react';
import { Modal, Button, Text, Group, Alert, Stack, Divider } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { InterviewWorkspace } from '../blocks/InterviewWorkspace.jsx';
import { APIConfigManager } from '../../lib/apiConfig.js';
import { useInterviewStore } from '../hooks/useInterviewStore.jsx';

export default function InterviewPage() {
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [presetData, setPresetData] = useState(null);
  const [presetError, setPresetError] = useState(null);
  const { updateApiState, loadApiConfig } = useInterviewStore();

  useEffect(() => {
    // 检查URL参数中是否包含preset
    const urlParams = new URLSearchParams(window.location.search);
    const presetParam = urlParams.get('preset');
    
    if (presetParam) {
      try {
        // 解析预设配置
        const parsedPreset = APIConfigManager.parsePresetConfig(presetParam);
        setPresetData(parsedPreset);
        setPresetModalOpen(true);
        
        // 清除URL参数，避免重复处理
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } catch (error) {
        setPresetError(error.message);
        setPresetModalOpen(true);
      }
    }
  }, []);

  // 应用预设配置
  const handleApplyPreset = () => {
    try {
      APIConfigManager.applyPresetConfig(presetData);
      
      // 重新加载配置到状态管理
      loadApiConfig();
      
      // 更新API状态，触发APIConfig组件重新渲染
      const apiConfig = APIConfigManager.loadConfig();
      const speechConfig = APIConfigManager.loadSpeechConfig();
      
      updateApiState({
        apiKey: apiConfig.apiKey,
        baseUrl: apiConfig.baseUrl,
        model: apiConfig.model,
        isConfigured: true,
        error: null,
        lastValidated: null // 重置验证状态，需要用户重新验证
      });
      
      setPresetModalOpen(false);
      setPresetData(null);
      setPresetError(null);
      
      // 添加一个小延迟确保状态更新完成
      setTimeout(() => {
        console.log('预设配置已成功应用');
      }, 100);
    } catch (error) {
      setPresetError('应用预设配置失败：' + error.message);
    }
  };

  // 取消应用预设配置
  const handleCancelPreset = () => {
    setPresetModalOpen(false);
    setPresetData(null);
    setPresetError(null);
  };

  return (
    <>
      <InterviewWorkspace />
      
      {/* 预设配置确认弹窗 */}
      <Modal
        opened={presetModalOpen}
        onClose={handleCancelPreset}
        title="应用预设配置"
        size="md"
        centered
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Stack spacing="md">
          {presetError ? (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="配置错误"
              color="red"
              variant="light"
            >
              {presetError}
            </Alert>
          ) : (
            <>
              <Alert
                icon={<IconCheck size={16} />}
                title="发现预设配置"
                color="blue"
                variant="light"
              >
                检测到有人分享给您的API配置，是否要应用这些配置？
              </Alert>
              
              {presetData && (
                <>
                  <Divider label="配置详情" labelPosition="center" />
                  
                  <Stack spacing="xs">
                    <div>
                      <Text size="sm" weight={500}>API配置：</Text>
                      <Text size="xs" color="dimmed">服务地址: {presetData.api.baseUrl}</Text>
                      <Text size="xs" color="dimmed">模型: {presetData.api.model}</Text>
                      <Text size="xs" color="dimmed">API密钥: {'●'.repeat(8)}</Text>
                    </div>
                    
                    {presetData.speech && presetData.speech.enabled && (
                      <div>
                        <Text size="sm" weight={500}>语音识别配置：</Text>
                        <Text size="xs" color="dimmed">服务地址: {presetData.speech.baseUrl}</Text>
                        <Text size="xs" color="dimmed">模型: {presetData.speech.model}</Text>
                        <Text size="xs" color="dimmed">API密钥: {'●'.repeat(8)}</Text>
                      </div>
                    )}
                    
                    <Text size="xs" color="dimmed">
                      分享时间: {new Date(presetData.timestamp).toLocaleString()}
                    </Text>
                  </Stack>
                </>
              )}
            </>
          )}
          
          <Group position="right" mt="md">
            <Button variant="subtle" onClick={handleCancelPreset}>
              取消
            </Button>
            {!presetError && (
              <Button onClick={handleApplyPreset}>
                应用配置
              </Button>
            )}
            {presetError && (
              <Button onClick={handleCancelPreset}>
                关闭
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
    </>
  );
}