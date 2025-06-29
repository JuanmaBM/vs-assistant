import * as vscode from 'vscode';

const systemPrompt = `You are an expert developer. 
  Return only the valid code for the following request. 
  Do NOT include explanations or comments.
  Return only the raw code.
  Do not include any explanations, markdown formatting, or code fences like \`\`\`.`;

export function activate(context: vscode.ExtensionContext) {
  const generate = vscode.commands.registerCommand('vs-assistant.generateCode', generateCode);
  const modify = vscode.commands.registerCommand('vs-assistant.modifyCode', modifyCode);

  context.subscriptions.push(generate, modify);
}

async function generateCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor.");
      return;
    }

    const selection = editor.selection;

    const prompt = await vscode.window.showInputBox({
      prompt: 'What code should I generate?',
    });

    if (!prompt) return;

    await callLLM(prompt, editor, selection);
}

async function modifyCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor.");
      return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    const prompt = await vscode.window.showInputBox({
      prompt: 'What should I mofidy?',
    });

    if (!prompt) return;

    const fullPrompt = `
      Code to modify: ${selectedText}
      Request: ${prompt}`;


    await callLLM(fullPrompt, editor, selection, true);
}

async function callLLM(
  prompt: string,
  editor: vscode.TextEditor,
  selection: vscode.Selection,
  replaceSelection: boolean = false
) {
  try {
    const config = vscode.workspace.getConfiguration('llm');
    const endpoint = config.get<string>('endpoint')!;
    const model = config.get<string>('model')!;
    const apiKey = config.get<string>('apiKey')!;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt},
          { role: "user", content: prompt }
        ],
        stream: true
      })
    });

    if (!res.body) {
      vscode.window.showErrorMessage('No response stream received.');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let insertPosition = selection.start;
    let fullResponse = '';

    if (replaceSelection) {
      await editor.edit(editBuilder => {
        editBuilder.delete(selection);
      });
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const payload = trimmed.replace(/^data:\s*/, '');
        if (payload === '[DONE]') break;

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullResponse += delta;
            await editor.edit(editBuilder => {
              editBuilder.insert(insertPosition, delta);
            });
            insertPosition = editor.selection.active;
          }
        } catch (e) {
          console.error('Failed to parse chunk:', payload);
        }
      }
    }
  } catch (err) {
    vscode.window.showErrorMessage('Streaming error: ' + err);
  }
}
