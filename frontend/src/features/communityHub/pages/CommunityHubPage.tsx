import { useEffect, useMemo, useRef, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { communityApi, isTrendingProblemItem } from '@features/community/api/communityApi';
import type { ChatContactDto } from '@features/chat/api/directChatApi';
import { useChatContacts, useChatMessages, useSendChatMessage } from '@features/chat/hooks/useDirectChat';
import {
  useCommunityGroups,
  useCommunityProblemsGrouped,
  useCreateCommunityGroup,
  useCreateCommunityProblem,
  useCreateGroupInvite,
  useJoinCommunityGroup,
  useLeaveCommunityGroup,
  useMyCommunityGroups,
  useToggleProblemUpvote,
} from '@features/community/hooks/useCommunity';
import { useEnrollIcbt, useIcbtPrograms, useMyIcbtPrograms } from '@features/icbt/hooks/useIcbt';
import { useAuthStore } from '@shared/stores/authStore';
import type { IcbtProgram } from '@shared/types';

type Tab = 'members' | 'recommended' | 'problems' | 'engagement';

export type CommunityHubVariant = 'patient' | 'health_worker';

export type CommunityHubPageProps = {
  /** `patient` — hub with Recommended, Problems & Engagement; chat lists workers linked via meetings. */
  variant?: CommunityHubVariant;
};

type HubMember = {
  id: string;
  username: string;
  avatar: string;
  photo?: string;
  role: 'member' | 'worker';
  status: 'online' | 'away' | 'offline';
  joinedDaysAgo: number;
  category: string;
};

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

const GROUP_TYPE_OPTIONS = [
  { value: 'CUSTOM', label: 'Custom' },
  { value: 'RELIGION', label: 'Religion' },
  { value: 'ETHNICITY_CASTE', label: 'Ethnicity / caste' },
  { value: 'GENDER', label: 'Gender' },
  { value: 'RACE', label: 'Race' },
] as const;

const groupTypeLabel = (value: string) =>
  GROUP_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;

const PROBLEM_CATEGORIES = [
  'Harassment',
  'Family trauma',
  'Access to care',
  'Stigma',
  'Workplace',
  'General',
] as const;

const SeverityDots = ({ level }: { level: number }) => (
  <span className="ch-problem-severity" aria-label={`Severity ${level} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        className={`ch-problem-severity__dot ${i <= level ? 'ch-problem-severity__dot--on' : ''}`}
      />
    ))}
  </span>
);

const icbtProgramCoverUrl = (id: string) => {
  const seeds = ['1506126613408-eca07ce68773', '1545205597-3d9d02c29597', '1499209974431-9dddcece7f88'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % seeds.length;
  return `https://images.unsplash.com/photo-${seeds[h]}?w=400&q=80`;
};

const totalCommunityEnrollment = (p: IcbtProgram): number =>
  p.community_metadata.reduce((a, m) => a + m.total_users_using, 0);

const chatContactToMember = (c: ChatContactDto): HubMember => {
  const name = (c.display_name || c.anonymous_username || 'Unknown').trim();
  const initial = [...name][0]?.toUpperCase() ?? '?';
  return {
    id: c.user_id,
    username: name,
    avatar: initial,
    role: c.peer_role === 'health_worker' ? 'worker' : 'member',
    status: 'offline',
    joinedDaysAgo: 0,
    category: 'GENERAL',
  };
};

const CommunityHubPage = ({ variant = 'patient' }: CommunityHubPageProps) => {
  const [tab, setTab] = useState<Tab>('members');
  const [activeMember, setActiveMember] = useState<HubMember | null>(null);
  const [draft, setDraft] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<string>('CUSTOM');
  const [newGroupValue, setNewGroupValue] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [inviteCopiedGroupId, setInviteCopiedGroupId] = useState<string | null>(null);
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [problemCategory, setProblemCategory] = useState<string>('General');
  const [problemSeverity, setProblemSeverity] = useState(3);
  const [problemGroupId, setProblemGroupId] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  const isHealthWorkerPortal = variant === 'health_worker';
  const showMemberChat = isHealthWorkerPortal || tab === 'members';

  const contactsQuery = useChatContacts(Boolean(showMemberChat && user));
  const messagesQuery = useChatMessages(
    activeMember?.id ?? null,
    Boolean(showMemberChat && activeMember),
  );
  const sendMessageMutation = useSendChatMessage();

  const programsQuery = useIcbtPrograms();
  const myProgramsQuery = useMyIcbtPrograms();
  const enrollMutation = useEnrollIcbt();

  const allGroupsQuery = useCommunityGroups();
  const myGroupsQuery = useMyCommunityGroups();
  const createGroupMutation = useCreateCommunityGroup();
  const joinGroupMutation = useJoinCommunityGroup();
  const leaveGroupMutation = useLeaveCommunityGroup();
  const createInviteMutation = useCreateGroupInvite();
  const problemsGroupedQuery = useCommunityProblemsGrouped(
    Boolean(user) && !isHealthWorkerPortal && tab === 'problems',
  );
  const createProblemMut = useCreateCommunityProblem();
  const toggleProblemUpvoteMut = useToggleProblemUpvote();

  const postsQuery = useQuery({
    queryKey: ['community', 'posts', 'hub-feed'],
    queryFn: () => communityApi.getPosts({ limit: 20 }),
    enabled: Boolean(user) && !isHealthWorkerPortal && tab === 'engagement',
  });

  const enrolledIds = useMemo(
    () => new Set((myProgramsQuery.data ?? []).map((p) => p.program_id)),
    [myProgramsQuery.data],
  );

  const myGroupIdSet = useMemo(
    () => new Set((myGroupsQuery.data ?? []).map((g) => g.id)),
    [myGroupsQuery.data],
  );

  const discoverGroups = useMemo(
    () => (allGroupsQuery.data ?? []).filter((g) => !myGroupIdSet.has(g.id)),
    [allGroupsQuery.data, myGroupIdSet],
  );

  const { trendingProblemsGroup, problemCategoryGroups } = useMemo(() => {
    const rows = problemsGroupedQuery.data ?? [];
    const trending = rows.find((g) => g.category === 'Trending');
    const rest = rows.filter((g) => g.category !== 'Trending');
    return { trendingProblemsGroup: trending, problemCategoryGroups: rest };
  }, [problemsGroupedQuery.data]);

  const programsByEngagement = useMemo(() => {
    const list = [...(programsQuery.data ?? [])];
    list.sort((a, b) => totalCommunityEnrollment(b) - totalCommunityEnrollment(a));
    return list;
  }, [programsQuery.data]);

  const openChat = (m: HubMember) => {
    setActiveMember(m);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const scrollChatEnd = () =>
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

  const sendMessage = () => {
    if (!draft.trim() || !activeMember || sendMessageMutation.isPending) return;
    const text = draft.trim();
    sendMessageMutation.mutate(
      { recipient_id: activeMember.id, body: text },
      {
        onSuccess: () => {
          setDraft('');
          scrollChatEnd();
        },
      },
    );
  };

  const handleEnroll = (programId: string) => {
    enrollMutation.mutate({ program_id: programId });
  };

  const displayMembers = useMemo(() => {
    const rows = contactsQuery.data?.map(chatContactToMember) ?? [];
    const statusRank = { online: 0, away: 1, offline: 2 } as const;
    return [...rows].sort((a, b) => statusRank[a.status] - statusRank[b.status]);
  }, [contactsQuery.data]);

  useEffect(() => {
    if (!activeMember || !messagesQuery.data) return;
    scrollChatEnd();
  }, [activeMember?.id, messagesQuery.data]);

  const headerSub = useMemo(() => {
    if (isHealthWorkerPortal) {
      return `${displayMembers.length} patient${displayMembers.length === 1 ? '' : 's'} linked to your sessions`;
    }
    if (tab === 'members') {
      return `${displayMembers.length} health worker${displayMembers.length === 1 ? '' : 's'} you can message`;
    }
    if (tab === 'recommended') {
      const n = programsQuery.data?.length ?? 0;
      const d = discoverGroups.length;
      return `${n} iCBT programme${n === 1 ? '' : 's'} · ${d} group${d === 1 ? '' : 's'} you can join`;
    }
    if (tab === 'problems') {
      return 'Publish mirrors to Community Feed; upvotes here drive Trending problems.';
    }
    const mg = myGroupsQuery.data?.length ?? 0;
    return `${mg} community group${mg === 1 ? '' : 's'} you belong to`;
  }, [
    isHealthWorkerPortal,
    tab,
    displayMembers.length,
    programsQuery.data?.length,
    myGroupsQuery.data?.length,
    discoverGroups.length,
  ]);

  const inputPlaceholder =
    activeMember == null
      ? ''
      : isHealthWorkerPortal
        ? 'Message your patient…'
        : activeMember.role === 'worker'
          ? 'Message your health worker…'
          : 'Type a message…';

  const submitCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newGroupName.trim();
    const value = newGroupValue.trim();
    if (!name || !value || createGroupMutation.isPending) return;
    createGroupMutation.mutate(
      {
        name,
        group_type: newGroupType,
        value,
        description: newGroupDesc.trim() || null,
      },
      {
        onSuccess: () => {
          setNewGroupName('');
          setNewGroupValue('');
          setNewGroupDesc('');
        },
      },
    );
  };

  const submitCreateProblem = (e: React.FormEvent) => {
    e.preventDefault();
    const title = problemTitle.trim();
    if (!title || createProblemMut.isPending) return;
    createProblemMut.mutate(
      {
        title,
        description: problemDesc.trim() || null,
        category: problemCategory,
        severity_level: problemSeverity,
        community_group_id: problemGroupId || null,
      },
      {
        onSuccess: () => {
          setProblemTitle('');
          setProblemDesc('');
          setProblemCategory('General');
          setProblemSeverity(3);
          setProblemGroupId('');
        },
      },
    );
  };

  return (
    <div className="ch-page">
      <div className="ch-header">
        <div>
          <h1 className="ch-header__title">
            {isHealthWorkerPortal ? 'Patient chat' : 'My Community'}
          </h1>
          <p className="ch-header__sub">
            <span className="ch-online-dot" />
            {headerSub}
          </p>
        </div>
        {!isHealthWorkerPortal && (
          <div className="ch-tab-bar">
            {(['members', 'recommended', 'problems', 'engagement'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`ch-tab ${tab === t ? 'ch-tab--active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'members'
                  ? 'Members & Chat'
                  : t === 'recommended'
                    ? 'Recommended'
                    : t === 'problems'
                      ? 'Problems'
                      : 'Engagement'}
              </button>
            ))}
          </div>
        )}
      </div>

      {showMemberChat && (
        <div className="ch-members-layout">
          <div className="ch-member-list">
            <p className="ch-member-list__label">
              {isHealthWorkerPortal ? 'Patients' : 'Your care team'}
            </p>
            {contactsQuery.isLoading && <p className="ch-member-list__label">Loading contacts…</p>}
            {contactsQuery.isError && (
              <p className="ch-member-list__label">Could not load contacts. Try refreshing the page.</p>
            )}
            {!contactsQuery.isLoading &&
              !contactsQuery.isError &&
              displayMembers.length === 0 && (
                <p className="ch-member-list__label">
                  No one to message yet. A contact appears after you have a scheduled session together.
                </p>
              )}
            {displayMembers.map((m) => (
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
                      <span className={`ch-cat-chip ${CATEGORY_COLORS[m.category]}`}>Patient</span>
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

          <div className="ch-chat">
            {!activeMember ? (
              <div className="ch-chat__empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p>
                  {isHealthWorkerPortal
                    ? 'Select a patient to start a conversation'
                    : 'Select a health worker to start a conversation'}
                </p>
                <span>Only people linked through a session appear in your list.</span>
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
                  {messagesQuery.isLoading && <p className="ch-chat__no-msgs">Loading messages…</p>}
                  {messagesQuery.isError && (
                    <p className="ch-chat__no-msgs">Could not load messages for this conversation.</p>
                  )}
                  {(messagesQuery.data ?? []).map((msg) => {
                    const isOwn = user != null && msg.sender_id === user.id;
                    const peerInitial = [...activeMember.username][0] ?? '?';
                    return (
                      <div key={msg.id} className={`ch-msg ${isOwn ? 'ch-msg--own' : 'ch-msg--other'}`}>
                        {!isOwn &&
                          (activeMember.photo ? (
                            <img src={activeMember.photo} alt={activeMember.username} className="ch-msg__photo" />
                          ) : (
                            <div className="ch-msg__avatar">{peerInitial}</div>
                          ))}
                        <div className="ch-msg__body">
                          <p
                            className="ch-msg__text"
                            {...(/[\u0900-\u097F]/.test(msg.body) ? { lang: 'ne' as const } : {})}
                          >
                            {msg.body}
                          </p>
                          <span className="ch-msg__time">{timeLabel(msg.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {!messagesQuery.isLoading &&
                    !messagesQuery.isError &&
                    (messagesQuery.data ?? []).length === 0 && (
                      <p className="ch-chat__no-msgs">No messages yet. Say hello!</p>
                    )}
                  <div ref={chatEndRef} />
                </div>

                <div className="ch-chat__input-bar">
                  <input
                    type="text"
                    className="ch-chat__input"
                    placeholder={inputPlaceholder}
                    value={draft}
                    disabled={sendMessageMutation.isPending}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="ch-chat__send"
                    disabled={!draft.trim() || sendMessageMutation.isPending}
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

      {tab === 'recommended' && (
        <div className="ch-recommended">
          <div className="ch-recommended__intro">
            <p className="ch-recommended__intro-text">
              Enrol in evidence-based iCBT modules and join community groups that reflect your identity or goals—all
              in one place.
            </p>
          </div>

          <section className="ch-hub-section" aria-labelledby="hub-icbt-heading">
            <div className="ch-hub-section__head">
              <h2 id="hub-icbt-heading" className="ch-hub-section__title">
                iCBT programmes
              </h2>
              <p className="ch-hub-section__sub">
                Structured programmes from the catalogue. Enrol to track progress on your dashboard.
              </p>
            </div>
            {programsQuery.isLoading && <p className="ch-member-list__label">Loading programmes…</p>}
            {programsQuery.isError && (
              <p className="ch-member-list__label">
                Could not load programmes. Check that you are signed in and try again.
              </p>
            )}
            <div className="ch-prog-grid">
              {(programsQuery.data ?? []).map((p) => {
              const isEnrolled = enrolledIds.has(p.id);
              const isEnrolling = enrollMutation.isPending && enrollMutation.variables?.program_id === p.id;
              const enrolled = totalCommunityEnrollment(p);
              const trending = enrolled >= 3;
              return (
                <div key={p.id} className={`ch-prog-card ${isEnrolled ? 'ch-prog-card--enrolled' : ''}`}>
                  <div className="ch-prog-card__cover-wrap">
                    <img src={icbtProgramCoverUrl(p.id)} alt={p.title} className="ch-prog-card__cover" loading="lazy" />
                    {trending && (
                      <span className="ch-prog-card__trending">Popular across communities</span>
                    )}
                  </div>
                  <div className="ch-prog-card__body">
                    <div className="ch-prog-card__meta">
                      <span className={`ch-cat-chip ${CATEGORY_COLORS.GENERAL}`}>iCBT</span>
                      <span className="ch-prog-card__difficulty">
                        {p.difficulty_level ?? 'Programme'}
                        {p.duration_days != null ? ` · ${p.duration_days} days` : ''}
                      </span>
                    </div>
                    <h3 className="ch-prog-card__title">{p.title}</h3>
                    <p className="ch-prog-card__desc">{p.description ?? ''}</p>

                    {enrolled > 0 && (
                      <div className="ch-prog-card__engagement">
                        <span className="ch-prog-card__engagement-label">
                          <strong>{enrolled}</strong> community {enrolled === 1 ? 'member' : 'members'} enrolled
                          {p.community_metadata.length > 0 ? ' (across linked groups)' : ''}
                        </span>
                      </div>
                    )}

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
          </section>

          <section className="ch-hub-section" aria-labelledby="hub-discover-heading">
            <div className="ch-hub-section__head">
              <h2 id="hub-discover-heading" className="ch-hub-section__title">
                Discover groups
              </h2>
              <p className="ch-hub-section__sub">
                Groups you are not in yet. Join to post in the feed and share invite links from the Engagement tab.
              </p>
            </div>
            {allGroupsQuery.isLoading && <p className="ch-member-list__label">Loading groups…</p>}
            {allGroupsQuery.isError && (
              <p className="ch-member-list__label">Could not load groups. Try refreshing the page.</p>
            )}
            <div className="ch-engagement-list">
              {discoverGroups.length === 0 && !allGroupsQuery.isLoading && !allGroupsQuery.isError && (
                <p className="ch-member-list__label">
                  You are in every available group, or none exist yet. Create a new one under Engagement.
                </p>
              )}
              {discoverGroups.map((g) => {
                const joining = joinGroupMutation.isPending && joinGroupMutation.variables === g.id;
                return (
                  <div key={g.id} className="ch-eng-card">
                    <div className="ch-eng-card__left">
                      <p className="ch-eng-card__title">{g.name}</p>
                      <p className="ch-eng-card__desc">
                        <strong>{groupTypeLabel(g.group_type)}</strong>
                        {' · '}
                        {g.value}
                        {g.description ? ` — ${g.description}` : ''}
                      </p>
                      <p className="ch-eng-card__count">
                        <strong>{g.member_count ?? 0}</strong> {g.member_count === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                    <div className="ch-eng-card__right">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={joining}
                        onClick={() => joinGroupMutation.mutate(g.id)}
                      >
                        {joining && <span className="btn-spinner" />}
                        {joining ? 'Joining…' : 'Join'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {tab === 'problems' && (
        <div className="ch-engagement">
          <div className="ch-engagement__intro">
            <p className="ch-engagement__intro-text">
              Anonymous problem cards live here. Each publish is mirrored to the <strong>Community Feed</strong> so
              people can discuss and react. Problem <strong>upvotes on this tab</strong> decide what appears in{' '}
              <strong>Trending problems</strong> below.
            </p>
          </div>

          <div className="ch-problems-hero">
            <div>
              <h2 className="ch-problems-hero__title">Anonymous community problems</h2>
              <p className="ch-problems-hero__text">
                Raise issues without your name on the problem list. Support others with upvotes—those totals rank
                Trending. The same story is posted to the feed for open conversation.
              </p>
            </div>
            <span className="ch-problem-badge">Problem spotlight</span>
          </div>

          {problemsGroupedQuery.isLoading && (
            <p className="ch-member-list__label">Loading community problems…</p>
          )}
          {problemsGroupedQuery.isError && (
            <p className="ch-member-list__label">Could not load problems. Try again in a moment.</p>
          )}

          {trendingProblemsGroup && trendingProblemsGroup.problems.length > 0 && (
            <section className="ch-hub-section" aria-labelledby="hub-trending-problems-heading">
              <div className="ch-hub-section__head">
                <h2 id="hub-trending-problems-heading" className="ch-hub-section__title">
                  Trending problems
                </h2>
                <p className="ch-hub-section__sub">
                  Highest support across the community right now. Swipe sideways on small screens.
                </p>
              </div>
              <div className="ch-problem-trending-strip">
                {trendingProblemsGroup.problems.map((p) => {
                  if (!isTrendingProblemItem(p)) return null;
                  const voting =
                    toggleProblemUpvoteMut.isPending && toggleProblemUpvoteMut.variables === p.id;
                  return (
                    <article key={p.id} className="ch-problem-card ch-problem-card--trending">
                      <div className="ch-problem-card__top">
                        <span className="ch-problem-chip ch-problem-chip--accent">Problem</span>
                        <span className="ch-problem-chip">{p.category_origin}</span>
                      </div>
                      <h3 className="ch-problem-card__title">{p.title}</h3>
                      {p.description ? (
                        <p className="ch-problem-card__desc">{p.description}</p>
                      ) : (
                        <p className="ch-problem-card__meta">No description</p>
                      )}
                      <button
                        type="button"
                        className={`ch-problem-upvote ${p.has_upvoted ? 'ch-problem-upvote--active' : ''}`}
                        disabled={voting}
                        onClick={() => toggleProblemUpvoteMut.mutate(p.id)}
                      >
                        {voting && <span className="btn-spinner" />}
                        {p.has_upvoted ? 'Supported' : 'Upvote'} · {p.upvote_count}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className="ch-hub-section" aria-labelledby="hub-report-problem-heading">
            <div className="ch-hub-section__head">
              <h2 id="hub-report-problem-heading" className="ch-hub-section__title">
                Share a problem
              </h2>
              <p className="ch-hub-section__sub">
                Your submission stays anonymous on problem cards. We also post a copy to the Community Feed for
                review and discussion. Optionally link to a group you belong to.
              </p>
            </div>
            <div className="ch-problem-form-grid">
              <form className="ch-problem-form-card" onSubmit={submitCreateProblem}>
                <div className="ch-field">
                  <label className="ch-field__label" htmlFor="cp-title">
                    Title
                  </label>
                  <input
                    id="cp-title"
                    className="ch-field__input"
                    value={problemTitle}
                    onChange={(e) => setProblemTitle(e.target.value)}
                    placeholder="Short headline others will see"
                    maxLength={255}
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="ch-field">
                  <label className="ch-field__label" htmlFor="cp-desc">
                    Description (optional)
                  </label>
                  <textarea
                    id="cp-desc"
                    className="ch-field__textarea"
                    value={problemDesc}
                    onChange={(e) => setProblemDesc(e.target.value)}
                    placeholder="More context—still anonymous when published"
                  />
                </div>
                <div className="ch-field">
                  <label className="ch-field__label" htmlFor="cp-cat">
                    Category
                  </label>
                  <select
                    id="cp-cat"
                    className="ch-field__select"
                    value={problemCategory}
                    onChange={(e) => setProblemCategory(e.target.value)}
                  >
                    {PROBLEM_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ch-field">
                  <label className="ch-field__label" htmlFor="cp-sev">
                    How urgent or severe does this feel? (1–5)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <input
                      id="cp-sev"
                      type="range"
                      min={1}
                      max={5}
                      value={problemSeverity}
                      onChange={(e) => setProblemSeverity(Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <SeverityDots level={problemSeverity} />
                  </div>
                </div>
                <div className="ch-field">
                  <label className="ch-field__label" htmlFor="cp-group">
                    Link to my group (optional)
                  </label>
                  <select
                    id="cp-group"
                    className="ch-field__select"
                    value={problemGroupId}
                    onChange={(e) => setProblemGroupId(e.target.value)}
                  >
                    <option value="">Not linked to a group</option>
                    {(myGroupsQuery.data ?? []).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                {createProblemMut.isError && (
                  <div className="alert alert--error" role="alert">
                    Could not submit. Check your title and try again.
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={createProblemMut.isPending}>
                  {createProblemMut.isPending && <span className="btn-spinner" />}
                  {createProblemMut.isPending ? 'Publishing…' : 'Publish problem'}
                </button>
              </form>
              <aside className="ch-problem-form-aside" aria-label="Privacy notes">
                <p className="ch-problem-form-aside__title">Why this is safe</p>
                <ul className="ch-problem-form-aside__list">
                  <li>Your name does not appear on the problem card—only the title, category, and votes.</li>
                  <li>A matching feed post uses your anonymous handle so others can comment and react there.</li>
                  <li>Upvotes are private to you; others only see the total count on problem cards.</li>
                  <li>Linking a group helps organisers see themes—it does not expose your profile.</li>
                </ul>
              </aside>
            </div>
          </section>

          {problemCategoryGroups.length > 0 && (
            <section className="ch-hub-section" aria-labelledby="hub-problems-by-cat-heading">
              <div className="ch-hub-section__head">
                <h2 id="hub-problems-by-cat-heading" className="ch-hub-section__title">
                  Browse by category
                </h2>
                <p className="ch-hub-section__sub">
                  Categories are ordered by total upvotes. Support issues that resonate with you.
                </p>
              </div>
              <div className="ch-problem-cat-grid">
                {problemCategoryGroups.map((grp) => (
                  <div key={grp.category}>
                    <p className="ch-activity-feed__title" style={{ marginBottom: 'var(--space-2)' }}>
                      {grp.category}
                      <span className="ch-problem-chip" style={{ marginLeft: 'var(--space-2)' }}>
                        {grp.total_upvotes} upvotes · {grp.problems.length} problems
                      </span>
                    </p>
                    <div className="ch-engagement-list">
                      {grp.problems.map((p) => {
                        if (!('created_at' in p)) return null;
                        const voting =
                          toggleProblemUpvoteMut.isPending && toggleProblemUpvoteMut.variables === p.id;
                        const sev = p.severity_level ?? 1;
                        return (
                          <article key={p.id} className="ch-problem-card">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="ch-problem-card__top">
                                <span className="ch-problem-chip ch-problem-chip--accent">Problem</span>
                                <span className="ch-problem-chip">{p.category}</span>
                                <SeverityDots level={sev} />
                              </div>
                              <h3 className="ch-problem-card__title">{p.title}</h3>
                              {p.description ? (
                                <p className="ch-problem-card__desc">{p.description}</p>
                              ) : null}
                              <p className="ch-problem-card__meta">{timeLabel(p.created_at)}</p>
                            </div>
                            <button
                              type="button"
                              className={`ch-problem-upvote ${p.has_upvoted ? 'ch-problem-upvote--active' : ''}`}
                              disabled={voting}
                              onClick={() => toggleProblemUpvoteMut.mutate(p.id)}
                            >
                              {voting && <span className="btn-spinner" />}
                              {p.has_upvoted ? 'Supported' : 'Upvote'}
                              <span aria-hidden> · </span>
                              {p.upvote_count}
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {tab === 'engagement' && (
        <div className="ch-engagement">
          <div className="ch-engagement__intro">
            <p className="ch-engagement__intro-text">
              Manage groups and invites, programme engagement, and a snapshot of the feed. To share or upvote anonymous
              problems (and see Trending), open the <strong>Problems</strong> tab. Discover groups under{' '}
              <strong>Recommended</strong>.
            </p>
          </div>

          <p className="ch-activity-feed__title" style={{ marginBottom: 'var(--space-2)' }}>
            My community groups
          </p>
          {myGroupsQuery.isLoading && <p className="ch-member-list__label">Loading your groups…</p>}
          {myGroupsQuery.isError && (
            <p className="ch-member-list__label">Could not load your groups. Try signing in again.</p>
          )}
          <div className="ch-engagement-list" style={{ marginBottom: 'var(--space-5)' }}>
            {(myGroupsQuery.data ?? []).length === 0 && !myGroupsQuery.isLoading && (
              <p className="ch-member-list__label">
                You have not joined any groups yet. Create one below or discover groups under Recommended.
              </p>
            )}
            {(myGroupsQuery.data ?? []).map((g) => (
              <div key={g.id} className="ch-eng-card">
                <div className="ch-eng-card__left">
                  <div className="ch-eng-card__title-row">
                    <p className="ch-eng-card__title">{g.name}</p>
                    {g.is_creator && <span className="ch-eng-card__trending-badge">Created by you</span>}
                  </div>
                  <p className="ch-eng-card__desc">
                    <strong>{groupTypeLabel(g.group_type)}</strong>
                    {' · '}
                    {g.value}
                    {g.description ? ` — ${g.description}` : ''}
                  </p>
                  <p className="ch-eng-card__count">
                    <strong>{g.member_count ?? 0}</strong> {g.member_count === 1 ? 'member' : 'members'}
                  </p>
                </div>
                <div className="ch-eng-card__right" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'stretch' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={createInviteMutation.isPending}
                    onClick={() => {
                      createInviteMutation.mutate(
                        { groupId: g.id },
                        {
                          onSuccess: async (res) => {
                            const url = `${window.location.origin}${res.invite_path}`;
                            try {
                              await navigator.clipboard.writeText(url);
                              setInviteCopiedGroupId(g.id);
                              window.setTimeout(() => setInviteCopiedGroupId(null), 2500);
                            } catch {
                              window.alert(`Copy this link:\n${url}`);
                            }
                          },
                        },
                      );
                    }}
                  >
                    {inviteCopiedGroupId === g.id ? 'Invite link copied' : 'Copy invite link'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={leaveGroupMutation.isPending}
                    onClick={() => leaveGroupMutation.mutate(g.id)}
                  >
                    Leave
                  </button>
                </div>
              </div>
            ))}
          </div>

          <section className="ch-hub-section" aria-labelledby="hub-create-group-heading">
            <div className="ch-hub-section__head">
              <h2 id="hub-create-group-heading" className="ch-hub-section__title">
                Create a community group
              </h2>
              <p className="ch-hub-section__sub">
                Start a space for your community. You will be added as the first member; others can join from
                Recommended or via your invite link.
              </p>
            </div>
            <div className="ch-create-group">
              <form className="ch-create-group__card" onSubmit={submitCreateGroup}>
                <div>
                  <h3 className="ch-create-group__card-title">Group details</h3>
                  <p className="ch-create-group__card-lead">
                    Choose a clear name and a unique slug. The combination of type and slug must not match an existing
                    group.
                  </p>
                </div>
                <div className="ch-field">
                  <label className="ch-field__label" htmlFor="cg-name">
                    Name
                  </label>
                  <input
                    id="cg-name"
                    className="ch-field__input"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Evening anxiety circle"
                    minLength={2}
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="ch-field">
                  <label className="ch-field__label" htmlFor="cg-type">
                    Group type
                  </label>
                  <select
                    id="cg-type"
                    className="ch-field__select"
                    value={newGroupType}
                    onChange={(e) => setNewGroupType(e.target.value)}
                  >
                    {GROUP_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ch-field">
                  <label className="ch-field__label" htmlFor="cg-value">
                    Unique value (slug)
                  </label>
                  <input
                    id="cg-value"
                    className="ch-field__input"
                    value={newGroupValue}
                    onChange={(e) => setNewGroupValue(e.target.value)}
                    placeholder="e.g. evening_anxiety_sg"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="ch-field">
                  <label className="ch-field__label" htmlFor="cg-desc">
                    Description (optional)
                  </label>
                  <textarea
                    id="cg-desc"
                    className="ch-field__textarea"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="Who is this group for? What can people expect?"
                  />
                </div>
                {createGroupMutation.isError && (
                  <div className="alert alert--error" role="alert">
                    Could not create this group. The type and slug together may already be in use.
                  </div>
                )}
                <div className="ch-create-group__submit-row">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createGroupMutation.isPending}
                  >
                    {createGroupMutation.isPending && <span className="btn-spinner" />}
                    {createGroupMutation.isPending ? 'Creating…' : 'Create group'}
                  </button>
                </div>
              </form>
              <aside className="ch-create-group__tips" aria-label="Tips for creating a group">
                <p className="ch-create-group__tips-title">Before you publish</p>
                <ul className="ch-create-group__tips-list">
                  <li>
                    Use a <strong>slug</strong> with lowercase letters, numbers, and underscores only so links stay
                    readable.
                  </li>
                  <li>
                    Pick the <strong>type</strong> that best describes who the group is for (identity, faith, custom
                    topic, etc.).
                  </li>
                  <li>
                    After creating, use <strong>Copy invite link</strong> on your group card so friends can join in
                    one tap.
                  </li>
                  <li>Everyone can discover open groups under the <strong>Recommended</strong> tab.</li>
                </ul>
              </aside>
            </div>
          </section>

          <p className="ch-activity-feed__title" style={{ margin: 'var(--space-5) 0 var(--space-2)' }}>
            Programme engagement
          </p>
          <div className="ch-engagement-list">
            {programsByEngagement.filter((p) => totalCommunityEnrollment(p) > 0).map((p) => {
              const n = totalCommunityEnrollment(p);
              const isEnrolled = enrolledIds.has(p.id);
              const isEnrolling = enrollMutation.isPending && enrollMutation.variables?.program_id === p.id;
              const trending = n >= 3;
              return (
                <div key={p.id} className="ch-eng-card">
                  <div className="ch-eng-card__left">
                    <div className="ch-eng-card__title-row">
                      <p className="ch-eng-card__title">{p.title}</p>
                      {trending && <span className="ch-eng-card__trending-badge">Trending</span>}
                    </div>
                    <p className="ch-eng-card__count">
                      <strong>{n} people</strong> from linked communities are enrolled in this programme
                    </p>
                    <p className="ch-eng-card__desc">{p.description ?? ''}</p>
                  </div>
                  <div className="ch-eng-card__right">
                    <div className="ch-eng-card__stat">
                      <span className="ch-eng-card__stat-value">{n}</span>
                      <span className="ch-eng-card__stat-label">enrolled</span>
                    </div>
                    {isEnrolled ? (
                      <button type="button" className="btn btn-secondary btn-sm" disabled>
                        Enrolled
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={isEnrolling}
                        onClick={() => handleEnroll(p.id)}
                      >
                        {isEnrolling ? 'Enrolling…' : 'Join them'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ch-activity-feed">
            <p className="ch-activity-feed__title">Recent community activity</p>
            {postsQuery.isLoading && <p className="ch-member-list__label">Loading posts…</p>}
            {postsQuery.isError && (
              <p className="ch-member-list__label">Could not load the community feed.</p>
            )}
            <div className="ch-activity-feed__list">
              {(postsQuery.data ?? []).map((post) => {
                const initial = [...post.username][0]?.toUpperCase() ?? '?';
                return (
                  <div key={post.id} className="ch-feed-row">
                    <div className="ch-feed-row__avatar">{initial}</div>
                    <div className="ch-feed-row__body">
                      <p className="ch-feed-row__text">
                        <span className="ch-feed-row__username">{post.username}</span>
                        {' '}
                        posted in <strong>{post.category}</strong>
                        {post.community_group ? ` · ${post.community_group.name}` : ''}
                      </p>
                      <span className="ch-feed-row__time">{timeLabel(post.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityHubPage;
