import { AiRuntimeClient, toTurns, type CallRecord, type CallRecordDetail } from '@harnessdock/ai-runtime-sdk';
import { Transcript } from '@harnessdock/ai-runtime-react';
import { Alert, Button, Drawer, Input, Segmented, Spin, Table, Tag, type TableColumnType } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Layout } from '../components/Layout';
import MarkdownRender from '../components/MarkdownRender';
import { currentToken, handleCallback, loadConfig, login, type RecordsConfig } from '../lib/agentRecordsAuth';
import { formatDateTime } from '../lib/utils';

const STATUS: Record<string, { color: string; label: string }> = {
  cancelled: { color: 'default', label: '已取消' },
  failed: { color: 'error', label: '失败' },
  running: { color: 'processing', label: '进行中' },
  succeeded: { color: 'success', label: '完成' },
};

/**
 * HarnessDock：ai-runtime 的调用记录（2026-11-11 定：自己的调用；带 admin 角色的能看所有人的）。
 * 包括在 LPM 等应用里发起的调用，按会话列出，点开看完整的对话过程（工具调用、联网检索、结果）。
 * 记录随 ai-runtime 的保留时长删除（默认 1 天）。
 */
export default function AgentRecords() {
  const [config, setConfig] = useState<RecordsConfig | null>();
  const [token, setToken] = useState<string>();
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const c = await loadConfig();
      setConfig(c ?? null);
      if (!c) return;
      const t = (await handleCallback(c)) ?? currentToken();
      if (t) setToken(t);
      else await login(c);
    })().catch((e: Error) => setError(e.message));
  }, []);

  const client = useMemo(
    () => (config && token ? new AiRuntimeClient({ baseUrl: config.aiRuntimeUrl, headers: { authorization: `Bearer ${token}` } }) : undefined),
    [config, token],
  );

  return (
    <Layout backgroundVariant="market">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <h1 className="mb-1 text-2xl font-semibold">调用记录</h1>
        <p className="mb-4 text-sm text-gray-500">Worker 在服务端的每一次运行（含 LPM 等应用里发起的），保留 1 天。</p>
        {error && <Alert className="mb-4" message={error} showIcon type="error" />}
        {config === null && <Alert message="门户没有配置调用记录（缺 /agent-records.json）" showIcon type="warning" />}
        {config && !token && !error && <Spin />}
        {client && <Records client={client} onExpired={() => config && login(config)} />}
      </div>
    </Layout>
  );
}

function Records({ client, onExpired }: { client: AiRuntimeClient; onExpired: () => void }) {
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [worker, setWorker] = useState('');
  const [items, setItems] = useState<CallRecord[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string>();

  const load = useCallback(async (before?: string) => {
    setLoading(true);
    setError('');
    try {
      const r = await client.listRecords({ before, scope, worker: worker || undefined });
      setItems((old) => (before ? [...old, ...r.items] : r.items));
      setNext(r.next);
      setAdmin(r.admin);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) onExpired();
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [client, scope, worker, onExpired]);

  useEffect(() => { void load(); }, [load]);

  const columns: TableColumnType<CallRecord>[] = [
    { dataIndex: 'lastActiveAt', render: (v: string) => formatDateTime(v), title: '最近活动', width: 170 },
    { key: 'worker', render: (_, r) => <span>{r.worker.name} <span className="text-gray-400">{r.worker.version}</span></span>, title: 'Worker' },
    { dataIndex: 'title', render: (v: string | null) => v ?? '—', title: '标题' },
    { dataIndex: 'appId', title: '应用', width: 90 },
    ...(scope === 'all' ? [{ dataIndex: 'userId', title: '用户', width: 120 }] : []),
    { dataIndex: 'runs', title: '轮数', width: 70 },
    {
      key: 'status',
      render: (_, r) => {
        const s = r.lastRun ? STATUS[r.lastRun.status] : undefined;
        const secs = r.lastRun?.endedAt ? Math.round((Date.parse(r.lastRun.endedAt) - Date.parse(r.lastRun.startedAt)) / 1000) : undefined;
        return s ? <span><Tag color={s.color}>{s.label}</Tag>{secs !== undefined && <span className="text-gray-400">{secs} 秒</span>}</span> : '—';
      },
      title: '最后一轮',
      width: 150,
    },
  ];

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {admin && <Segmented onChange={(v) => setScope(v as 'mine' | 'all')} options={[{ label: '我的', value: 'mine' }, { label: '全部（管理员）', value: 'all' }]} value={scope} />}
        <Input.Search allowClear onSearch={setWorker} placeholder="按 Worker 名筛选，如 客户评级" style={{ width: 260 }} />
        <Button onClick={() => load()}>刷新</Button>
      </div>
      {error && <Alert className="mb-3" message={error} showIcon type="error" />}
      <Table
        columns={columns}
        dataSource={items}
        loading={loading}
        onRow={(r) => ({ onClick: () => setOpen(r.sessionId), style: { cursor: 'pointer' } })}
        pagination={false}
        rowKey="sessionId"
        size="middle"
      />
      {next && <div className="mt-3 text-center"><Button loading={loading} onClick={() => load(next)}>加载更多</Button></div>}
      <Detail client={client} onClose={() => setOpen(undefined)} sessionId={open} />
    </>
  );
}

function Detail({ client, sessionId, onClose }: { client: AiRuntimeClient; sessionId?: string; onClose: () => void }) {
  const [rec, setRec] = useState<CallRecordDetail>();
  const [error, setError] = useState('');
  useEffect(() => {
    setRec(undefined);
    setError('');
    if (sessionId) client.getRecord(sessionId).then(setRec).catch((e: Error) => setError(e.message));
  }, [client, sessionId]);
  const turns = useMemo(() => (rec ? toTurns(rec.events) : []), [rec]);
  return (
    <Drawer onClose={onClose} open={!!sessionId} title={rec ? `${rec.worker.name} ${rec.worker.version}${rec.title ? ` · ${rec.title}` : ''}` : '调用详情'} width={760}>
      {error && <Alert message={error} showIcon type="error" />}
      {!rec && !error && <Spin />}
      {rec && (
        <>
          <p className="mb-4 text-sm text-gray-500">应用 {rec.appId} · 用户 {rec.userId} · 创建于 {formatDateTime(rec.createdAt)} · 共 {rec.runs} 轮</p>
          <Transcript renderText={(t) => <MarkdownRender content={t} />} turns={turns} />
        </>
      )}
    </Drawer>
  );
}
