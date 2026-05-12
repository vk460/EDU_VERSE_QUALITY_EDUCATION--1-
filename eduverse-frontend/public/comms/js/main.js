import { initializeModel, loadAvatarModel } from './modules/model.js';
import { initializeSpeech } from './modules/speech.js';
import { initializeMicrophone, checkMicrophoneAccess } from './modules/microphone.js';
import { setupUI } from './modules/ui.js';
import { initializeEffects } from './modules/effects.js';
import { initializeSocket, getInitialConfig } from './modules/socket.js';
import { initializeConversationHistory } from './modules/conversationHistory.js';

// Apply defaults immediately - hardcoded paths, no socket/API needed
function applyDefaults() {
    // Set classroom background
    $('body').css({
        backgroundImage: `url('/comms/images/background/classroom.jpg')`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundColor: ''
    });
    // Load shizuku avatar directly (shizuku has a .model.json which is Live2D v2)
    const modelPath = '/comms/models/shizuku/shizuku.model.json';
    loadAvatarModel(modelPath);
}

async function initializeApp() {
    await initializeSpeech();
    setupUI();
    initializeSocket();
    initializeMicrophone();
    initializeModel();
    initializeEffects();
    initializeConversationHistory();
    getInitialConfig();
    checkMicrophoneAccess();
    // Apply defaults so avatar/background show even if socket is slow
    applyDefaults();
}

// Initial setup
$(document).ready(() => initializeApp());