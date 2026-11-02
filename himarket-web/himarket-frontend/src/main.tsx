import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { createRoot } from 'react-dom/client';

import 'antd/dist/reset.css';
import './index.css';
import App from './App.tsx';
import { connectDsh } from './lib/dsh-app';

// 使用本地 monaco-editor 包，避免从 CDN (unpkg.com) 加载导致国内网络卡在 Loading...
loader.config({ monaco });

const rootElement = document.getElementById('root');
if (rootElement) {
  // 嵌在 dsh 里时先拿到宿主给的登录令牌再渲染
  void connectDsh().then(() => createRoot(rootElement).render(<App />));
}
