import useAppState from '@/hooks/useAppState'
import { useNavigate } from 'react-router-dom';
import useVersion from '@/hooks/useVersion';
import Header from '@/blocks/header';
import { Button, Container, Stack, Title, Text, Card, Group } from '@mantine/core';
import { IconRobot, IconFileText, IconMessages } from '@tabler/icons-react';

export default function Home() {
  const state = useAppState();
  const nav = useNavigate();
  const { version: data, error, isLoading } = useVersion()
  
  return <>
    <Header />
    <Container size="lg" py="xl">
      <Stack spacing="xl" align="center">
        <div style={{ textAlign: 'center' }}>
          <Title order={1} mb="md">AinterReview</Title>
          <Text color="dimmed" size="lg">
            AI 驱动的智能访谈工具，帮助独立创作者完成高质量访谈
          </Text>
        </div>
        
        <Card shadow="sm" padding="xl" radius="md" withBorder style={{ maxWidth: 600, width: '100%' }}>
          <Stack spacing="md">
            <Group position="center">
              <IconRobot size={32} color="blue" />
              <Title order={2}>AI 访谈工具</Title>
            </Group>
            
            <Text align="center" color="dimmed">
              通过 AI 自动分析内容并生成有深度的访谈问题，让创作者专注于分享独特见解
            </Text>
            
            <Stack spacing="xs">
              <Group spacing="xs">
                <IconFileText size={16} color="gray" />
                <Text size="sm">上传文档或输入网址作为访谈背景</Text>
              </Group>
              <Group spacing="xs">
                <IconMessages size={16} color="gray" />
                <Text size="sm">AI 智能生成有深度的访谈问题</Text>
              </Group>
              <Group spacing="xs">
                <IconFileText size={16} color="gray" />
                <Text size="sm">自动生成结构化访谈稿</Text>
              </Group>
            </Stack>
            
            <Button 
              size="lg" 
              onClick={() => nav('/interview')}
              leftIcon={<IconRobot size={18} />}
            >
              开始 AI 访谈
            </Button>
          </Stack>
        </Card>
        
        {/* 原有的调试内容，保持兼容性 */}
        <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa', maxWidth: 400, width: '100%' }}>
          <Stack spacing="xs">
            <Text size="sm" color="dimmed">开发调试信息:</Text>
            <Text size="xs">{state.name} - <button onClick={state.incName}>+++</button></Text>
            
            <div>
              <button className="my-5" onClick={() => nav('/')}>go back</button>
            </div>
            
            <div className="border p-5">
              {error && <div>error</div>}
              {isLoading && <div>loading</div>}
              {data && <div style={{ fontSize: '10px', overflow: 'hidden' }}>{JSON.stringify(data)}</div>}
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  </>
}