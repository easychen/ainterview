import React, { useState, useEffect } from 'react';
import { 
  TextInput, 
  Button, 
  Card, 
  Select, 
  Alert, 
  LoadingOverlay,
  Stack,
  Title,
  Text,
  Group,
  PasswordInput,
  Tabs,
  Switch
} from '@mantine/core';
import { IconKey, IconServer, IconCheck, IconAlertCircle, IconMicrophone } from '@tabler/icons-react';
import { useInterviewStore } from '../hooks/useInterviewStore.jsx';
import { APIConfigManager } from '../../lib/apiConfig.js';

export function APIConfig() {
  const { 
    apiState, 
    validateApiConfig, 
    updateApiState, 
    loadApiConfig 
  } = useInterviewStore();
  
  const [form, setForm] = useState({
    apiKey: '',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'qwen/Qwen2.5-7B-Instruct'
  });
  
  // 语音API配置表单
  const [speechForm, setSpeechForm] = useState({
    enabled: false,
    apiKey: '',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'FunAudioLLM/SenseVoiceSmall'
  });
  
  const [activeTab, setActiveTab] = useState('main');
  
  const [isLoading, setIsLoading] = useState(false);
  
  // 预设的API服务商
  const apiProviders = [
    { 
      label: 'SiliconFlow', 
      value: 'https://api.siliconflow.cn/v1',
      models: [
        'qwen/Qwen2.5-7B-Instruct',
        'qwen/Qwen2.5-14B-Instruct', 
        'qwen/Qwen2.5-32B-Instruct',
        'qwen/Qwen2.5-72B-Instruct',
        'deepseek-ai/DeepSeek-V2.5',
        'meta-llama/Meta-Llama-3.1-8B-Instruct',
        'meta-llama/Meta-Llama-3.1-70B-Instruct',
        'microsoft/WizardLM-2-8x22B'
      ]
    },
    { 
      label: 'DeepSeek', 
      value: 'https://api.deepseek.com/v1',
      models: ['deepseek-chat']
    },
    { 
      label: 'OpenAI', 
      value: 'https://api.openai.com/v1',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview', 'gpt-4o']
    },
    { 
      label: 'Azure OpenAI', 
      value: 'https://your-resource.openai.azure.com',
      models: ['gpt-35-turbo', 'gpt-4', 'gpt-4-32k']
    },
    { 
      label: '自定义', 
      value: 'custom',
      models: []
    }
  ];
  
  const [selectedProvider, setSelectedProvider] = useState('https://api.siliconflow.cn/v1');
  const [availableModels, setAvailableModels] = useState([
    'qwen/Qwen2.5-7B-Instruct',
    'qwen/Qwen2.5-14B-Instruct', 
    'qwen/Qwen2.5-32B-Instruct',
    'qwen/Qwen2.5-72B-Instruct',
    'deepseek-ai/DeepSeek-V2.5',
    'meta-llama/Meta-Llama-3.1-8B-Instruct',
    'meta-llama/Meta-Llama-3.1-70B-Instruct',
    'microsoft/WizardLM-2-8x22B'
  ]);
  const [customModel, setCustomModel] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);
  
  useEffect(() => {
    // 尝试加载已保存的配置
    const config = APIConfigManager.loadConfig();
    if (config && config.apiKey) {
      // 更新状态存储
      updateApiState({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || 'https://api.siliconflow.cn/v1',
        model: config.model || 'qwen/Qwen2.5-7B-Instruct',
        isConfigured: config.isValid === true,
        lastValidated: config.lastValidated
      });
      
      // 更新表单
      setForm({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || 'https://api.siliconflow.cn/v1',
        model: config.model || 'qwen/Qwen2.5-7B-Instruct'
      });
      setSelectedProvider(config.baseUrl || 'https://api.siliconflow.cn/v1');
      
      // 检查是否是自定义模型
      const provider = apiProviders.find(p => p.value === config.baseUrl);
      if (provider && !provider.models.includes(config.model)) {
        setIsCustomModel(true);
        setCustomModel(config.model);
      }
    }
    
    // 加载语音API配置
    const speechConfig = APIConfigManager.loadSpeechConfig();
    if (speechConfig) {
      setSpeechForm(speechConfig);
    }
  }, [updateApiState]);
  
  // 当选择API服务商时更新相关配置
  useEffect(() => {
    const provider = apiProviders.find(p => p.value === selectedProvider);
    if (provider) {
      setAvailableModels(provider.models);
      if (selectedProvider !== 'custom') {
        setForm(prev => ({
          ...prev,
          baseUrl: selectedProvider,
          model: provider.models[0] || ''
        }));
        setIsCustomModel(false);
        setCustomModel('');
      }
    }
  }, [selectedProvider]);
  
  const handleProviderChange = (value) => {
    setSelectedProvider(value);
  };
  
  const handleFormChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleValidate = async () => {
    if (!form.apiKey.trim()) {
      updateApiState({ error: '请输入API密钥' });
      return;
    }
    
    if (!form.baseUrl.trim()) {
      updateApiState({ error: '请输入API基础URL' });
      return;
    }
    
    setIsLoading(true);
    try {
      await validateApiConfig(form);
      // 保存配置
      APIConfigManager.saveConfig(form);
    } catch (error) {
      console.error('API validation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 保存配置（不验证）
  const handleSave = () => {
    if (!form.apiKey.trim()) {
      updateApiState({ error: '请输入API密钥' });
      return;
    }
    
    if (!form.baseUrl.trim()) {
      updateApiState({ error: '请输入API基础URL' });
      return;
    }
    
    // 保存配置但不验证
    APIConfigManager.saveConfig(form);
    updateApiState({ 
      ...form,
      isConfigured: true,
      error: null 
    });
  };
  
  // 保存语音API配置
  const handleSaveSpeechConfig = () => {
    APIConfigManager.saveSpeechConfig(speechForm);
    // 可以添加成功提示
  };
  
  const handleReset = () => {
    setForm({
      apiKey: '',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'qwen/Qwen2.5-7B-Instruct'
    });
    setSelectedProvider('https://api.siliconflow.cn/v1');
    setIsCustomModel(false);
    setCustomModel('');
    updateApiState({ error: null });
  };
  
  const handleResetSpeech = () => {
    setSpeechForm({
      enabled: false,
      apiKey: '',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: 'FunAudioLLM/SenseVoiceSmall'
    });
  };
  
  // 处理模型变更
  const handleModelChange = (value) => {
    if (value === 'custom') {
      setIsCustomModel(true);
      setForm(prev => ({ ...prev, model: customModel }));
    } else {
      setIsCustomModel(false);
      setForm(prev => ({ ...prev, model: value }));
    }
  };
  
  // 处理自定义模型输入
  const handleCustomModelChange = (value) => {
    setCustomModel(value);
    if (isCustomModel) {
      setForm(prev => ({ ...prev, model: value }));
    }
  };
  
  // 处理语音配置表单变更
  const handleSpeechFormChange = (field, value) => {
    setSpeechForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // 语音API服务商选项
  const speechApiProviders = [
    { 
      label: 'SiliconFlow', 
      value: 'https://api.siliconflow.cn/v1',
      models: [
        'FunAudioLLM/SenseVoiceSmall',
        'FunAudioLLM/CosyVoice-300M',
        'FunAudioLLM/CosyVoice-300M-SFT'
      ]
    },
    { 
      label: 'OpenAI', 
      value: 'https://api.openai.com/v1',
      models: ['whisper-1']
    },
    { 
      label: '自定义', 
      value: 'custom',
      models: []
    }
  ];
  
  return (
    <Card shadow="sm" padding="xl" radius="md" withBorder>
      <LoadingOverlay visible={isLoading || apiState.isValidating} />
      
      <Stack spacing="md">
        <div>
          <Title order={2} size="h3" mb="xs">
            API 配置
          </Title>
          <Text color="dimmed" size="sm">
            配置您的AI API密钥和服务地址，开始使用访谈工具
          </Text>
        </div>
        
        <Tabs value={activeTab} onTabChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="main" icon={<IconServer size={16} />}>
              主要 API 配置
            </Tabs.Tab>
            <Tabs.Tab value="speech" icon={<IconMicrophone size={16} />}>
              语音识别配置
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="main" pt="md">
            <Stack spacing="md">
              {apiState.error && (
                <Alert 
                  icon={<IconAlertCircle size={16} />} 
                  title="配置错误" 
                  color="red"
                  variant="light"
                >
                  {apiState.error}
                </Alert>
              )}
              
              {apiState.isConfigured && (
                <Alert 
                  icon={<IconCheck size={16} />} 
                  title="配置成功" 
                  color="green"
                  variant="light"
                >
                  API配置验证通过，可以开始使用访谈工具
                </Alert>
              )}
              
              <Select
                label="API 服务商"
                placeholder="选择API服务商"
                value={selectedProvider}
                onChange={handleProviderChange}
                data={apiProviders.map(p => ({ value: p.value, label: p.label }))}
                icon={<IconServer size={16} />}
              />
              
              {selectedProvider === 'custom' && (
                <TextInput
                  label="自定义 API 基础URL"
                  placeholder="https://api.example.com/v1"
                  value={form.baseUrl}
                  onChange={(e) => handleFormChange('baseUrl', e.target.value)}
                  icon={<IconServer size={16} />}
                  required
                />
              )}
              
              <PasswordInput
                label="API 密钥"
                placeholder="输入您的API密钥"
                value={form.apiKey}
                onChange={(e) => handleFormChange('apiKey', e.target.value)}
                icon={<IconKey size={16} />}
                required
                description="您的API密钥将被加密存储在本地浏览器中"
              />
              
              <div>
                <Select
                  label="AI 模型"
                  placeholder="选择AI模型"
                  value={isCustomModel ? 'custom' : form.model}
                  onChange={handleModelChange}
                  data={[
                    ...availableModels.map(model => ({ value: model, label: model })),
                    ...(availableModels.length > 0 ? [{ value: 'custom', label: '自定义模型' }] : [])
                  ]}
                />
                
                {isCustomModel && (
                  <TextInput
                    label="自定义模型名称"
                    placeholder="输入模型名称，如 gpt-4 或 qwen/Qwen2.5-7B-Instruct"
                    value={customModel}
                    onChange={(e) => handleCustomModelChange(e.target.value)}
                    mt="sm"
                    description="请输入完整的模型名称"
                  />
                )}
              </div>
              
              <Group position="right" mt="md">
                <Button variant="subtle" onClick={handleReset}>
                  重置
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!form.apiKey.trim() || !form.baseUrl.trim()}
                >
                  保存配置
                </Button>
                <Button 
                  onClick={handleValidate}
                  loading={isLoading || apiState.isValidating}
                  disabled={!form.apiKey.trim() || !form.baseUrl.trim()}
                  variant="filled"
                >
                  验证连接
                </Button>
              </Group>
              
              {apiState.lastValidated && (
                <Text size="xs" color="dimmed" align="center">
                  上次验证时间: {new Date(apiState.lastValidated).toLocaleString()}
                </Text>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="speech" pt="md">
            <Stack spacing="md">
              <div>
                <Text size="sm" color="dimmed" mb="md">
                  配置语音识别 API 后，访谈页面将使用 API 识别语音。若不配置，将不显示语音按钮。
                </Text>
              </div>
              
              <Switch
                label="启用语音识别 API"
                description="开启后将使用 API 进行语音识别，关闭后将隐藏语音按钮"
                checked={speechForm.enabled}
                onChange={(event) => handleSpeechFormChange('enabled', event.currentTarget.checked)}
              />
              
              {speechForm.enabled && (
                <>
                  <Select
                    label="语音 API 服务商"
                    placeholder="选择语音API服务商"
                    value={speechForm.baseUrl}
                    onChange={(value) => {
                      handleSpeechFormChange('baseUrl', value);
                      const provider = speechApiProviders.find(p => p.value === value);
                      if (provider && provider.models.length > 0) {
                        handleSpeechFormChange('model', provider.models[0]);
                      }
                    }}
                    data={speechApiProviders.map(p => ({ value: p.value, label: p.label }))}
                    icon={<IconServer size={16} />}
                  />
                  
                  {speechForm.baseUrl === 'custom' && (
                    <TextInput
                      label="自定义语音 API 基础URL"
                      placeholder="https://api.example.com/v1"
                      value={speechForm.baseUrl}
                      onChange={(e) => handleSpeechFormChange('baseUrl', e.target.value)}
                      icon={<IconServer size={16} />}
                      required
                    />
                  )}
                  
                  <PasswordInput
                    label="语音 API 密钥"
                    placeholder="输入您的语音API密钥"
                    value={speechForm.apiKey}
                    onChange={(e) => handleSpeechFormChange('apiKey', e.target.value)}
                    icon={<IconKey size={16} />}
                    required
                    description="语音API密钥将被加密存储在本地浏览器中"
                  />
                  
                  <Select
                    label="语音识别模型"
                    placeholder="选择语音识别模型"
                    value={speechForm.model}
                    onChange={(value) => handleSpeechFormChange('model', value)}
                    data={(() => {
                      const provider = speechApiProviders.find(p => p.value === speechForm.baseUrl);
                      return provider ? provider.models.map(model => ({ value: model, label: model })) : [];
                    })()}
                  />
                </>
              )}
              
              <Group position="right" mt="md">
                <Button variant="subtle" onClick={handleResetSpeech}>
                  重置
                </Button>
                <Button 
                  onClick={handleSaveSpeechConfig}
                  disabled={speechForm.enabled && (!speechForm.apiKey.trim() || !speechForm.baseUrl.trim())}
                >
                  保存语音配置
                </Button>
              </Group>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Card>
  );
}