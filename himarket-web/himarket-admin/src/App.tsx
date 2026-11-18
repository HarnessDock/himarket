import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';

import aliyunThemeToken from './aliyunThemeToken';
import { LoadingProvider } from './contexts/LoadingContext';
import { LocaleProvider, useLocale } from './contexts/LocaleContext';
import { router } from './routes';
import './App.css';

import type { ReactNode } from 'react';

function AdminConfigProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();

  return (
    <ConfigProvider
      locale={locale === 'en-US' ? enUS : zhCN}
      theme={{
        components: {
          Button: {
            primaryShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
          },
          Card: {
            borderRadiusLG: 12,
          },
          Table: {
            rowHoverBg: '#F5F5F5',
          },
        },
        token: aliyunThemeToken,
      }}
    >
      {children}
    </ConfigProvider>
  );
}

function App() {
  return (
    <LoadingProvider>
      <LocaleProvider>
        <AdminConfigProvider>
          <RouterProvider router={router} />
        </AdminConfigProvider>
      </LocaleProvider>
    </LoadingProvider>
  );
}

export default App;
