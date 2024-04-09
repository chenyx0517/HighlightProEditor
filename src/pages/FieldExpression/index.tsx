import { Button, Flex, Tag } from 'antd';
import * as monaco from 'monaco-editor';
import { editor as monacoEditor } from 'monaco-editor/esm/vs/editor/editor.api';
import { useEffect, useRef, useState } from 'react';
import MonacoEditor from 'react-monaco-editor';
import './styles.less';

enum ItemType {
  LABEL = 'label',
  FUNCTION = 'function',
}

const getLabels = (): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(['id', 'name']);
    }, 500);
  });
};

const getFunctions = (): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(['Lower(string)', 'cos(x)']);
    }, 2000);
  });
};

const Index = () => {
  const [labels, setLabels] = useState<string[]>([]);
  const [functions, setFunctions] = useState<string[]>([]);
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  // 是否有保存但没有赋值的函数
  const [lastFunction, setLastFunction] = useState<string | null>(null);
  const tokenizerRef = useRef<{
    [name: string]: monaco.languages.IMonarchLanguageRule[];
  }>({});
  const [key, setKey] = useState(0);
  const createTokenizer = (): {
    [name: string]: monaco.languages.IMonarchLanguageRule[];
  } => {
    return {
      root: [
        ...labels.map((label) => ({
          regex: new RegExp(`\\b${label}\\b`),
          action: { token: 'custom-label' },
        })),
        ...functions.map((func) => {
          const functionName = func.split('(')[0];
          return {
            regex: new RegExp(`\\b${functionName}\\b`),
            action: { token: 'custom-function' },
          };
        }),
      ],
    };
  };

  const handleClick = (type: ItemType, item: string) => {
    let newCode = '';
    const currentCode = editorRef.current?.getValue();
    if (type === ItemType.FUNCTION) {
      setLastFunction(item);
      newCode = currentCode + item;
    } else if (type === ItemType.LABEL && lastFunction) {
      const functionWithoutArgs = lastFunction.replace(/\(.*\)/, '');
      const functionRegex = new RegExp(
        `(${functionWithoutArgs}\\()([^)]*)(\\))`,
      );
      const lastFunctionIndex = currentCode?.lastIndexOf(lastFunction);
      if (lastFunctionIndex !== undefined && lastFunctionIndex !== -1) {
        newCode =
          currentCode?.substring(0, lastFunctionIndex) +
          lastFunction.replace(functionRegex, `$1[${item}]$3`) +
          currentCode?.substring(lastFunctionIndex + lastFunction.length);
      }
      setLastFunction(null);
    } else {
      newCode = currentCode + item;
    }
    editorRef.current?.setValue(newCode);
  };

  const editorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco,
  ) => {
    editorRef.current = editor;
    monacoInstance.languages.register({ id: 'mySpecialLanguage' });
    monacoInstance.languages.setMonarchTokensProvider('mySpecialLanguage', {
      tokenizer: tokenizerRef.current,
    });

    monacoInstance.editor.defineTheme('myTheme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'custom-label', foreground: 'ff0000', fontStyle: 'bold' },
        { token: 'custom-function', foreground: '0000ff', fontStyle: 'bold' },
      ],
      colors: {},
    });
  };

  const submit = () => {
    console.log(editorRef.current?.getValue());
  };

  useEffect(() => {
    getLabels().then((data) => {
      setLabels(data);
    });
    getFunctions().then((data) => {
      setFunctions(data);
    });
  }, []);

  useEffect(() => {
    // tokenizer不支持动态修改 获取数据后需要重新挂载才能生效
    tokenizerRef.current = createTokenizer();
    setKey((prevKey) => prevKey + 1);
  }, [labels, functions]);

  return (
    <Flex gap={20}>
      <MonacoEditor
        key={key}
        width="800"
        height="600"
        language="mySpecialLanguage"
        theme="myTheme"
        editorDidMount={editorDidMount}
      />

      <div>
        {labels?.map((item, index) => {
          return (
            <Tag onClick={() => handleClick(ItemType.LABEL, item)} key={index}>
              {item}
            </Tag>
          );
        })}
      </div>
      <div>
        {functions?.map((item, index) => {
          return (
            <Tag
              onClick={() => handleClick(ItemType.FUNCTION, item)}
              key={index}
            >
              {item}
            </Tag>
          );
        })}
      </div>
      <Button onClick={submit} type="primary">
        submit
      </Button>
    </Flex>
  );
};
export default Index;
