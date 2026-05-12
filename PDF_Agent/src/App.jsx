import React, { useState } from 'react';
import './App.css';
import Sidebar from './Components/Sidebar/Sidebar';
import MainContent from './Components/MainContent/MainContent';
import ChatInput from './Components/ChatInput/ChatInput';
import QuickActions from './Components/QuickActions/QuickActions';
import { extractTextFromPDF } from './services/pdfService';
import { generateAnswer } from './services/aiService';

function App() {
  const [messages, setMessages] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]); // Array of files
  const [pdfContextText, setPdfContextText] = useState('');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const handleQuickAction = async (actionId) => {
    if (!pdfContextText) return;
    
    const actionMap = {
      summarize: "Summarizing documents...",
      flowchart: "Generating flowchart...",
      key_points: "Extracting key points...",
      generate_questions: "Generating questions..."
    };

    setMessages(prev => [...prev, { role: 'ai', content: actionMap[actionId] }]);
    setIsAiTyping(true);

    try {
      const answer = await generateAnswer("", pdfContextText, actionId);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop();
        return [...newMessages, { role: 'ai', content: answer }];
      });
    } catch (e) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop();
        return [...newMessages, { role: 'ai', content: `Error: ${e.message}` }];
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  const handlePdfUpload = async (newFiles) => {
    setIsProcessingPdf(true);
    try {
      // Process all files concurrently
      const results = await Promise.all(
        newFiles.map(async (file) => {
          const text = await extractTextFromPDF(file);
          return { name: file.name, text };
        })
      );
      
      const updatedFiles = [...pdfFiles, ...results];
      setPdfFiles(updatedFiles);
      
      // Aggregate context with headers
      const combinedText = updatedFiles.map(f => `--- DOCUMENT: ${f.name} ---\n${f.text}`).join('\n\n');
      setPdfContextText(combinedText);
      
      setMessages(prev => [
        ...prev, 
        { role: 'ai', content: `Successfully parsed ${newFiles.length} file(s). You can now interact with all ${updatedFiles.length} documents collectively.` }
      ]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'ai', content: `Error processing PDF: ${e.message}` }]);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleSendMessage = async (text) => {
    // Add User Message
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    
    setIsAiTyping(true);

    try {
      const answer = await generateAnswer(text, pdfContextText);
      setMessages(prev => [...prev, { role: 'ai', content: answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: `Error: ${e.message}` }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        pdfFiles={pdfFiles} 
        isProcessingPdf={isProcessingPdf} 
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: 'var(--color-bg)' }}>
        <MainContent messages={messages} isAiTyping={isAiTyping} onChipClick={handleSendMessage} />
        <QuickActions onAction={handleQuickAction} isDisabled={pdfFiles.length === 0 || isAiTyping} />
        <ChatInput onSendMessage={handleSendMessage} onPdfUpload={handlePdfUpload} />
      </div>
    </div>
  );
}

export default App;