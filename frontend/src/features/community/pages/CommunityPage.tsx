import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import { isTrendingProblemItem } from '../api/communityApi';
import type { GetPostsParams } from '../api/communityApi';
import {
  useCommunityPosts,
  useCreatePost,
  useReactToPost,
  useFlagPost,
  useDeletePost,
  useCommunityProblemsGrouped,
  useCreateCommunityProblem,
  useToggleProblemUpvote,
  useMyCommunityGroups,
} from '../hooks/useCommunity';
import { useAuthStore } from '@shared/stores/authStore';
import { parseCommunityProblemMirror } from '../utils/problemFeedPost';

const TRENDING_PAGE_SIZE = 5;
const FEED_PAGE_SIZE = 5;

const CATEGORIES = ['ALL', 'GENERAL', 'ANXIETY', 'DEPRESSION', 'TRAUMA', 'STRESS'];

const CATEGORY_COLOR: Record<string, string> = {
  GENERAL: 'cp-cat--gray',
  ANXIETY: 'cp-cat--blue',
  DEPRESSION: 'cp-cat--purple',
  TRAUMA: 'cp-cat--red',
  STRESS: 'cp-cat--orange',
};

const timeAgo = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

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

interface LocalComment {
  id: string;
  author: string;
  initials: string;
  isVerified: boolean;
  text: string;
  time: string;
  likes: number;
  isOwn?: boolean;
}

const CommunityPage = () => {
  const user = useAuthStore((s) => s.user);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showCompose, setShowCompose] = useState(false);
  const [showProblemCompose, setShowProblemCompose] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [problemCategory, setProblemCategory] = useState<string>('General');
  const [problemSeverity, setProblemSeverity] = useState(3);
  const [problemGroupId, setProblemGroupId] = useState('');
  const [trendingPageIndex, setTrendingPageIndex] = useState(0);
  const [feedPage, setFeedPage] = useState(1);

  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [localComments, setLocalComments] = useState<Record<string, LocalComment[]>>({});
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({});
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [localReactions, setLocalReactions] = useState<Record<string, 'UPVOTE' | null>>({});

  const postsQueryParams = useMemo((): GetPostsParams => {
    const p: GetPostsParams = { limit: FEED_PAGE_SIZE, page: feedPage };
    if (activeCategory !== 'ALL') p.category = activeCategory;
    return p;
  }, [activeCategory, feedPage]);
  const { data: rawPosts = [], isLoading } = useCommunityPosts(postsQueryParams);
  const posts = useMemo(
    () =>
      [...rawPosts].sort((a, b) => Number(!!b.is_verified) - Number(!!a.is_verified)),
    [rawPosts],
  );
  const feedHasNextPage = rawPosts.length === FEED_PAGE_SIZE;

  useEffect(() => {
    setFeedPage(1);
  }, [activeCategory]);

  useEffect(() => {
    if (!isLoading && rawPosts.length === 0 && feedPage > 1) {
      setFeedPage(1);
    }
  }, [isLoading, rawPosts.length, feedPage]);
  const createPost = useCreatePost();
  const reactMutation = useReactToPost();
  const flagMutation = useFlagPost();
  const deletePostMutation = useDeletePost();
  const problemsGroupedQuery = useCommunityProblemsGrouped(Boolean(user));
  const myGroupsQuery = useMyCommunityGroups();
  const createProblemMut = useCreateCommunityProblem();
  const toggleProblemUpvoteMut = useToggleProblemUpvote();

  const problemSupportById = useMemo(() => {
    const m = new Map<string, { upvote_count: number; has_upvoted: boolean }>();
    for (const g of problemsGroupedQuery.data ?? []) {
      for (const p of g.problems) {
        if ('id' in p && 'upvote_count' in p && 'has_upvoted' in p) {
          m.set(p.id, { upvote_count: p.upvote_count, has_upvoted: p.has_upvoted });
        }
      }
    }
    return m;
  }, [problemsGroupedQuery.data]);

  const trendingProblems = useMemo(() => {
    const rows = problemsGroupedQuery.data ?? [];
    const t = rows.find((g) => g.category === 'Trending');
    if (!t) return [];
    return t.problems.filter(isTrendingProblemItem);
  }, [problemsGroupedQuery.data]);

  const trendingTotalPages =
    trendingProblems.length === 0 ? 0 : Math.ceil(trendingProblems.length / TRENDING_PAGE_SIZE);

  useEffect(() => {
    if (trendingTotalPages <= 0) {
      setTrendingPageIndex(0);
      return;
    }
    setTrendingPageIndex((i) => Math.min(i, trendingTotalPages - 1));
  }, [trendingTotalPages]);

  const trendingPageItems = useMemo(() => {
    if (trendingProblems.length === 0) return [];
    const start = trendingPageIndex * TRENDING_PAGE_SIZE;
    return trendingProblems.slice(start, start + TRENDING_PAGE_SIZE);
  }, [trendingProblems, trendingPageIndex]);

  const handleVote = (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    const alreadyUp =
      localReactions[postId] === 'UPVOTE' || target?.my_reaction === 'UPVOTE';
    if (alreadyUp) return;
    setLocalReactions((prev) => ({ ...prev, [postId]: 'UPVOTE' }));
    reactMutation.mutate({ postId, body: { reaction_type: 'UPVOTE' } });
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  const handleLikeComment = (commentId: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
        setCommentLikes((l) => ({ ...l, [commentId]: (l[commentId] ?? 1) - 1 }));
      } else {
        next.add(commentId);
        setCommentLikes((l) => ({ ...l, [commentId]: (l[commentId] ?? 0) + 1 }));
      }
      return next;
    });
  };

  const handleAddComment = (postId: string) => {
    const text = replyText[postId]?.trim();
    if (!text) return;
    const newComment: LocalComment = {
      id: `c${Date.now()}`,
      author: 'You',
      initials: 'Y',
      isVerified: false,
      text,
      time: 'Just now',
      likes: 0,
      isOwn: true,
    };
    setLocalComments((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), newComment] }));
    setCommentLikes((l) => ({ ...l, [newComment.id]: 0 }));
    setReplyText((r) => ({ ...r, [postId]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    const formData = new FormData();
    formData.append('content', content.trim());
    formData.append('category', category);
    if (file) formData.append('files', file);
    createPost.mutate(formData, {
      onSuccess: () => {
        setContent('');
        setCategory('GENERAL');
        setFile(null);
        setPreview(null);
        setShowCompose(false);
      },
    });
  };

  const handleFlag = (postId: string) => {
    if (flagged.has(postId)) return;
    flagMutation.mutate(
      { postId, body: { reason: 'Reported by user' } },
      { onSuccess: () => setFlagged((p) => new Set([...p, postId])) },
    );
  };

  const handleDeletePost = (postId: string) => {
    if (
      !window.confirm(
        'Delete this post? This cannot be undone.',
      )
    ) {
      return;
    }
    deletePostMutation.mutate(postId);
  };

  const submitProblem = (e: FormEvent) => {
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
          setShowProblemCompose(false);
        },
      },
    );
  };

  return (
    <div className="cp-layout">
      <div className="cp-main">
        <div className="cp-compose-bar" onClick={() => setShowCompose(true)}>
          <div className="cp-compose-bar__avatar">Y</div>
          <div className="cp-compose-bar__input">What is on your mind?</div>
          <div className="cp-compose-bar__actions">
            <button type="button" className="cp-compose-bar__btn" onClick={(e) => { e.stopPropagation(); setShowCompose(true); }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
              Image
            </button>
            <button type="button" className="cp-compose-bar__btn" onClick={(e) => { e.stopPropagation(); setShowCompose(true); }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Post
            </button>
            <button
              type="button"
              className="cp-compose-bar__btn cp-compose-bar__btn--problem"
              onClick={(e) => {
                e.stopPropagation();
                setShowProblemCompose(true);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 10h.01" />
                <path d="M12 10h.01" />
                <path d="M16 10h.01" />
              </svg>
              Problem
            </button>
          </div>
        </div>

        {showCompose && (
          <div className="cp-compose">
            <div className="cp-compose__topbar">
              <select
                className="cp-compose__cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                  <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                ))}
              </select>
              <button type="button" className="cp-compose__close" onClick={() => setShowCompose(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="cp-compose__anon">You are posting anonymously — your identity is never shared.</p>
            <textarea
              className="cp-compose__textarea"
              placeholder="Share your experience, ask a question, or offer support..."
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              autoFocus
            />
            {preview && (
              <div className="cp-compose__preview">
                <img src={preview} alt="preview" className="cp-compose__preview-img" />
                <button type="button" className="cp-compose__preview-remove" onClick={() => { setFile(null); setPreview(null); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
            <div className="cp-compose__footer">
              <div className="cp-compose__left">
                <button type="button" className="cp-compose__icon-btn" onClick={() => fileRef.current?.click()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  {file ? file.name : 'Add image'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                <span className="cp-compose__char">{content.length}/1000</span>
              </div>
              <div className="cp-compose__right">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCompose(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSubmit}
                  disabled={!content.trim() || createPost.isPending}
                >
                  {createPost.isPending && <span className="btn-spinner" />}
                  {createPost.isPending ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showProblemCompose && (
          <div className="cp-compose cp-compose--problem">
            <div className="cp-compose__topbar">
              <span className="cp-compose__problem-label">Raise an anonymous problem</span>
              <button type="button" className="cp-compose__close" onClick={() => setShowProblemCompose(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="cp-compose__anon">
              Shown in this feed with a <strong>Community problem</strong> highlight. Others can support it and discuss here.
            </p>
            <form className="cp-problem-form" onSubmit={submitProblem}>
              <div className="ch-field">
                <label className="ch-field__label" htmlFor="cpf-title">
                  Title
                </label>
                <input
                  id="cpf-title"
                  className="ch-field__input"
                  value={problemTitle}
                  onChange={(e) => setProblemTitle(e.target.value)}
                  placeholder="Short headline"
                  maxLength={255}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="ch-field">
                <label className="ch-field__label" htmlFor="cpf-desc">
                  Details (optional)
                </label>
                <textarea
                  id="cpf-desc"
                  className="ch-field__textarea"
                  value={problemDesc}
                  onChange={(e) => setProblemDesc(e.target.value)}
                  rows={3}
                  placeholder="More context — still anonymous on the problem list"
                />
              </div>
              <div className="ch-field">
                <label className="ch-field__label" htmlFor="cpf-cat">
                  Category
                </label>
                <select
                  id="cpf-cat"
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
                <span className="ch-field__label">How severe does this feel? (1–5)</span>
                <div className="cp-problem-form__range">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={problemSeverity}
                    onChange={(e) => setProblemSeverity(Number(e.target.value))}
                  />
                  <SeverityDots level={problemSeverity} />
                </div>
              </div>
              <div className="ch-field">
                <label className="ch-field__label" htmlFor="cpf-group">
                  Link to my group (optional)
                </label>
                <select
                  id="cpf-group"
                  className="ch-field__select"
                  value={problemGroupId}
                  onChange={(e) => setProblemGroupId(e.target.value)}
                >
                  <option value="">Not linked</option>
                  {(myGroupsQuery.data ?? []).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              {createProblemMut.isError && (
                <p className="cp-problem-form__error" role="alert">
                  Could not publish. Check the title and try again.
                </p>
              )}
              <div className="cp-compose__footer" style={{ marginTop: 'var(--space-3)' }}>
                <div className="cp-compose__right" style={{ marginLeft: 'auto' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowProblemCompose(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={createProblemMut.isPending}>
                    {createProblemMut.isPending && <span className="btn-spinner" />}
                    {createProblemMut.isPending ? 'Publishing…' : 'Publish problem'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="cp-filter-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`cp-filter-pill ${activeCategory === cat ? 'cp-filter-pill--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="cp-empty">
            <span className="btn-spinner" />
            <p>Loading posts...</p>
          </div>
        ) : (
          <>
            <div className="cp-feed">
            {posts.length === 0 && (
              <div className="cp-empty">No posts in this category yet. Be the first to share.</div>
            )}
            {posts.map((post) => {
              const parsed = parseCommunityProblemMirror(post.content);
              const postComments = localComments[post.id] ?? [];
              const isExpanded = expandedComments.has(post.id);
              const isUpvoted =
                localReactions[post.id] === 'UPVOTE' || post.my_reaction === 'UPVOTE';
              const displayCount = post.reaction_count;
              const isOwnPost = Boolean(user?.id && post.user_id === user.id);
              const isDeletingThis = deletePostMutation.isPending && deletePostMutation.variables === post.id;
              const probId = parsed?.problemId ?? null;
              const probMeta = probId ? problemSupportById.get(probId) : undefined;
              const problemVoting =
                probId != null &&
                toggleProblemUpvoteMut.isPending &&
                toggleProblemUpvoteMut.variables === probId;
              const useProblemSupport = Boolean(parsed && probId);

              return (
                <div key={post.id} className={`cp-post ${parsed ? 'cp-post--problem' : ''}`}>
                  <div className="cp-post__vote-col">
                    {useProblemSupport ? (
                      <button
                        type="button"
                        className={`cp-feed-problem-vote ${probMeta?.has_upvoted ? 'cp-feed-problem-vote--on' : ''}`}
                        disabled={problemVoting}
                        onClick={() => probId && toggleProblemUpvoteMut.mutate(probId)}
                        aria-pressed={Boolean(probMeta?.has_upvoted)}
                        aria-label={
                          probMeta?.has_upvoted
                            ? `Supported, ${probMeta.upvote_count} votes`
                            : `Support, ${probMeta?.upvote_count ?? 0} votes so far`
                        }
                      >
                        {problemVoting ? (
                          <span className="btn-spinner" aria-hidden />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                        )}
                        <span className="cp-feed-problem-vote__count">{probMeta?.upvote_count ?? 0}</span>
                        <span className="cp-feed-problem-vote__lbl">
                          {probMeta?.has_upvoted ? 'Supported' : 'Support'}
                        </span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`cp-vote-arrow ${isUpvoted ? 'cp-vote-arrow--up' : ''}`}
                          onClick={() => handleVote(post.id)}
                          title="Upvote"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={isUpvoted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                        </button>
                        <span className={`cp-vote-count ${isUpvoted ? 'cp-vote-count--up' : ''}`}>
                          {displayCount}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="cp-post__body">
                    <div className="cp-post__header">
                      <div className="cp-post__author-row">
                        <div className="cp-post__avatar">{(post.username[0] ?? '?').toUpperCase()}</div>
                        <span className="cp-post__username">{post.username}</span>
                        {post.is_verified && (
                          <span className="cp-post__verified">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Health worker
                          </span>
                        )}
                        <span className="cp-post__dot">·</span>
                        <span className="cp-post__time">{timeAgo(post.created_at)}</span>
                      </div>
                      <span className={`cp-cat-tag ${CATEGORY_COLOR[post.category] ?? 'cp-cat--gray'}`}>
                        {post.category.charAt(0) + post.category.slice(1).toLowerCase()}
                      </span>
                    </div>

                    {parsed ? (
                      <div className="cp-post__problem-block">
                        <div className="cp-post__problem-badges">
                          <span className="cp-post__problem-pill">Community problem</span>
                          <span className="ch-problem-chip">{parsed.problemCategoryLabel}</span>
                          <SeverityDots level={parsed.severity} />
                        </div>
                        <h3 className="cp-post__problem-title">{parsed.title}</h3>
                        {parsed.details ? (
                          <p className="cp-post__problem-details">{parsed.details}</p>
                        ) : null}
                        {!probId ? (
                          <p className="cp-post__problem-legacy">
                            This is an older problem post — use the feed upvote for reactions.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="cp-post__content">{post.content}</p>
                    )}

                    {post.media_urls.length > 0 && post.media_urls[0]?.url && (
                      <div className="cp-post__media">
                        <img src={post.media_urls[0].url} alt="post" className="cp-post__img" loading="lazy" />
                      </div>
                    )}

                    <div className="cp-post__action-bar">
                      <button
                        type="button"
                        className={`cp-action ${isExpanded ? 'cp-action--active' : ''}`}
                        onClick={() => toggleComments(post.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {postComments.length} {postComments.length === 1 ? 'Comment' : 'Comments'}
                      </button>
                      <button type="button" className="cp-action">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                        Share
                      </button>
                      {isOwnPost ? (
                        <button
                          type="button"
                          className="cp-action cp-action--delete"
                          disabled={isDeletingThis}
                          onClick={() => handleDeletePost(post.id)}
                          aria-label="Delete post"
                        >
                          {isDeletingThis ? (
                            <span className="btn-spinner" aria-hidden />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          )}
                          Delete
                        </button>
                      ) : !flagged.has(post.id) ? (
                        <button type="button" className="cp-action cp-action--flag" onClick={() => handleFlag(post.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
                          </svg>
                          Flag
                        </button>
                      ) : (
                        <span className="cp-action cp-action--flagged">Flagged</span>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="cp-comments">
                        {postComments.map((c) => (
                          <div key={c.id} className={`cp-comment ${c.isOwn ? 'cp-comment--own' : ''}`}>
                            <div className={`cp-comment__avatar ${c.isVerified ? 'cp-comment__avatar--verified' : ''}`}>
                              {c.initials}
                            </div>
                            <div className="cp-comment__body">
                              <div className="cp-comment__header">
                                <span className="cp-comment__author">{c.author}</span>
                                {c.isVerified && (
                                  <span className="cp-comment__verified-badge">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Health worker
                                  </span>
                                )}
                                <span className="cp-comment__time">{c.time}</span>
                              </div>
                              <p className="cp-comment__text">{c.text}</p>
                              <button
                                type="button"
                                className={`cp-comment__like-btn ${likedComments.has(c.id) ? 'cp-comment__like-btn--active' : ''}`}
                                onClick={() => handleLikeComment(c.id)}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill={likedComments.has(c.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {commentLikes[c.id] ?? c.likes}
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="cp-comment-compose">
                          <div className="cp-comment__avatar cp-comment__avatar--you">Y</div>
                          <div className="cp-comment-compose__input-wrap">
                            <input
                              className="cp-comment-compose__input"
                              type="text"
                              placeholder="Write a comment..."
                              value={replyText[post.id] ?? ''}
                              onChange={(e) => setReplyText((r) => ({ ...r, [post.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                            />
                            <button
                              type="button"
                              className="cp-comment-compose__send"
                              disabled={!(replyText[post.id] ?? '').trim()}
                              onClick={() => handleAddComment(post.id)}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
            {(feedPage > 1 || feedHasNextPage) && (
              <nav className="cp-trending-pager cp-feed-pager" aria-label="Feed pagination">
                <button
                  type="button"
                  className="cp-trending-pager__btn"
                  disabled={feedPage <= 1}
                  onClick={() => setFeedPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="cp-trending-pager__status">Page {feedPage}</span>
                <button
                  type="button"
                  className="cp-trending-pager__btn"
                  disabled={!feedHasNextPage}
                  onClick={() => setFeedPage((p) => p + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>

      <aside className="cp-sidebar">
        <div className="cp-sidebar__card">
          <div className="cp-sidebar__card-header">Community Info</div>
          <div className="cp-sidebar__card-body">
            <p className="cp-sidebar__desc">A safe, anonymous space for mental health support. All posts are private to this community.</p>
            <p className="cp-sidebar__hint">
              <strong>Problems</strong> appear in the feed with a highlight. Support counts on those cards also rank{' '}
              <strong>trending problems</strong> below.
            </p>
            <div className="cp-sidebar__stats">
              <div className="cp-sidebar__stat">
                <span className="cp-sidebar__stat-val">{feedPage}</span>
                <span className="cp-sidebar__stat-label">Feed page</span>
              </div>
              <div className="cp-sidebar__stat">
                <span className="cp-sidebar__stat-val">{posts.length}</span>
                <span className="cp-sidebar__stat-label">On page</span>
              </div>
            </div>
            <div className="cp-sidebar__actions">
              <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setShowCompose(true)}>
                Create post
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm cp-sidebar__problem-btn"
                style={{ flex: 1 }}
                onClick={() => setShowProblemCompose(true)}
              >
                Create problem
              </button>
            </div>
          </div>
        </div>

        <div className="cp-sidebar__card">
          <div className="cp-sidebar__card-header">Trending problems</div>
          <div className="cp-sidebar__card-body">
            {problemsGroupedQuery.isLoading && <p className="cp-sidebar__muted">Loading…</p>}
            {!problemsGroupedQuery.isLoading && trendingProblems.length === 0 && (
              <p className="cp-sidebar__muted">Nothing trending yet. Publish a problem to get started.</p>
            )}
            <ul className="cp-trending-problems" aria-label="Trending anonymous problems">
              {trendingPageItems.map((tp) => {
                const voting =
                  toggleProblemUpvoteMut.isPending && toggleProblemUpvoteMut.variables === tp.id;
                return (
                  <li key={tp.id} className="cp-trending-problem">
                    <div className="cp-trending-problem__main">
                      <span className="cp-trending-problem__title">{tp.title}</span>
                      <span className="cp-trending-problem__meta">
                        {tp.category_origin} · {tp.upvote_count} support
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`cp-trending-problem__vote ${tp.has_upvoted ? 'cp-trending-problem__vote--on' : ''}`}
                      disabled={voting}
                      onClick={() => toggleProblemUpvoteMut.mutate(tp.id)}
                      aria-pressed={tp.has_upvoted}
                    >
                      {voting ? <span className="btn-spinner" /> : tp.has_upvoted ? '✓' : '+'}
                    </button>
                  </li>
                );
              })}
            </ul>
            {trendingTotalPages > 1 && (
              <nav className="cp-trending-pager" aria-label="Trending problems pagination">
                <button
                  type="button"
                  className="cp-trending-pager__btn"
                  disabled={trendingPageIndex <= 0}
                  onClick={() => setTrendingPageIndex((i) => Math.max(0, i - 1))}
                >
                  Previous
                </button>
                <span className="cp-trending-pager__status">
                  Page {trendingPageIndex + 1} of {trendingTotalPages}
                </span>
                <button
                  type="button"
                  className="cp-trending-pager__btn"
                  disabled={trendingPageIndex >= trendingTotalPages - 1}
                  onClick={() => setTrendingPageIndex((i) => Math.min(trendingTotalPages - 1, i + 1))}
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        </div>

        <div className="cp-sidebar__card">
          <div className="cp-sidebar__card-header">Guidelines</div>
          <div className="cp-sidebar__card-body">
            <ul className="cp-guidelines">
              <li>All posts are anonymous</li>
              <li>Be kind and supportive</li>
              <li>Do not share personal contact details</li>
              <li>Flag content that feels unsafe</li>
              <li>Verified workers are here to help</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default CommunityPage;
