// AssemblyAI Voice Memo Transcription Script

// Configuration
let API_KEY;
try {
    API_KEY = Keychain.get("assemblyai-api-key");
} catch {
    API_KEY = null;
}

const BASE_URL = "https://api.assemblyai.com/v2";

// Prompt for API key if not found
async function ensureApiKey() {
    if (!API_KEY) {
        let alert = new Alert();
        alert.title = "API Key Required";
        alert.message = "Please enter your AssemblyAI API key";
        alert.addTextField("Enter API Key");
        alert.addAction("Save");
        alert.addCancelAction("Cancel");

        const result = await alert.present();
        if (result === -1) {
            throw new Error("API key is required");
        }

        API_KEY = alert.textFieldValue(0);
        if (API_KEY) {
            Keychain.set("assemblyai-api-key", API_KEY);
            console.log("API key saved successfully");
        } else {
            throw new Error("API key is required");
        }
    }
    return API_KEY;
}

// Upload file to AssemblyAI
async function uploadFile(audioData) {
    try {
        const request = new Request(`${BASE_URL}/upload`);
        request.method = "POST";
        request.headers = {
            "Authorization": API_KEY,
            "Content-Type": "application/octet-stream"
        };
        request.body = audioData;
        request.timeoutInterval = 120; // 2 minute timeout

        const response = await request.loadJSON();
        console.log("Upload response status:", request.response.statusCode);

        if (request.response.statusCode !== 200) {
            throw new Error(`Upload failed with status ${request.response.statusCode}`);
        }

        if (!response.upload_url) {
            throw new Error("No upload URL in response");
        }

        return response.upload_url;
    } catch (error) {
        console.error("Upload error:", error.message);
        console.error("Response:", request.response);
        throw error;
    }
}

// Request transcription
async function requestTranscription(audioUrl, options = {}) {
    try {
        const request = new Request(`${BASE_URL}/transcript`);
        request.method = "POST";
        request.headers = {
            "Authorization": API_KEY,
            "Content-Type": "application/json"
        };
        request.timeoutInterval = 30;

        const requestBody = {
            audio_url: audioUrl,
            language_detection: true,
            punctuate: true,
            format_text: true,
            speaker_labels: options.speaker_labels || false
        };

        // Add speakers_expected if speaker_labels is true
        if (options.speaker_labels && options.speakers_expected) {
            requestBody.speakers_expected = options.speakers_expected;
        }

        request.body = JSON.stringify(requestBody);
        console.log("Transcription request body:", JSON.stringify(requestBody, null, 2));

        const response = await request.loadJSON();
        console.log("Transcription request status:", request.response.statusCode);

        if (request.response.statusCode !== 200) {
            throw new Error(`Transcription request failed with status ${request.response.statusCode}`);
        }

        if (!response.id) {
            throw new Error("No transcription ID in response");
        }

        return response.id;
    } catch (error) {
        console.error("Transcription request error:", error.message);
        console.error("Response:", request.response);
        throw error;
    }
}

// Check transcript status
async function checkTranscriptionStatus(transcriptId) {
    try {
        const request = new Request(`${BASE_URL}/transcript/${transcriptId}`);
        request.method = "GET";
        request.headers = {
            "Authorization": API_KEY
        };
        request.timeoutInterval = 30;

        const response = await request.loadJSON();
        console.log("Status check status code:", request.response.statusCode);

        if (request.response.statusCode !== 200) {
            throw new Error(`Status check failed with status ${request.response.statusCode}`);
        }

        return response;
    } catch (error) {
        console.error("Status check error:", error.message);
        console.error("Response:", request.response);
        throw error;
    }
}

// Main transcription function
async function transcribeVoiceMemo(filePath) {
    try {
        // Ensure API key exists
        await ensureApiKey();

        // Get transcription options
        const options = await getTranscriptionOptions();
        if (!options) return; // User cancelled

        if (!filePath) {
          console.log("No file selected, aborting");
          return
        }

        console.log("Selected file:", filePath);

        const fm = FileManager.local();
        if (!fm.fileExists(filePath)) {
            throw new Error("Selected file does not exist");
        }

        // Read the file data
        const audioData = fm.read(filePath);
        if (!audioData) {
            throw new Error("Could not read file data");
        }
        console.log("File size:", audioData.length, "bytes");

        // Upload the file
        const uploadUrl = await uploadFile(audioData);
        console.log("File uploaded, URL obtained");

        // Request transcription with options
        const transcriptId = await requestTranscription(uploadUrl, options);
        console.log("Transcription requested, ID:", transcriptId);

        // Poll for completion
        let attempts = 0;
        const maxAttempts = 40; // 2 minutes maximum

        while (attempts < maxAttempts) {
            console.log(`Checking status (attempt ${attempts + 1}/${maxAttempts})`);
            const status = await checkTranscriptionStatus(transcriptId);

            if (status.status === "completed") {
                 await presentResult(status);
                return;
            } else if (status.status === "error") {
                throw new Error(status.error || "Transcription failed");
            }

            attempts++;
            const timer = new Timer();
            timer.timeInterval = 3000;
            await new Promise(resolve => {
                timer.schedule(function() {
                    timer.invalidate();
                    resolve();
                });
            });
        }

        throw new Error("Transcription timed out");

    } catch (error) {
        console.error("Error:", error.message);
        await presentError(error);
    }
}

// Get transcription options from user
async function getTranscriptionOptions() {
    // Ask about speaker diarization
    let diarizationAlert = new Alert();
    diarizationAlert.title = "Speaker Diarization";
    diarizationAlert.message = "Would you like to identify different speakers in the audio?";
    diarizationAlert.addAction("Yes");
    diarizationAlert.addAction("No");

    const useDiarization = await diarizationAlert.present() === 0;
    let speakerCount = null;

    if (useDiarization) {
        // Ask for number of speakers
        let speakerAlert = new Alert();
        speakerAlert.title = "Number of Speakers";
        speakerAlert.message = "How many speakers are in the audio? (1-10)";
        speakerAlert.addTextField("Enter number", "2");
        speakerAlert.addAction("OK");
        speakerAlert.addCancelAction("Cancel");

        const result = await speakerAlert.present();
        if (result === -1) return null;

        speakerCount = parseInt(speakerAlert.textFieldValue(0));
        if (isNaN(speakerCount) || speakerCount < 1 || speakerCount > 10) {
            throw new Error("Please enter a valid number of speakers (1-10)");
        }
    }

    return {
        speaker_labels: useDiarization,
        speakers_expected: speakerCount
    };
}

// Gemini API Configuration
let GEMINI_API_KEY;
try {
    GEMINI_API_KEY = Keychain.get("gemini-api-key");
} catch {
    GEMINI_API_KEY = null;
}

const GEMINI_PRESETS = {
    "Summarize": {
        name: "Summarize",
        description: "Create a concise summary with key points",
        systemPrompt: "You are an expert at summarizing conversations and transcripts. Create a clear, concise summary that captures the main points, key decisions, and important details. Format your response with clear sections for: Summary, Key Points, Action Items (if any), and Notable Quotes.",
        temperature: 0.3
    },
    "Meeting Minutes": {
        name: "Meeting Minutes",
        description: "Format as professional meeting minutes",
        systemPrompt: "You are a professional meeting transcriptionist. Convert this transcript into properly formatted meeting minutes. Include: Date, Participants (identified by speaker numbers), Agenda Items (inferred from discussion), Decisions Made, Action Items, and Next Steps. Use professional business formatting.",
        temperature: 0.2
    },
    "Content Analysis": {
        name: "Content Analysis",
        description: "Deep analysis of content and discussion",
        systemPrompt: "You are an expert content analyst. Provide a detailed analysis of this transcript including: Main Themes, Sentiment Analysis, Discussion Patterns, Key Insights, Areas of Agreement/Disagreement, and Recommendations. Support your analysis with specific examples from the transcript.",
        temperature: 0.4
    },
    "Action Items": {
        name: "Action Items",
        description: "Extract and organize action items",
        systemPrompt: "You are an executive assistant focused on action items. Review this transcript and extract all action items, tasks, and commitments. Format each item with: Owner (speaker number if available), Task, Timeline (if mentioned), and Context. Sort by priority if possible.",
        temperature: 0.2
    }
};

// Ensure Gemini API key
async function ensureGeminiApiKey() {
    if (!GEMINI_API_KEY) {
        let alert = new Alert();
        alert.title = "Gemini API Key Required";
        alert.message = "Please enter your Gemini API key";
        alert.addTextField("Enter API Key");
        alert.addAction("Save");
        alert.addCancelAction("Cancel");

        const result = await alert.present();
        if (result === -1) return null;

        GEMINI_API_KEY = alert.textFieldValue(0);
        if (GEMINI_API_KEY) {
            Keychain.set("gemini-api-key", GEMINI_API_KEY);
            console.log("Gemini API key saved successfully");
        } else {
            throw new Error("Gemini API key is required");
        }
    }
    return GEMINI_API_KEY;
}

// Present Gemini preset options
async function presentGeminiOptions(text) {
    const alert = new Alert();
    alert.title = "Process with Gemini AI";
    alert.message = "Choose how to process the transcript:";

    // Add preset options
    for (const preset of Object.values(GEMINI_PRESETS)) {
        alert.addAction(preset.name);
    }
    alert.addCancelAction("Cancel");

    const result = await alert.present();
    if (result === -1) return null;

    const selectedPreset = Object.values(GEMINI_PRESETS)[result];
    return await processWithGemini(text, selectedPreset);
}

// Process text with Gemini
async function processWithGemini(text, preset) {
    try {
        const apiKey = await ensureGeminiApiKey();
        if (!apiKey) return null;

        const request = new Request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`);
        request.method = "POST";
        request.headers = {
            "Content-Type": "application/json"
        };

        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: text }]
                }
            ],
            systemInstruction: {
                role: "user",
                parts: [{ text: preset.systemPrompt }]
            },
            generationConfig: {
                temperature: preset.temperature,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
                responseMimeType: "text/plain"
            }
        };

        request.body = JSON.stringify(requestBody);
        const response = await request.loadJSON();
            if (!response.candidates || !response.candidates[0]) {
                throw new Error("No response from Gemini API");
            }

            return response.candidates[0].content.parts[0].text;
      } catch (error) {
        console.error("Gemini API error:", error);
        throw error;
    }
}


// Present the transcription result
async function presentResult(response) {
    if (!response) {
        throw new Error("No response received");
    }

    let formattedText = "";

    // Handle diarized transcription
    if (response.speaker_labels && response.utterances) {
        formattedText = response.utterances.map(utterance =>
            `Speaker ${utterance.speaker}: ${utterance.text}`
        ).join('\n\n');
    } else {
        formattedText = response.text;
    }
    
    let geminiProcessedText = null;
    
      const alert = new Alert();
    alert.title = "Transcription Complete";
    alert.message = "What would you like to do with the transcription?";
    alert.addAction("Process with Gemini AI");
    alert.addAction("Copy to Clipboard");
    alert.addAction("Save to Bear");
    alert.addCancelAction("Cancel");

    const result = await alert.present();

    switch (result) {
        case 0: // Process with Gemini
             geminiProcessedText = await presentGeminiOptions(formattedText);
            if (geminiProcessedText) {
                await presentProcessedResult(geminiProcessedText, formattedText);
            }
            break;

        case 1: // Copy to Clipboard
            Pasteboard.copy(formattedText);
            const notification = new Notification();
            notification.title = "Copied to Clipboard";
            notification.body = "The transcription has been copied to your clipboard";
            notification.schedule();
            break;

        case 2: // Save to Bear
             await saveToBear(formattedText);
            break;
    }
}

// Present processed result
async function presentProcessedResult(text, originalText) {
    const alert = new Alert();
    alert.title = "AI Processing Complete";
    alert.message = "What would you like to do with the processed text?";
    alert.addAction("Copy to Clipboard");
    alert.addAction("Save to Bear");
      alert.addCancelAction("Cancel");

    const result = await alert.present();

    switch (result) {
        case 0: // Copy to Clipboard
            Pasteboard.copy(text);
            const notification = new Notification();
            notification.title = "Copied to Clipboard";
            notification.body = "The processed text has been copied to your clipboard";
            notification.schedule();
            break;

        case 1: // Save to Bear
            await saveToBear(text, originalText);
            break;
    }
}


// Save to Bear
async function saveToBear(text, originalText = null) {
      try {
        let bearText = "";
        
        if(originalText) {
            bearText = `## Gemini Processed Result\n\n${text}\n\n---\n\n## Full Transcription\n\n${originalText}`;
        } else {
            bearText = text;
        }
        
        const title = "Voice Memo Transcription";
        const encodedTitle = encodeURIComponent(title);
        const encodedText = encodeURIComponent(bearText);
        const bearURL = `bear://x-callback-url/create?title=${encodedTitle}&text=${encodedText}&open_note=yes`;
         const success = await Safari.open(bearURL);
        
        if (success) {
            const notification = new Notification();
            notification.title = "Saved to Bear";
            notification.body = "The transcription has been saved as a new note in Bear";
            notification.schedule();
             console.log("Successfully opened Bear URL"); // Debug log to confirm Safari.open returned true
            
        } else {
             throw new Error("Safari.open returned false, indicating an issue with the URL");
        }
    } catch (error) {
        console.error("Error saving to Bear:", error);
        const alert = new Alert();
        alert.title = "Bear Error";
        alert.message = error.message;
        alert.addAction("OK");
        await alert.present();
    }
}

// Present any errors
async function presentError(error) {
    const alert = new Alert();
    alert.title = "Error";
    alert.message = error.message || "An unknown error occurred";
    alert.addAction("OK");
    await alert.present();
}

// Widget Implementation
class TranscriptionWidget {
    async render() {
        const widget = new ListWidget();
        widget.backgroundColor = new Color("#1A1A1A");

        const header = widget.addStack();
        const title = header.addText("Voice Memo Transcription");
        title.font = Font.boldSystemFont(16);
        title.textColor = Color.white();

        widget.addSpacer(8);

        const transcribeButton = widget.addText("Tap to transcribe a voice memo");
        transcribeButton.font = Font.systemFont(14);
        transcribeButton.textColor = new Color("#CCCCCC");

        widget.url = "scriptable:///run/" + Script.name();

        return widget;
    }
}

// Run based on context
if (config.runsInWidget) {
    let widget = await new TranscriptionWidget().render();
    Script.setWidget(widget);
} else if (args.fileURLs.length > 0) {
    // Share sheet context
    const filePath = args.fileURLs[0];
    await transcribeVoiceMemo(filePath);
} else {
    // Default context (e.g., when run from the app)
    await transcribeVoiceMemo();
}
