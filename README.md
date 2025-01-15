# AssemblyAI Voice Memo Transcription Script for Scriptable

This Scriptable script allows you to transcribe voice memos using the AssemblyAI API. It also integrates with the Gemini API to provide additional processing options like summarization or meeting minutes.

## Features

- **Voice Memo Transcription:** Transcribes audio files using AssemblyAI.
- **Speaker Diarization:**  Optionally identifies different speakers in the audio.
- **Gemini Integration:** Processes transcriptions using Gemini AI with preset options for summarization, meeting minutes, content analysis, or action items extraction.
- **Flexible Output:** Copies transcription or processed text to clipboard, or saves it to a new note in the Bear app.
- **Easy API Key Management:** Securely saves API keys using Scriptable's Keychain.

## Usage

1.  **Install Scriptable:** If you haven't already, install the Scriptable app on your iOS device.
2.  **Copy Script:** Copy the content of the script into Scriptable
3.  **Run the script:**
    -   Run from the script editor, when prompted select a audio file.
    -  Or share an audio file via the share sheet and select this script.
4. **API Key Prompts:**
    - You will be prompted for your AssemblyAI API key if you haven't already saved it in the keychain.
    - You will be prompted for your Gemini API key if you choose to process your transcription via Gemini and haven't already saved it.
5. **Transcribe**: The transcription will run and once completed will prompt you for options on what to do with your transcription.

## Getting API Keys

- **AssemblyAI API Key:** Sign up for a free account at [AssemblyAI](https://www.assemblyai.com/) and obtain an API key from the dashboard.
- **Gemini API Key:** Sign up for a free account at [Google AI Studio](https://aistudio.google.com) and obtain an API key from the dashboard.

## Widget Support
The script includes widget support. Add a Scriptable widget to your home screen. Select this script. The widget will include a tap target which will run the script.

## Dependencies

-   Scriptable iOS app

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.
