import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Copy, RefreshCw, User, Bot, ExternalLink, AlertCircle } from 'lucide-react';

// 数据结构定义
interface CardData {
  type: 'contact' | 'article';
  title: string;
  description?: string;
  url?: string;
  avatar?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'error' | 'loading';
  cardData?: CardData;
  isStreaming?: boolean;
}

// Mock AI回复数据
const mockResponses = [
  "你好！我是AI助手，很高兴为你服务。有什么我可以帮助你的吗？",
  "这是一个很好的问题！让我来为你详细解答：\n\n1. 首先，我们需要了解基本概念\n2. 然后，分析具体场景\n3. 最后，给出解决方案\n\n希望这些信息对你有帮助！",
  "当然可以！这里有一段示例代码：\n\n```javascript\nfunction greeting(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greeting('World'));\n```\n\n这段代码展示了如何创建一个简单的问候函数。",
  "我理解你的需求。根据你的描述，我建议采用以下方案：\n\n**方案优势**：\n- 易于实现\n- 性能良好\n- 维护成本低\n\n你觉得这个方案如何？",
];

// 模拟卡片数据
const mockCardResponse: Message = {
  id: 'card-1',
  role: 'assistant',
  content: '我找到了一篇相关文章，推荐给你：',
  timestamp: Date.now(),
  status: 'sent',
  cardData: {
    type: 'article',
    title: '前端开发最佳实践指南',
    description: '深入探讨现代前端开发的核心理念、工具链选择和性能优化技巧',
    url: 'https://example.com/article'
  }
};

// 本地存储键名
const STORAGE_KEY = 'ai_chat_history';

// Markdown解析函数
function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 代码块
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim() || 'plaintext';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <CodeBlock key={i} code={codeLines.join('\n')} language={language} />
      );
      i++;
      continue;
    }

    // 标题
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-xl font-bold mt-3 mb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-lg font-bold mt-2 mb-1">{line.slice(4)}</h3>);
    }
    // 列表
    else if (line.trim().match(/^[\d]+\.\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[\d]+\.\s/)) {
        listItems.push(lines[i].trim().replace(/^[\d]+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={i} className="list-decimal list-inside my-2 space-y-1">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInlineMarkdown(item)}</li>
          ))}
        </ol>
      );
      continue;
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="list-disc list-inside my-2 space-y-1">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      continue;
    }
    // 空行
    else if (line.trim() === '') {
      elements.push(<br key={i} />);
    }
    // 普通段落
    else {
      elements.push(
        <p key={i} className="my-2">
          {parseInlineMarkdown(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="markdown-content">{elements}</div>;
}

// 解析行内Markdown（粗体、斜体、链接、行内代码）
function parseInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let current = text;
  let key = 0;

  while (current.length > 0) {
    // 粗体 **text**
    const boldMatch = current.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(current.slice(0, boldMatch.index));
      }
      parts.push(<strong key={key++} className="font-bold">{boldMatch[1]}</strong>);
      current = current.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // 斜体 *text*
    const italicMatch = current.match(/\*(.+?)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(current.slice(0, italicMatch.index));
      }
      parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>);
      current = current.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    // 行内代码 `code`
    const codeMatch = current.match(/`(.+?)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(current.slice(0, codeMatch.index));
      }
      parts.push(
        <code key={key++} className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
          {codeMatch[1]}
        </code>
      );
      current = current.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    // 链接 [text](url)
    const linkMatch = current.match(/\[(.+?)\]\((.+?)\)/);
    if (linkMatch && linkMatch.index !== undefined) {
      if (linkMatch.index > 0) {
        parts.push(current.slice(0, linkMatch.index));
      }
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {linkMatch[1]}
        </a>
      );
      current = current.slice(linkMatch.index + linkMatch[0].length);
      continue;
    }

    // 没有更多特殊格式，添加剩余文本
    parts.push(current);
    break;
  }

  return <>{parts}</>;
}

// 代码块组件
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 group">
      <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-2 rounded-t-lg text-sm">
        <span className="font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          <Copy className="w-3 h-3" />
          <span className="text-xs">{copied ? '已复制' : '复制'}</span>
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
        <code className="font-mono text-sm leading-relaxed">{code}</code>
      </pre>
    </div>
  );
}

// 主应用组件
export default function AIChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 加载历史消息
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
    }
  }, []);

  // 保存消息到本地存储
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error('保存消息失败:', error);
      }
    }
  }, [messages]);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 流式响应效果
  const simulateStreamingResponse = useCallback((fullText: string, messageId: string) => {
    let currentIndex = 0;
    const chunkSize = 2;
    const interval = 30;

    const streamInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        const chunk = fullText.slice(0, currentIndex + chunkSize);
        currentIndex += chunkSize;
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: chunk, isStreaming: true }
            : msg
        ));
      } else {
        clearInterval(streamInterval);
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'sent', isStreaming: false }
            : msg
        ));
        setIsAITyping(false);
      }
    }, interval);
  }, []);

  // 模拟AI回复
  const simulateAIResponse = useCallback((userMessage: string) => {
    setIsAITyping(true);
    
    const aiMessageId = `msg-${Date.now()}-ai`;
    const loadingMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'loading',
    };

    setMessages(prev => [...prev, loadingMessage]);

    setTimeout(() => {
      if (userMessage.includes('文章') || userMessage.includes('推荐')) {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...mockCardResponse, id: aiMessageId }
            : msg
        ));
        setIsAITyping(false);
      } else {
        const responseText = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        simulateStreamingResponse(responseText, aiMessageId);
      }
    }, 800);
  }, [simulateStreamingResponse]);

  // 发送消息
  const handleSend = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isAITyping) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: trimmedValue,
      timestamp: Date.now(),
      status: 'sent',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    simulateAIResponse(trimmedValue);
  }, [inputValue, isAITyping, simulateAIResponse]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 自动调整textarea高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  // 复制消息内容
  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      alert('已复制到剪贴板');
    });
  }, []);

  // 重新生成
  const handleRegenerate = useCallback((messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    let lastUserMessage = '';
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessage = messages[i].content;
        break;
      }
    }

    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    if (lastUserMessage) {
      simulateAIResponse(lastUserMessage);
    }
  }, [messages, simulateAIResponse]);

  // 清空对话
  const handleClearChat = () => {
    if (confirm('确定要清空所有对话记录吗？')) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">AI 对话助手</h1>
          <button
            onClick={handleClearChat}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            清空对话
          </button>
        </div>
      </header>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">开始对话</h2>
              <p className="text-gray-500">输入消息开始与AI助手对话</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onCopy={handleCopy}
                onRegenerate={handleRegenerate}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3 bg-gray-50 rounded-2xl p-3 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (按 Enter 发送，Shift + Enter 换行)"
              className="flex-1 bg-transparent resize-none outline-none text-gray-800 placeholder-gray-400 max-h-[200px] min-h-[24px]"
              rows={1}
              disabled={isAITyping}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isAITyping}
              className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI助手可能会出错，请核实重要信息
          </p>
        </div>
      </div>
    </div>
  );
}

// 消息气泡组件
function MessageBubble({ 
  message, 
  onCopy, 
  onRegenerate 
}: { 
  message: Message;
  onCopy: (content: string) => void;
  onRegenerate: (id: string) => void;
}) {
  const isUser = message.role === 'user';
  const isLoading = message.status === 'loading';
  const isError = message.status === 'error';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'
      }`}>
        {isUser ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-5 py-3 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : isError
            ? 'bg-red-50 border border-red-200'
            : 'bg-white shadow-md border border-gray-100'
        }`}>
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-sm">AI正在思考...</span>
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>消息发送失败，请重试</span>
            </div>
          ) : message.cardData ? (
            <div>
              <p className="text-gray-800 mb-3">{message.content}</p>
              <Card cardData={message.cardData} />
            </div>
          ) : (
            <div className={isUser ? 'text-white' : 'text-gray-800'}>
              {parseMarkdown(message.content)}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        {!isUser && !isLoading && !isError && (
          <div className="flex gap-2 mt-2 ml-2">
            <button
              onClick={() => onCopy(message.content)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="复制"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRegenerate(message.id)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="重新生成"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 时间戳 */}
        <span className="text-xs text-gray-400 mt-1 ml-2">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
}

// 卡片组件
function Card({ cardData }: { cardData: CardData }) {
  const handleCardClick = () => {
    if (cardData.url) {
      window.open(cardData.url, '_blank');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
            {cardData.title}
          </h3>
          {cardData.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{cardData.description}</p>
          )}
          {cardData.type === 'article' && (
            <div className="flex items-center gap-1 mt-2 text-blue-600 text-sm font-medium">
              <span>查看文章</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          )}
        </div>
        {cardData.avatar && (
          <img src={cardData.avatar} alt="" className="w-12 h-12 rounded-full" />
        )}
      </div>
    </div>
  );
}