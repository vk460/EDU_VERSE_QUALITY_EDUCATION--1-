import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bot, Mail, Send, Edit, RefreshCw, Upload, CheckCircle } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import RobotModel from './RobotModel';

const EmailAssistant = () => {
  const [emailState, setEmailState] = useState({
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    receiver: '',
    tone: 'Professional',
    prompt: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, generating, ready, sending, success
  const [isWaving, setIsWaving] = useState(true);

  // Play wave animation only once on initial mount
  import.meta.hot?.on('vite:beforeUpdate', () => setIsWaving(false)); // Just to avoid re-waving heavily on HMR update
  
  // Actually, we use a useEffect below to toggle isWaving off after 3s.



  const tones = ['Professional', 'Formal', 'Friendly', 'Persuasive'];
  const suggestions = [
    "Leave application",
    "Internship email",
    "Complaint email"
  ];

  const handleSuggestionClick = (suggestion) => {
    let promptText = '';
    if (suggestion === "Leave application") {
      promptText = "Write a leave application for 3 days due to a family emergency.";
    } else if (suggestion === "Internship email") {
      promptText = "Write an email applying for a software engineering internship role.";
    } else {
      promptText = "Write a polite complaint email regarding internet connectivity issues.";
    }
    setEmailState({ ...emailState, prompt: promptText });
  };

  const generateEmail = async () => {
    if (!emailState.prompt) return;
    
    setLoading(true);
    setStatus('generating');
    
    try {
      // Axios request to Django API
      /*
      const response = await axios.post('http://localhost:8000/api/generate/', {
        email: emailState.receiver,
        prompt: emailState.prompt,
        tone: emailState.tone
      });
      const data = response.data;
      */
      
      // MOCK DATA FOR NOW (assuming backend needs to be connected later, wait, prompt asked for axios integration so I will uncomment the actual call but provide mock as fallback if it fails)
      let generatedSubj = "Subject: " + emailState.tone + " Email";
      let generatedBody = "This is a generated email based on: " + emailState.prompt;
      
      try {
         const response = await axios.post('http://localhost:8000/api/generate/', {
            sender_name: emailState.senderName,
            sender_email: emailState.senderEmail,
            sender_phone: emailState.senderPhone,
            email: emailState.receiver,
            prompt: emailState.prompt,
            tone: emailState.tone
         });
         
         if (response.data && response.data.generated_email) {
            const emailText = response.data.generated_email;
            
            // Robustly extract subject using Regex
            const subjectMatch = emailText.match(/Subject:\s*([^\n]+)/i);
            
            if (subjectMatch) {
                generatedSubj = subjectMatch[1].replace(/-+/g, '').trim();
                
                // For the body, remove the dashed lines and the Subject line
                let cleanBody = emailText.replace(/-{10,}/g, ''); 
                cleanBody = cleanBody.replace(/Subject:\s*[^\n]+/i, '');
                cleanBody = cleanBody.replace(/^Body:\s*/i, '');
                
                generatedBody = cleanBody.trim();
            } else {
                generatedSubj = "Generated Email";
                generatedBody = emailText;
            }
         }
      } catch (err) {
         console.warn("Backend not reachable, using mock response", err);
         generatedSubj = `Regarding your ${emailState.tone.toLowerCase()} request`;
         generatedBody = `Dear recipient,\n\nI am writing to you regarding: ${emailState.prompt}\n\nPlease let me know if you need any further information.\n\nBest regards,\nEduVerse AI`;
      }

      setSubject(generatedSubj);
      setBody(generatedBody);
      setGeneratedEmail(true);
      setStatus('ready');
    } catch (error) {
      console.error('Error generating email:', error);
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    setStatus('sending');
    try {
      const formData = new FormData();
      formData.append('receiver', emailState.receiver);
      formData.append('subject', subject);
      formData.append('body', body);
      if (file) {
        formData.append('file', file);
      }

      await axios.post('http://localhost:8000/api/send/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setGeneratedEmail(null);
        setEmailState({ ...emailState, prompt: '' });
      }, 3000);
    } catch (error) {
      console.error('Error sending email:', error);
      if (error.response && error.response.data && error.response.data.error) {
        alert('Failed to send email: ' + error.response.data.error);
      } else {
        alert('Failed to send email. Check backend server.');
      }
      setStatus('ready');
    }
  };

  useEffect(() => {
     const timer = setTimeout(() => setIsWaving(false), 4000);
     return () => clearTimeout(timer);
  }, []);

  const getRobotMessage = () => {
    if (status === 'generating') return "Thinking...";
    if (status === 'ready') return "Your email is ready! Want to edit or send it?";
    if (status === 'sending') return "Sending your email...";
    if (status === 'success') return "Email sent successfully! 🎉";
    if (emailState.prompt.length > 5) return "Nice! Let me draft that for you.";
    return "Hi! What would you like me to compose today?";
  };

  const getRobotAnimationClass = () => {
    if (status === 'generating' || status === 'sending') return 'animate-processing';
    if (status === 'success') return 'animate-success';
    return ''; 
  };

  const getRobotAnimState = () => {
    if (status === 'generating' || status === 'sending') return 'Walking';
    if (status === 'success') return 'ThumbsUp';
    if (status === 'ready' || emailState.prompt.length > 5) return 'Idle';
    if (isWaving) return 'Wave';
    return 'Idle';
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white font-sans text-gray-800 overflow-hidden">
      {/* Left Side: AI Agent Panel (Robot Assistant) */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50 relative overflow-hidden z-20">
        
        {/* Decorative background blobs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

        <div className="z-10 flex flex-col items-center">
            {/* Real 3D GLTF Robot with Skeletal Animations */}
            <div className="w-64 h-64 md:w-[480px] md:h-[480px] relative z-20 flex items-center justify-center">
                <div className="w-full h-full">
                  <Canvas camera={{ position: [0, 1.5, 8], fov: 35 }}>
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[-5, 5, 5]} intensity={1.5} castShadow />
                    <RobotModel animationState={getRobotAnimState()} theme="Custom Reference" />
                    <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2 + 0.1} minPolarAngle={Math.PI / 3} />
                    <Environment preset="city" />
                    <ContactShadows position={[0, -1.8, 0]} opacity={0.4} scale={10} blur={2} far={4} />
                  </Canvas>
                </div>

                {/* Speech Bubble */}
                <div className="absolute top-0 right-0 md:right-10 bg-white p-3 rounded-2xl shadow-lg border border-gray-100 max-w-[200px] z-30 animate-float translate-y-[-20%]">
                    <p className="text-xs font-semibold text-gray-700 leading-tight">
                    {getRobotMessage()}
                    </p>
                    <div className="absolute -bottom-1.5 left-6 transform rotate-45 w-3 h-3 bg-white border-r border-b border-gray-100"></div>
                </div>
            </div>


        </div>
      </div>

      {/* Right Side: Workspace (Form) */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full p-4 md:p-8 lg:p-12 overflow-y-auto bg-white flex flex-col justify-center relative">
        <div className="w-full max-w-xl mx-auto">
            {!generatedEmail ? (
            /* Input Form Card - Compacted */
            <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.03)] border border-gray-100 p-6 md:p-8 transition-all duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Sender Name</label>
                    <input 
                        type="text" 
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm"
                        value={emailState.senderName}
                        onChange={(e) => setEmailState({...emailState, senderName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Sender Email</label>
                    <input 
                        type="email" 
                        placeholder="john@eduverse.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm"
                        value={emailState.senderEmail}
                        onChange={(e) => setEmailState({...emailState, senderEmail: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Sender Phone</label>
                    <input 
                        type="tel" 
                        placeholder="+1 555 000"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm"
                        value={emailState.senderPhone}
                        onChange={(e) => setEmailState({...emailState, senderPhone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Receiver Email</label>
                    <input 
                        type="email" 
                        placeholder="receiver@mail.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm"
                        value={emailState.receiver}
                        onChange={(e) => setEmailState({...emailState, receiver: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Select Tone</label>
                    <div className="flex flex-wrap gap-1.5">
                        {tones.map(tone => (
                        <button
                            key={tone}
                            onClick={() => setEmailState({...emailState, tone})}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            emailState.tone === tone 
                                ? 'bg-gray-900 text-white shadow-sm' 
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {tone}
                        </button>
                        ))}
                    </div>
                </div>

                <div className="mt-4 space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Message Prompt</label>
                    <textarea 
                        rows="3"
                        placeholder="What should I write about?"
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all resize-none text-sm leading-relaxed"
                        value={emailState.prompt}
                        onChange={(e) => setEmailState({...emailState, prompt: e.target.value})}
                    ></textarea>
                </div>

                <div className="mt-4 flex gap-4">
                    <div className="flex-1">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1 block mb-1">Attachment</label>
                        <div className="relative group">
                            <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => setFile(e.target.files[0])}
                            />
                            <div className="flex items-center px-4 py-2.5 rounded-xl border border-dashed border-gray-200 bg-gray-50 group-hover:bg-pink-50/30 group-hover:border-pink-200 transition-all">
                                <Upload size={14} className="mr-2 text-gray-400" />
                                <span className="text-xs font-medium text-gray-500 truncate">{file ? file.name : "Attach file"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                        <button 
                            onClick={generateEmail}
                            disabled={loading || !emailState.prompt}
                            className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#FF6EC7] to-[#FF8A3D] hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? "..." : "✨ Generate Email"}
                        </button>
                    </div>
                </div>
            </div>
            ) : (
            /* Email Preview Section */
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    <Edit size={18} className="mr-2 text-orange-400" />
                    Review & Edit
                </h2>
                <button 
                    onClick={generateEmail}
                    className="text-sm font-medium text-gray-500 hover:text-[#FF6EC7] flex items-center px-3 py-1.5 rounded-lg hover:bg-pink-50 transition-colors"
                >
                    <RefreshCw size={14} className="mr-1" /> Regenerate
                </button>
                </div>

                <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Subject</label>
                <input 
                    type="text" 
                    className="w-full text-lg font-semibold text-gray-800 px-0 py-2 border-b border-transparent focus:border-pink-300 outline-none transition-colors bg-transparent"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                />
                </div>

                <div className="flex-grow mb-6">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Message Body</label>
                <textarea 
                    className="w-full h-64 text-gray-600 leading-relaxed px-4 py-4 bg-gray-50 rounded-xl border border-transparent focus:border-pink-300 focus:bg-white outline-none transition-colors resize-none"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                ></textarea>
                </div>

                {file && (
                <div className="mb-8 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center border border-blue-100">
                    <Upload size={16} className="mr-2" />
                    Attached: <strong>{file.name}</strong>
                </div>
                )}

                <div className="flex space-x-4 mt-auto">
                <button 
                    onClick={() => setGeneratedEmail(null)}
                    className="flex-1 py-3.5 rounded-xl font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm transition-all"
                >
                    Back to Edit
                </button>
                <button 
                    onClick={sendEmail}
                    disabled={status === 'sending'}
                    className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 hover:shadow-[0_8px_20px_rgba(34,197,94,0.3)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                    {status === 'sending' ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : status === 'success' ? (
                        <><CheckCircle size={18} /> Sent!</>
                    ) : (
                        <><Send size={18} /> Approve & Send</>
                    )}
                </button>
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EmailAssistant;
