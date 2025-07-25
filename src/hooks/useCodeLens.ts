import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

export function useCodeLensProvider() {
  const disposableRef = useRef<monaco.IDisposable | null>(null);

  useEffect(() => {
    return () => {
      disposableRef.current?.dispose();
    };
  }, []);

  const editorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    disposableRef.current = monaco.languages.registerCodeLensProvider('graphql', {
      provideCodeLenses: (model) => {
        const lenses: monaco.languages.CodeLens[] = [];
        const lines = model.getValue().split('\\n');

        lines.forEach((line, i) => {
          if (line.trim().startsWith('type')) {
            const range = new monaco.Range(i + 1, 1, i + 1, 1);
            lenses.push({
              range,
              id: `codelens-${i}`,
              command: {
                id: 'editor.action.showContextMenu',
                title: 'Show Actions',
                arguments: [editor.getPosition()],
              },
            });
          }
        });

        return {
          lenses,
          dispose: () => {},
        };
      },
      resolveCodeLens: (_, codeLens) => {
        return codeLens;
      },
    });
  };

  return { editorDidMount };
}
