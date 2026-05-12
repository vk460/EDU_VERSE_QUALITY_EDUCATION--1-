import { mouthState, isSpeakingNow } from './speech.js';

let currentModel = null;
let modelPath = '';

export function initializeModel() {
    // This function can be used for any initial setup related to the model
    console.log('Model module initialized');
}

export async function loadModel(app, modelPath) {
    try {
        const model = await PIXI.live2d.Live2DModel.from(modelPath);
        app.stage.addChild(model);
        currentModel = model;

        // Use renderer dimensions for accurate centering
        const W = app.renderer.width;
        const H = app.renderer.height;

        // Center the model
        model.anchor.set(0.5, 0.5);
        model.position.set(W / 2, H / 2);

        // Make the model large — 90% of the smallest dimension
        const size = Math.min(W, H) * 0.9;
        model.width = size;
        model.height = size;

        setupMouthMovement(model, modelPath);
        return model;
    } catch (error) {
        console.error('Model loading error:', error);
    }
}

export function loadAvatarModel(modelPath) {
    if (!modelPath) {
        console.error('Model path not set.');
        return;
    }

    if (currentModel) {
        currentModel.destroy();
        currentModel = null;
    }

    const app = new PIXI.Application({
        view: document.getElementById('canvas'),
        autoStart: true,
        resizeTo: window,
        transparent: true,
        antialias: true
    });

    app.ticker.add(() => {
        if (currentModel && mouthState.value !== undefined) {
            updateMouthState(mouthState.value);
        }
    });

    loadModel(app, modelPath);
}

function setupMouthMovement(model, modelPath) {
    model.internalModel.motionManager.update = () => {
        if (modelPath.includes("model.json")) {
            model.internalModel.coreModel.setParamFloat('PARAM_MOUTH_OPEN_Y', mouthState.value);
        } else {
            const parameterIndex = model.internalModel.coreModel.getParameterIndex("ParamMouthOpenY");
            model.internalModel.coreModel.setParameterValueByIndex(parameterIndex, mouthState.value);
        }
    };
}

function updateMouthState(value) {
    if (isSpeakingNow())
        mouthState.value = value;
}

export async function getModelPath(selectedModel) {
    try {
        const backendUrl = window.CONFIG ? window.CONFIG.BACKEND_URL : "";
        const response = await fetch(`${backendUrl}/api/comms/models/${selectedModel}`);
        const data = await response.json();
        if (data.files && data.files.length > 0) {
            // Prefer file ending with 'model3.json' (v3) or '.model.json' (v2) if available
            const file = data.files.find(f => f.endsWith('model3.json')) || 
                         data.files.find(f => f.endsWith('.model.json')) ||
                         data.files[0];
            return `/comms/models/${selectedModel}/${file}`;
        } else {
            console.error('No model files found for', selectedModel);
            return "";
        }
    } catch (err) {
        console.error('Error fetching model files:', err);
        return "";
    }
}
