# 🧠 VS Assistant

**VS Assistant** is a lightweight Visual Studio Code extension that connects to a local LLM (e.g., [Ollama](https://ollama.com)) to generate or modify code based on prompts you provide — fully private, with no data sent to the cloud.

## ✨ Features

- ⚙️ Connects to a configurable LLM HTTP endpoint (e.g., Ollama)
- 🧑Generates code from natural language prompts
- ✍️ Modifies selected code intelligently based on your request
- 🔐 Keeps your code private (everything runs locally)

## 📦 Installation

1. Clone this repository.
2. Run the extension in development mode:
   ```bash
   npm install
   npm run compile
   ```
3. Press `F5` in VS Code to launch the extension in a new VS Code window.

Or, package and install manually:

```bash
npm install -g vsce
vsce package
code --install-extension vs-assistant-0.0.1.vsix
```

## 🚀 Usage

1. Open any code file in VS Code.
2. Select a block of code or leave your cursor where you want to insert code.
3. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
4. Run one of the commands:
   - `VS-Assistant: Generate Code from Prompt`
   - `VS-Assistant: Modify Selected Code`

The model will respond and insert the generated code directly in your editor.

## ⚙️ Configuration

You can configure the endpoint and model in your VS Code settings:

```json
{
  "vs-assistant.endpoint": "http://localhost:11434/api/generate",
  "vs-assistant.model": "llama3"
}
```

> ✅ The default configuration assumes you're using [Ollama](https://ollama.com) with a model like `llama3` running locally.

## 🛠️ Requirements

- Node.js
- [Ollama](https://ollama.com) or another LLM server exposing a compatible streaming API

## 📄 License

MIT

---

Built for developers who want the power of AI **without sacrificing privacy**.
