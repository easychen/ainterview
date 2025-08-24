import useAppState from '@/hooks/useAppState'
import { useNavigate } from 'react-router-dom';
import { Button, Container, Stack, Title, Text, Card, Group } from '@mantine/core';
import { IconRobot, IconFileText, IconMessages, IconGitMerge } from '@tabler/icons-react';

export default function Home() {
  const state = useAppState();
  const nav = useNavigate();
  
  return <>
    <Container size="lg" py="xl" mt="xl">
      <Stack spacing="xl" align="center">
        <div style={{ textAlign: 'center' }}>
          <Title order={1} mb="md">樱桃钨</Title>
          <Text color="dimmed" size="lg">
            AI 驱动的智能访谈工具，帮助独立创作者完成高质量访谈
          </Text>
        </div>
        
        <Card shadow="sm" padding="xl" radius="md" withBorder style={{ maxWidth: 600, width: '100%' }}>
          <Stack spacing="md">
            <Stack spacing="md" align="center">
              <div><img src="/logo.png" alt="Logo" width={256} /></div>
            </Stack>
            
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

            <Group position="center" spacing="md">
              <Button
                variant="subtle"
                component="a"
                href="https://github.com/easychen/ainterview"
                target="_blank"
                leftIcon={<IconGitMerge size={16} />}
              >
                源代码
              </Button>
              <Button
                variant="subtle"
                component="a"
                href="https://www.bilibili.com/video/BV1wgezzUECm"
                target="_blank"
                leftIcon={<IconMessages size={16} />}
              >
                背后故事
              </Button>
            </Group>
          </Stack>
        </Card>
        
      </Stack>
    </Container>
  </>
}