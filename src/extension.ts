import * as vscode from 'vscode';

interface SearchResult {
    line: number;
    content: string;
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('ergonc-searchlist', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Nenhum Arquivo Aberto no Editor');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        const lines = text.split('\n');

        const regex = /@ \[.*?\]\[.*?\]/g;
        const results: SearchResult[] = [];

        for (let i = 0; i < lines.length; i++) {
            const matches = lines[i].match(regex);
            if (matches) {
                matches.forEach(match => {
                    results.push({ line: i + 1, content: lines[i] });
                });
            }
        }

        if (results.length === 0) {
            vscode.window.showInformationMessage('Nenhum Resultado Encontado');
            return;
        }

        const items = results.map(result => ({
            label: `${result.line}: ${result.content}`,
            description: `Linha ${result.line}`
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Resultados:',
            onDidSelectItem: item => {
                const line = parseInt((item as any).description.replace('Linha ', ''));
                const position = new vscode.Position(line - 1, 0);
                editor.selection = new vscode.Selection(position, position);                
                editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.AtTop);
            }
        });

        // Posicionar o cursor no bloco mais próximo do cursor atual
        if (editor && editor.selection) {
            const currentPosition = editor.selection.active;
            const closestResult = results.reduce((prev, curr) => {
                return (Math.abs(curr.line - currentPosition.line) < Math.abs(prev.line - currentPosition.line) ? curr : prev);
            });

            if (closestResult) {
                const closestPosition = new vscode.Position(closestResult.line - 1, 0);
                editor.selection = new vscode.Selection(closestPosition, closestPosition);
                editor.revealRange(new vscode.Range(closestPosition, closestPosition), vscode.TextEditorRevealType.AtTop);
            }
        }

    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
