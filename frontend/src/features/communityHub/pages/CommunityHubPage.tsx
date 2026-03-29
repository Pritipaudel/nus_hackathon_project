import { useEffect, useMemo, useRef, useState } from 'react';

import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

import { communityApi } from '@features/community/api/communityApi';
import type { ChatContactDto } from '@features/chat/api/directChatApi';
import { useChatContacts, useChatMessages, useSendChatMessage } from '@features/chat/hooks/useDirectChat';
import {
  useCommunityGroups,
  useCreateCommunityGroup,
  useCreateGroupInvite,
  useDeletePost,
  useJoinCommunityGroup,
  useLeaveCommunityGroup,
  useMyCommunityGroups,
} from '@features/community/hooks/useCommunity';
import { useEnrollIcbt, useIcbtPrograms, useMyIcbtPrograms } from '@features/icbt/hooks/useIcbt';
import { formatRecommendedForCommunities } from '@features/icbt/utils/recommendedLabel';
import { useAuthStore } from '@shared/stores/authStore';
import type { IcbtProgram } from '@shared/types';

type Tab = 'members' | 'recommended' | 'groups' | 'engagement';

export type CommunityHubVariant = 'patient' | 'health_worker';

export type CommunityHubPageProps = {
  /** `patient` — hub with Members, Recommended (iCBT), Groups (discover/join), Engagement. Anonymous problems live on the Community Feed. */
  variant?: CommunityHubVariant;
  /** Opens Health Workers so the patient can book a session (chat list fills after a meeting exists). */
  onNavigateToBookSession?: () => void;
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

const CommunityHubPage = ({
  variant = 'patient',
  onNavigateToBookSession,
}: CommunityHubPageProps) => {
  const [tab, setTab] = useState<Tab>('members');
  const [activeMember, setActiveMember] = useState<HubMember | null>(null);
  const [draft, setDraft] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<string>('CUSTOM');
  const [newGroupValue, setNewGroupValue] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [inviteCopiedGroupId, setInviteCopiedGroupId] = useState<string | null>(null);
  const [groupDiscoverSearch, setGroupDiscoverSearch] = useState('');
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

  const chatMessagesDenied =
    messagesQuery.isError &&
    axios.isAxiosError(messagesQuery.error) &&
    (messagesQuery.error.response?.status === 403 || messagesQuery.error.response?.status === 404);

  const programsQuery = useIcbtPrograms();
  const myProgramsQuery = useMyIcbtPrograms();
  const enrollMutation = useEnrollIcbt();

  const allGroupsQuery = useCommunityGroups(
    Boolean(user) && !isHealthWorkerPortal && tab === 'groups',
  );
  const myGroupsQuery = useMyCommunityGroups();
  const createGroupMutation = useCreateCommunityGroup();
  const joinGroupMutation = useJoinCommunityGroup();
  const leaveGroupMutation = useLeaveCommunityGroup();
  const createInviteMutation = useCreateGroupInvite();

  const postsQuery = useQuery({
    queryKey: ['community', 'posts', 'hub-feed'],
    queryFn: () => communityApi.getPosts({ limit: 20 }),
    enabled: Boolean(user) && !isHealthWorkerPortal && tab === 'engagement',
  });
  const deletePostMutation = useDeletePost();

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

  const discoverGroupsDisplay = useMemo(() => {
    const sorted = [...discoverGroups].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
    const q = groupDiscoverSearch.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.value.toLowerCase().includes(q) ||
        (g.description ?? '').toLowerCase().includes(q) ||
        groupTypeLabel(g.group_type).toLowerCase().includes(q),
    );
  }, [discoverGroups, groupDiscoverSearch]);

  const programsByEngagement = useMemo(() => {
    const list = [...(programsQuery.data ?? [])];
    list.sort((a, b) => totalCommunityEnrollment(b) - totalCommunityEnrollment(a));
    return list;
  }, [programsQuery.data]);

  const openChat = (m: HubMember) => {
    setActiveMember(m);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleDeleteHubFeedPost = (postId: string) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    deletePostMutation.mutate(postId);
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

  const noPatientChatContacts =
    !isHealthWorkerPortal &&
    !contactsQuery.isLoading &&
    !contactsQuery.isError &&
    displayMembers.length === 0;

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
      return `${n} iCBT programme${n === 1 ? '' : 's'} in the catalogue`;
    }
    if (tab === 'groups') {
      const d = discoverGroups.length;
      return `${d} group${d === 1 ? '' : 's'} you can join`;
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

  return (
    <div className="ch-page">
      <div className="ch-header">
        <div>
          <h1 className="ch-header__title">
            {isHealthWorkerPortal ? 'Chat' : 'My Community'}
          </h1>
          <p className="ch-header__sub">
            <span className="ch-online-dot" />
            {headerSub}
          </p>
        </div>
        {!isHealthWorkerPortal && (
          <div className="ch-tab-bar">
            {(['members', 'recommended', 'groups', 'engagement'] as Tab[]).map((t) => (
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
                    : t === 'groups'
                      ? 'Groups'
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
                <div className="ch-member-list__empty">
                  <p className="ch-member-list__hint">
                    No one to message yet. A contact appears after you have a scheduled session together.
                  </p>
                  {!isHealthWorkerPortal && onNavigateToBookSession && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm ch-member-list__book-btn"
                      onClick={onNavigateToBookSession}
                    >
                      Book a health worker session
                    </button>
                  )}
                </div>
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
                {noPatientChatContacts ? (
                  <>
                    <p className="ch-chat__empty-lead">You do not have anyone to message yet</p>
                    <span>
                      Schedule a session with a health worker from the directory. After it is on your calendar, they
                      show up here so you can chat about your care and iCBT progress.
                    </span>
                    {onNavigateToBookSession && (
                      <button
                        type="button"
                        className="btn btn-primary btn-md ch-chat__empty-btn"
                        onClick={onNavigateToBookSession}
                      >
                        Find a health worker & book a session
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p>
                      {isHealthWorkerPortal
                        ? 'Select a patient to start a conversation'
                        : 'Select a health worker to start a conversation'}
                    </p>
                    <span>Only people linked through a session appear in your list.</span>
                  </>
                )}
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
                    <p className="ch-chat__no-msgs">
                      {chatMessagesDenied
                        ? 'This chat is not available yet. Refresh the page after booking, or try again in a moment.'
                        : 'Could not load messages for this conversation.'}
                    </p>
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
              Enrol in evidence-based iCBT modules. Browse and join community groups from the <strong>Groups</strong>{' '}
              tab.
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
              const recommendedLabel = formatRecommendedForCommunities(p.community_metadata);
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
                    {recommendedLabel && (
                      <span className="ds-badge ds-badge--recommended ch-prog-card__recommended" title={recommendedLabel}>
                        {recommendedLabel}
                      </span>
                    )}
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
        </div>
      )}

      {tab === 'groups' && (
        <div className="ch-recommended">
          <div className="ch-recommended__intro">
            <p className="ch-recommended__intro-text">
              Groups you are not in yet. Join to post in the Community Feed for that group and copy invite links from
              the <strong>Engagement</strong> tab once you are a member.
            </p>
          </div>

          <section className="ch-hub-section" aria-labelledby="hub-discover-heading">
            <div className="ch-hub-section__head">
              <h2 id="hub-discover-heading" className="ch-hub-section__title">
                Discover groups
              </h2>
              <p className="ch-hub-section__sub">
                Open groups you can join with one tap. Your memberships and invites are under Engagement.
              </p>
            </div>
            {!allGroupsQuery.isLoading && !allGroupsQuery.isError && discoverGroups.length > 0 && (
              <div className="ch-groups-search-wrap">
                <div className="icbt-search ch-groups-search">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="search"
                    className="icbt-search__input"
                    placeholder="Search by name, place, religion, or type…"
                    value={groupDiscoverSearch}
                    onChange={(e) => setGroupDiscoverSearch(e.target.value)}
                    aria-label="Search groups to join"
                  />
                </div>
              </div>
            )}
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
              {discoverGroups.length > 0 &&
                discoverGroupsDisplay.length === 0 &&
                !allGroupsQuery.isLoading &&
                !allGroupsQuery.isError && (
                  <p className="ch-member-list__label">No groups match your search. Try another keyword.</p>
                )}
              {discoverGroupsDisplay.map((g) => {
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

      {tab === 'engagement' && (
        <div className="ch-engagement">
          <div className="ch-engagement__intro">
            <p className="ch-engagement__intro-text">
              Manage groups and invites, programme engagement, and a snapshot of the feed. Anonymous problems and
              trending support are on the <strong>Community Feed</strong>. Discover new groups under the{' '}
              <strong>Groups</strong> tab.
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
                You have not joined any groups yet. Create one below or discover groups under the Groups tab.
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
                Start a space for your community. You will be added as the first member; others can join from the
                Groups tab or via your invite link.
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
                  <li>Everyone can discover open groups under the <strong>Groups</strong> tab.</li>
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
                const isOwnPost = Boolean(user?.id && post.user_id === user.id);
                const isDeleting =
                  deletePostMutation.isPending && deletePostMutation.variables === post.id;
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
                    {isOwnPost && (
                      <div className="ch-feed-row__actions">
                        <button
                          type="button"
                          className="ch-feed-row__delete"
                          disabled={isDeleting}
                          onClick={() => handleDeleteHubFeedPost(post.id)}
                          aria-label="Delete post"
                        >
                          {isDeleting ? <span className="btn-spinner" aria-hidden /> : 'Delete'}
                        </button>
                      </div>
                    )}
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
