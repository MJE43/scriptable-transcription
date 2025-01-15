# Setup Guide for AssemblyAI Voice Memo Transcription Script

This guide will walk you through the steps to set up and use the AssemblyAI Voice Memo Transcription Script with Scriptable.

## Prerequisites

-   **Scriptable App:** Ensure you have the Scriptable app installed on your iOS device.
-   **AssemblyAI Account:** You will need an AssemblyAI account to obtain an API key.
-   **Google AI Studio Account:** You will need a Google AI Studio account to obtain an API key for Gemini integration.

## Steps

### 1. Obtain API Keys

1.  **AssemblyAI API Key:**
    -   Go to the [AssemblyAI](https://www.assemblyai.com/) website.
    -   Sign up for a free account if you don't have one.
    -   Navigate to your account dashboard.
    -   Copy your API key.
2.  **Gemini API Key:**
    -   Go to [Google AI Studio](https://aistudio.google.com/)
    -   Sign in with your google account if you don't have one.
    -   Navigate to the "Get API Key" section, or create a new project to generate your api key.
    -   Copy your API Key.

### 2. Import the Script into Scriptable

1.  **Copy Script:** Copy the complete code from the provided script.
2.  **Open Scriptable:** Launch the Scriptable app on your iOS device.
3.  **Create New Script:** Tap the "+" button to create a new script.
4.  **Paste Code:** Paste the copied script code into the editor.
5.  **Rename Script:** Rename the script for your conveience, eg "VoiceMemoTranscribe"

### 3. Running the script

1.  **Run Script:** Tap the play button in scriptable.
2.  **Choose Audio File:** If no files were passed to the script, the script will prompt you to choose an audio file.
3.  **Enter API Keys:** The first time you run the script, you will be prompted to enter your AssemblyAI API Key, and if you use Gemini, you will be prompted to enter that API key as well.
4. **Transcription Options** You will be prompted whether you wish to use speaker diarization, if yes you will be prompted for the number of speakers.
5. **Gemini Options** After successful transcription, if you choose to, you will be presented with Gemini processing options.
6.  **Output Options:**  Once the transcription is complete, you'll be presented with options to copy the text, save it to Bear, or process with Gemini.

### 4. Using with Share Sheet
1.  **Select Audio File** Select a voice memo in your files app or voice memo app.
2. **Share**: Select the share button, scroll down and find the run script option.
3. **Run Script** Select your script from the options presented.
4. Continue as above from the step **3. Enter API Keys**

### 5. Using the widget

1. **Add Widget** Long press on your home screen and select the "+" button to add a widget.
2. **Select Scriptable** Select a Scriptable widget.
3. **Choose Script** Select the script you created earlier in the list.
4. **Run Script** Tapping on the script will open and run the script.
5. Continue as above from the step **3. Enter API Keys**

## Troubleshooting

-   **API Key Errors:** If you receive an API key error, ensure that you have correctly copied and pasted your API keys. Re-enter the key using the same method you used to save the key in the keychain.
-   **File Errors:** Verify that the selected audio file exists and can be read by Scriptable.
-   **Network Errors:** Make sure your device is connected to the internet and can reach the AssemblyAI and Gemini APIs.
-   **Script Errors:** Use the console.log to debug if necessary. The error will also present in the alert.

If you have any issues with setup, or would like to request a feature, feel free to open an issue!
