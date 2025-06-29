import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const generate = vscode.commands.registerCommand('llm.generateCode', generateCode);
  const modify = vscode.commands.registerCommand('llm.modifyCode', modifyCode);

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

	const fullPrompt = `You are an expert developer. 
	Return only the valid code for the following request. 
	Do NOT include explanations or comments.
	Return only the raw code.
	Do not include any explanations, markdown formatting, or code fences like \`\`\`.

	Request: ${prompt}`;

    const config = vscode.workspace.getConfiguration('llm');
    const endpoint = config.get<string>('endpoint')!;
    const model = config.get<string>('model')!;

    await callLLM(endpoint, model, fullPrompt, editor, selection);
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

	const fullPrompt = `You are an expert developer. 
	Return only the valid code for the following request. 
	Do NOT include explanations or comments.
	Return only the raw code.
	Do not include any explanations, markdown formatting, or code fences like \`\`\`.

	Code to modify: ${selectedText}
	Request: ${prompt}`;

    const config = vscode.workspace.getConfiguration('llm');
    const endpoint = config.get<string>('endpoint')!;
    const model = config.get<string>('model')!;

    await callLLM(endpoint, model, fullPrompt, editor, selection, true);
}

async function callLLM(
  endpoint: string,
  model: string,
  prompt: string,
  editor: vscode.TextEditor,
  selection: vscode.Selection,
  replaceSelection: boolean = false
) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: true }),
    });

    if (!res.body) {
      vscode.window.showErrorMessage('No response stream received.');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

	if (replaceSelection) {
      await editor.edit(editBuilder => {
        editBuilder.delete(selection);
      });
    }
	
    let insertPosition = selection.start;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      for (const line of chunk.split('\n')) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          const text = data.response;
          if (text) {
            fullResponse += text;
            await editor.edit(editBuilder => {
              editBuilder.insert(insertPosition, text);
            });
            // Update insertPosition after each insert
            insertPosition = editor.selection.active;
          }
        } catch (e) {
          console.error('Error parsing stream line:', line);
        }
      }
    }
  } catch (err) {
    vscode.window.showErrorMessage('Streaming error: ' + err);
  }
}
