import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  PlayCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { WorkspaceTab } from '../components/TopNav';
import { SITE_CONFIG } from '../data/siteConfig';
import type { PortalSection } from '../utils/router';

interface VideoShowcaseProps {
  onNavigate: (section: PortalSection, demoTab?: WorkspaceTab) => void;
}

const DEMO_SCRIPT_CHAPTERS: Array<{
  time: string;
  title: string;
  detail: string;
  tab: WorkspaceTab;
}> = [
  {
    time: '0:00 – 0:40',
    title: '需求拆解与信息边界',
    detail: '演示自然语言拆解，输出 8 项定制参数并坚守未指定不代定色原则。',
    tab: 'requirements',
  },
  {
    time: '0:40 – 1:30',
    title: '场景选配与实时联动',
    detail: '按需求筛选适配面料、版型、工艺与场景，实时联动 3D 面料光泽与版型图。',
    tab: 'configurator',
  },
  {
    time: '1:30 – 2:15',
    title: '定制方案与绘图提示词',
    detail: '生成带搭配依据的方案初稿及即梦、Midjourney、Flux 三镜头提示词。',
    tab: 'proposal',
  },
  {
    time: '2:15 – 3:00',
    title: '项目档案追溯与导出',
    detail: '回看原始需求与修改前后 Diff，在线编辑复核状态并导出 UTF-8 CSV。',
    tab: 'ledger',
  },
];

export function VideoShowcase({ onNavigate }: VideoShowcaseProps) {
  const [copied, setCopied] = useState(false);
  const { video } = SITE_CONFIG;
  const hasVideo = Boolean(video.embedUrl || video.localMp4Path || video.externalUrl);
  const pageUrl = `${SITE_CONFIG.siteUrl}/video`;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <h1 className="page-h1">演示视频</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              navigator.clipboard?.writeText(video.externalUrl || pageUrl).catch(() => {});
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? '已复制链接' : '复制链接'}</span>
          </button>
          <button
            type="button"
            className="btn-black"
            onClick={() => onNavigate('demo', 'requirements')}
          >
            <span>体验在线 Demo</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <section className="surface-card" style={{ padding: 20 }}>
        {video.embedUrl ? (
          <div className="video-frame-16-9">
            <iframe
              src={video.embedUrl}
              title={video.title}
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
            />
          </div>
        ) : video.localMp4Path ? (
          <div className="video-frame-16-9">
            <video
              controls
              playsInline
              poster="/assets/official1-studio-jacket.jpg"
              style={{ width: '100%', height: '100%', borderRadius: 12, background: '#111' }}
            >
              <source src={video.localMp4Path} type="video/mp4" />
            </video>
          </div>
        ) : (
          <div className="video-placeholder-frame">
            <img
              src="/assets/official1-studio-jacket.jpg"
              alt="Sartoria AI 演示视频封面"
              className="video-placeholder-bg"
            />
            <div className="video-placeholder-overlay">
              <PlayCircle size={48} strokeWidth={1.4} />
              <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 12 }}>{video.title}</h2>
              <p style={{ fontSize: 13.5, opacity: 0.88, maxWidth: 520, textAlign: 'center', marginTop: 10, lineHeight: 1.65 }}>
                上传公开演示视频后，在 <code>src/data/siteConfig.ts</code> 配置直链即可在此播放。
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-black"
                  style={{ background: '#ffffff', color: '#111111', borderColor: '#ffffff' }}
                  onClick={() => onNavigate('demo', 'requirements')}
                >
                  <span>进入在线 Demo</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {hasVideo && video.externalUrl && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <a
              href={video.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
            >
              <span>打开原视频</span>
              <ArrowUpRight size={14} />
            </a>
          </div>
        )}
      </section>

      <div className="deconstruct-grid" style={{ marginTop: 24 }}>
        <section className="surface-card">
          <h2 style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 14 }}>演示章节</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {DEMO_SCRIPT_CHAPTERS.map((ch) => (
              <div key={ch.time} className="ledger-block">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 13.5 }}>{ch.title}</strong>
                  <span className="tag-minimal" style={{ fontFamily: 'var(--font-mono)' }}>
                    {ch.time}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 6, lineHeight: 1.6 }}>
                  {ch.detail}
                </p>
                <button
                  type="button"
                  className="btn-text"
                  style={{ marginTop: 6 }}
                  onClick={() => onNavigate('demo', ch.tab)}
                >
                  <span>前往该步骤</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card">
          <h2 style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 14 }}>发布核验清单</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {video.hostingChecklist.map((item) => (
              <div key={item} className="notice-row">
                <CheckCircle2 size={14} color="var(--pass)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
