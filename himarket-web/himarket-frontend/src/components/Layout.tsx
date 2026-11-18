import { Skeleton } from 'antd';

import { Header } from './Header';

import type { ReactNode } from 'react';

const SOFT_BACKGROUND_IMAGE = 'linear-gradient(180deg, #FAFAFA 0%, #FAFAFA 100%)';

const AMBIENT_BACKGROUND_IMAGE = 'linear-gradient(180deg, #FAFAFA 0%, #FAFAFA 100%)';

const CHAT_LAVENDER_FLOW =
  'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, 0.015) 50%, rgba(255, 255, 255, 0) 100%)';

const CHAT_BLUE_FLOW =
  'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, 0.015) 50%, rgba(255, 255, 255, 0) 100%)';

const MARKET_LAVENDER_FLOW =
  'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, 0.015) 50%, rgba(255, 255, 255, 0) 100%)';

const MARKET_BLUE_FLOW =
  'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, 0.015) 50%, rgba(255, 255, 255, 0) 100%)';

interface LayoutProps {
  children: ReactNode;
  className?: string;
  loading?: boolean;
  backgroundVariant?: 'default' | 'soft' | 'chat' | 'market';
}

export function Layout({
  backgroundVariant = 'default',
  children,
  className = '',
  loading = false,
}: LayoutProps) {
  const isChatBackground = backgroundVariant === 'chat';
  const isMarketBackground = backgroundVariant === 'market';
  const isAnimatedBackground = isChatBackground || isMarketBackground;
  const hasCustomBackground = backgroundVariant !== 'default';

  return (
    <div
      className={`flex min-h-screen flex-col overflow-x-clip ${className}`}
      style={
        hasCustomBackground
          ? {
              backgroundAttachment: 'fixed',
              backgroundImage: isAnimatedBackground
                ? AMBIENT_BACKGROUND_IMAGE
                : SOFT_BACKGROUND_IMAGE,
            }
          : // 黑白主调：默认背景原来是一张淡紫蓝的模糊图（assets/bg.png），改成纯色
            { backgroundColor: '#FAFAFA' }
      }
    >
      {isAnimatedBackground && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
          <div
            className={`absolute -top-[54vh] h-[195vh] ${
              isMarketBackground
                ? 'market-canvas-lavender -left-[34vw] w-[92vw]'
                : 'chat-canvas-lavender -left-[36vw] w-[96vw]'
            }`}
            style={{
              backgroundImage: isMarketBackground ? MARKET_LAVENDER_FLOW : CHAT_LAVENDER_FLOW,
            }}
          />
          <div
            className={`absolute -top-[40vh] h-[190vh] ${
              isMarketBackground
                ? 'market-canvas-blue -right-[38vw] w-[90vw]'
                : 'chat-canvas-blue -right-[40vw] w-[94vw]'
            }`}
            style={{ backgroundImage: isMarketBackground ? MARKET_BLUE_FLOW : CHAT_BLUE_FLOW }}
          />
        </div>
      )}
      <Header />
      <div className="flex-1 min-h-0 relative z-10">
        <main className="h-full">
          <div className="mx-auto h-full w-full px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="space-y-8 py-8">
                {/* 页面标题骨架屏 */}
                <div className="text-center mb-8">
                  <Skeleton.Input
                    active
                    size="large"
                    style={{ height: 48, margin: '0 auto 16px', width: 300 }}
                  />
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ height: 24, margin: '0 auto', width: '80%' }}
                  />
                </div>

                {/* 搜索框骨架屏 */}
                <div className="flex justify-center mb-8">
                  <div className="relative w-full max-w-2xl">
                    <Skeleton.Input active size="large" style={{ height: 40, width: '100%' }} />
                  </div>
                </div>

                {/* 子标题骨架屏 */}
                <div className="mb-6">
                  <Skeleton.Input active size="small" style={{ height: 32, width: 200 }} />
                </div>

                {/* 内容区域骨架屏 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div className="h-full rounded-lg shadow-lg bg-white p-4" key={index}>
                      <div className="flex items-start space-x-4">
                        <Skeleton.Avatar active size={48} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <Skeleton.Input active size="small" style={{ width: 120 }} />
                            <Skeleton.Input active size="small" style={{ width: 60 }} />
                          </div>
                          <Skeleton.Input
                            active
                            size="small"
                            style={{ marginBottom: 8, width: 80 }}
                          />
                          <Skeleton.Input
                            active
                            size="small"
                            style={{ marginBottom: 12, width: '100%' }}
                          />
                          <Skeleton.Input
                            active
                            size="small"
                            style={{ marginBottom: 12, width: '100%' }}
                          />
                          <div className="flex items-center justify-between">
                            <Skeleton.Input active size="small" style={{ width: 60 }} />
                            <Skeleton.Input active size="small" style={{ width: 80 }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
        {/* <Footer /> */}
      </div>
    </div>
  );
}
