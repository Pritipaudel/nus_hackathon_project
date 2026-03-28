import { useRef, useState } from 'react';

import {
  COMMUNITY_MEMBERS,
  COMMUNITY_RECOMMENDED_PROGRAMS,
  COMMUNITY_ENGAGEMENTS,
  MOCK_CHAT_MESSAGES,
} from '@shared/constants';
import type { CommunityMember, ChatMessage } from '@shared/constants';

type Tab = 'members' | 'recommended' | 'engagement';

const timeLabel = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const CATEGORY_COLORS: Record<string, string> = {
  ANXIETY: 'ch-cat--amber',
  DEPRESSION: 'ch-cat--blue',
  STRESS: 'ch-cat--red',
  SLEEP: 'ch-cat--purple',
  RELATIONSHIPS: 'ch-cat--pink',
  TRAUMA: 'ch-cat--orange',
  GENERAL: 'ch-cat--gray',
};

const CommunityHubPage = () => {
  const [tab, setTab] = useState<Tab>('members');
  const [activeMember, setActiveMember] = useState<CommunityMember | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>(MOCK_CHAT_MESSAGES);
  const [draft, setDraft] = useState('');
  const [enrolledPrograms, setEnrolledPrograms] = useState<Set<string>>(new Set(['1']));
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const openChat = (m: CommunityMember) => {
    setActiveMember(m);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const sendMessage = () => {
    if (!draft.trim() || !activeMember) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      senderName: 'You',
      content: draft.trim(),
      timestamp: new Date().toISOString(),
      isOwn: true,
    };
    setChatHistory((prev) => ({
      ...prev,
      [activeMember.id]: [...(prev[activeMember.id] ?? []), msg],
    }));
    setDraft('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleEnroll = (programId: string) => {
    setEnrolling(programId);
    setTimeout(() => {
      setEnrolledPrograms((prev) => new Set([...prev, programId]));
      setEnrolling(null);
    }, 700);
  };

  const onlineCount = COMMUNITY_MEMBERS.filter((m) => m.status === 'online').length;

  return (
    <div className="ch-page">
      {/* Header */}
      <div className="ch-header">
        <div>
          <h1 className="ch-header__title">My Community</h1>
          <p className="ch-header__sub">
            <span className="ch-online-dot" />
            {onlineCount} online · {COMMUNITY_MEMBERS.length} members in your community
          </p>
        </div>
        <div className="ch-tab-bar">
          {(['members', 'recommended', 'engagement'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`ch-tab ${tab === t ? 'ch-tab--active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'members' ? 'Members & Chat' : t === 'recommended' ? 'Recommended' : 'Engagement'}
            </button>
          ))}
        </div>
      </div>

      {/* Members & Chat */}
      {tab === 'members' && (
        <div className="ch-members-layout">
          {/* Member list */}
          <div className="ch-member-list">
            <p className="ch-member-list__label">Community members</p>
            {COMMUNITY_MEMBERS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`ch-member-row ${activeMember?.id === m.id ? 'ch-member-row--active' : ''}`}
                onClick={() => openChat(m)}
              >
                <div className="ch-member-row__avatar-wrap">
                  {m.photo ? (
                    <img src={m.photo} alt={m.username} className="ch-member-row__photo" />
                  ) : (
                    <div className="ch-member-row__avatar">{m.avatar}</div>
                  )}
                  <span className={`ch-member-row__status ch-member-row__status--${m.status}`} />
                </div>
                <div className="ch-member-row__info">
                  <p className="ch-member-row__name">{m.username}</p>
                  <p className="ch-member-row__meta">
                    {m.role === 'worker' ? (
                      <span className="ch-verified-badge">Health Worker</span>
                    ) : (
                      <span className={`ch-cat-chip ${CATEGORY_COLORS[m.category]}`}>{m.category}</span>
                    )}
                  </p>
                </div>
                <div className="ch-member-row__right">
                  <span className={`ch-status-label ch-status-label--${m.status}`}>
                    {m.status === 'online' ? 'Online' : m.status === 'away' ? 'Away' : 'Offline'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Chat panel */}
          <div className="ch-chat">
            {!activeMember ? (
              <div className="ch-chat__empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p>Select a community member to start a conversation</p>
                <span>All messages are private and end-to-end encrypted</span>
              </div>
            ) : (
              <>
                <div className="ch-chat__header">
                  <div className="ch-chat__header-user">
                    {activeMember.photo ? (
                      <img src={activeMember.photo} alt={activeMember.username} className="ch-chat__header-photo" />
                    ) : (
                      <div className="ch-chat__header-avatar">{activeMember.avatar}</div>
                    )}
                    <div>
                      <p className="ch-chat__header-name">{activeMember.username}</p>
                      <p className={`ch-chat__header-status ch-chat__header-status--${activeMember.status}`}>
                        {activeMember.status === 'online' ? 'Online now' : activeMember.status === 'away' ? 'Away' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <button type="button" className="ch-chat__close" onClick={() => setActiveMember(null)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="ch-chat__messages">
                  {(chatHistory[activeMember.id] ?? []).map((msg) => (
                    <div key={msg.id} className={`ch-msg ${msg.isOwn ? 'ch-msg--own' : 'ch-msg--other'}`}>
                      {!msg.isOwn && (
                        msg.senderPhoto ? (
                          <img src={msg.senderPhoto} alt={msg.senderName} className="ch-msg__photo" />
                        ) : (
                          <div className="ch-msg__avatar">{msg.senderName[0]}</div>
                        )
                      )}
                      <div className="ch-msg__body">
                        <p className="ch-msg__text">{msg.content}</p>
                        <span className="ch-msg__time">{timeLabel(msg.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                  {(chatHistory[activeMember.id] ?? []).length === 0 && (
                    <p className="ch-chat__no-msgs">No messages yet. Say hello!</p>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="ch-chat__input-bar">
                  <input
                    type="text"
                    className="ch-chat__input"
                    placeholder="Type a message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  />
                  <button
                    type="button"
                    className="ch-chat__send"
                    disabled={!draft.trim()}
                    onClick={sendMessage}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recommended programmes */}
      {tab === 'recommended' && (
        <div className="ch-recommended">
          <div className="ch-recommended__intro">
            <p className="ch-recommended__intro-text">
              These programmes are recommended based on what your community members are doing and what your health worker has suggested for you.
            </p>
          </div>
          <div className="ch-prog-grid">
            {COMMUNITY_RECOMMENDED_PROGRAMS.map((p) => {
              const isEnrolled = enrolledPrograms.has(p.id);
              const isEnrolling = enrolling === p.id;
              const engagement = COMMUNITY_ENGAGEMENTS.find((e) => e.programId === p.id);
              return (
                <div key={p.id} className={`ch-prog-card ${isEnrolled ? 'ch-prog-card--enrolled' : ''}`}>
                  <div className="ch-prog-card__cover-wrap">
                    <img src={p.coverUrl} alt={p.title} className="ch-prog-card__cover" loading="lazy" />
                    {engagement?.trending && (
                      <span className="ch-prog-card__trending">Trending in your community</span>
                    )}
                  </div>
                  <div className="ch-prog-card__body">
                    <div className="ch-prog-card__meta">
                      <span className={`ch-cat-chip ${CATEGORY_COLORS[p.category] ?? ''}`}>{p.category}</span>
                      <span className="ch-prog-card__difficulty">{p.difficultyLevel} · {p.durationDays} days</span>
                    </div>
                    <h3 className="ch-prog-card__title">{p.title}</h3>
                    <p className="ch-prog-card__desc">{p.description}</p>

                    {engagement && (
                      <div className="ch-prog-card__engagement">
                        <div className="ch-avatar-stack">
                          {engagement.members.slice(0, 3).map((mem) => (
                            mem.photo ? (
                              <img key={mem.id} src={mem.photo} alt="" className="ch-avatar-stack__item" />
                            ) : (
                              <div key={mem.id} className="ch-avatar-stack__item ch-avatar-stack__item--fallback">{mem.avatar}</div>
                            )
                          ))}
                        </div>
                        <span className="ch-prog-card__engagement-label">
                          <strong>{engagement.memberCount}</strong> community {engagement.memberCount === 1 ? 'member' : 'members'} enrolled
                        </span>
                      </div>
                    )}

                    <div className="ch-prog-card__tags">
                      {p.tags.map((tag) => (
                        <span key={tag} className="ch-tag">{tag}</span>
                      ))}
                    </div>

                    <div className="ch-prog-card__footer">
                      {isEnrolled ? (
                        <button type="button" className="btn btn-secondary btn-sm" disabled>
                          Already enrolled
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={isEnrolling}
                          onClick={() => handleEnroll(p.id)}
                        >
                          {isEnrolling && <span className="btn-spinner" />}
                          {isEnrolling ? 'Enrolling...' : 'Enroll now'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Community engagement */}
      {tab === 'engagement' && (
        <div className="ch-engagement">
          <div className="ch-engagement__intro">
            <p className="ch-engagement__intro-text">
              See which programmes your community members are actively working on. Joining a programme others are doing means you have people to support you through it.
            </p>
          </div>

          <div className="ch-engagement-list">
            {COMMUNITY_ENGAGEMENTS.map((eng) => {
              const program = COMMUNITY_RECOMMENDED_PROGRAMS.find((p) => p.programId === eng.programId) ??
                COMMUNITY_RECOMMENDED_PROGRAMS.find((p) => p.id === eng.programId);
              const isEnrolled = enrolledPrograms.has(eng.programId);
              const isEnrolling = enrolling === eng.programId;
              return (
                <div key={eng.programId} className="ch-eng-card">
                  <div className="ch-eng-card__left">
                    <div className="ch-eng-card__title-row">
                      <p className="ch-eng-card__title">{eng.programTitle}</p>
                      {eng.trending && <span className="ch-eng-card__trending-badge">Trending</span>}
                    </div>

                    <div className="ch-eng-card__members">
                      <div className="ch-avatar-stack">
                        {eng.members.slice(0, 4).map((m) => (
                          m.photo ? (
                            <img key={m.id} src={m.photo} alt="" className="ch-avatar-stack__item" />
                          ) : (
                            <div key={m.id} className="ch-avatar-stack__item ch-avatar-stack__item--fallback">{m.avatar}</div>
                          )
                        ))}
                        {eng.memberCount > 4 && (
                          <div className="ch-avatar-stack__item ch-avatar-stack__item--more">+{eng.memberCount - 4}</div>
                        )}
                      </div>
                      <p className="ch-eng-card__count">
                        <strong>{eng.memberCount} people</strong> from your community are enrolled in this programme
                      </p>
                    </div>

                    {program && (
                      <p className="ch-eng-card__desc">{program.description}</p>
                    )}
                  </div>

                  <div className="ch-eng-card__right">
                    <div className="ch-eng-card__stat">
                      <span className="ch-eng-card__stat-value">{eng.memberCount}</span>
                      <span className="ch-eng-card__stat-label">enrolled</span>
                    </div>
                    {isEnrolled ? (
                      <button type="button" className="btn btn-secondary btn-sm" disabled>Enrolled</button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={isEnrolling}
                        onClick={() => handleEnroll(eng.programId)}
                      >
                        {isEnrolling && <span className="btn-spinner" />}
                        {isEnrolling ? 'Enrolling...' : 'Join them'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Member activity feed */}
          <div className="ch-activity-feed">
            <p className="ch-activity-feed__title">Recent community activity</p>
            <div className="ch-activity-feed__list">
              {[
                { member: COMMUNITY_MEMBERS[0], action: 'completed module 4 of Understanding Anxiety', time: '1h ago' },
                { member: COMMUNITY_MEMBERS[4], action: 'shared a post about grief and recovery', time: '3h ago' },
                { member: COMMUNITY_MEMBERS[2], action: 'enrolled in Stress & Burnout Reset', time: '5h ago' },
                { member: COMMUNITY_MEMBERS[5], action: 'posted in the Relationships category', time: '8h ago' },
                { member: COMMUNITY_MEMBERS[1], action: 'completed the Sleep & Recovery programme', time: '1d ago' },
              ].map((item, i) => (
                <div key={i} className="ch-feed-row">
                  {item.member.photo ? (
                    <img src={item.member.photo} alt={item.member.username} className="ch-feed-row__photo" />
                  ) : (
                    <div className="ch-feed-row__avatar">{item.member.avatar}</div>
                  )}
                  <div className="ch-feed-row__body">
                    <p className="ch-feed-row__text">
                      <span className="ch-feed-row__username">{item.member.username}</span>
                      {' '}{item.action}
                    </p>
                    <span className="ch-feed-row__time">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityHubPage;
