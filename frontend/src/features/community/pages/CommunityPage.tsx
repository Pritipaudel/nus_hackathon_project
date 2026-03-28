import { useRef, useState } from 'react';

import {
  useCommunityPosts,
  useTrendingPosts,
  useCreatePost,
  useReactToPost,
  useFlagPost,
} from '../hooks/useCommunity';

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
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showCompose, setShowCompose] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [localComments, setLocalComments] = useState<Record<string, LocalComment[]>>({});
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({});
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [localReactions, setLocalReactions] = useState<Record<string, 'UPVOTE' | null>>({});

  const categoryParam = activeCategory !== 'ALL' ? activeCategory : undefined;
  const { data: posts = [], isLoading } = useCommunityPosts({ category: categoryParam, limit: 30 });
  const { data: trending = [] } = useTrendingPosts();
  const createPost = useCreatePost();
  const reactMutation = useReactToPost();
  const flagMutation = useFlagPost();

  const handleVote = (postId: string) => {
    const current = localReactions[postId];
    const next = current === 'UPVOTE' ? null : 'UPVOTE';
    setLocalReactions((prev) => ({ ...prev, [postId]: next }));
    if (next === 'UPVOTE') {
      reactMutation.mutate({ postId, body: { reaction_type: 'UPVOTE' } });
    }
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
          <div className="cp-feed">
            {posts.length === 0 && (
              <div className="cp-empty">No posts in this category yet. Be the first to share.</div>
            )}
            {posts.map((post) => {
              const postComments = localComments[post.id] ?? [];
              const isExpanded = expandedComments.has(post.id);
              const isUpvoted = localReactions[post.id] === 'UPVOTE';
              const displayCount = post.reaction_count + (isUpvoted ? 1 : 0);

              return (
                <div key={post.id} className="cp-post">
                  <div className="cp-post__vote-col">
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

                    <p className="cp-post__content">{post.content}</p>

                    {post.media_urls.length > 0 && (
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
                      {!flagged.has(post.id) ? (
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
        )}
      </div>

      <aside className="cp-sidebar">
        <div className="cp-sidebar__card">
          <div className="cp-sidebar__card-header">Community Info</div>
          <div className="cp-sidebar__card-body">
            <p className="cp-sidebar__desc">A safe, anonymous space for mental health support. All posts are private to this community.</p>
            <div className="cp-sidebar__stats">
              <div className="cp-sidebar__stat">
                <span className="cp-sidebar__stat-val">{posts.length}</span>
                <span className="cp-sidebar__stat-label">Posts</span>
              </div>
              <div className="cp-sidebar__stat">
                <span className="cp-sidebar__stat-val">Live</span>
                <span className="cp-sidebar__stat-label">Feed</span>
              </div>
            </div>
            <button type="button" className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => setShowCompose(true)}>
              Create post
            </button>
          </div>
        </div>

        {trending.length > 0 && (
          <div className="cp-sidebar__card">
            <div className="cp-sidebar__card-header">Trending</div>
            <div className="cp-sidebar__card-body">
              {trending.map((t, i) => (
                <div key={t.id} className="cp-trending-item">
                  <span className="cp-trending-item__rank">{i + 1}</span>
                  <div className="cp-trending-item__body">
                    <p className="cp-trending-item__text">{t.content.slice(0, 80)}{t.content.length > 80 ? '...' : ''}</p>
                    <span className="cp-trending-item__score">{Math.round(t.trend_score)} reactions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
