import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "../lib/supabase";
import { getUserId } from "../lib/auth";
import { useProfile } from "../hooks/useProfile";

type Post = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users?:
    | {
        first_name: string | null;
        last_name: string | null;
        username: string | null;
        photo_url?: string | null;
      }[]
    | null;
};

// Icons
const HeartIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
  </svg>
);

const RepostIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h13M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H4" />
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const MAX_LEN = 120;

// Mock data for local development
const MOCK_POSTS: Post[] = [
  {
    id: "1",
    content: "Привет всем! Это тестовый пост для локальной разработки 🚀",
    created_at: new Date().toISOString(),
    user_id: "mock-user-1",
    users: [
      {
        first_name: "Иван",
        last_name: "Петров",
        username: "ivan_p",
        photo_url: null,
      },
    ],
  },
  {
    id: "2",
    content:
      "Кто хочет поучаствовать в нетворкинге на этой неделе? Давайте знакомиться! 👋",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user_id: "mock-user-2",
    users: [
      {
        first_name: "Мария",
        last_name: "Сидорова",
        username: "maria_s",
        photo_url: null,
      },
    ],
  },
  {
    id: "3",
    content:
      "Поделюсь опытом работы с React и TypeScript. Пишите в личку, отвечу всем! 💻",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    user_id: "mock-user-3",
    users: [
      {
        first_name: "Алексей",
        last_name: "Иванов",
        username: "alex_i",
        photo_url: null,
      },
    ],
  },
];

const formatTime = (date: string) => {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now.getTime() - postDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} мин.`;
  if (diffHours < 24) return `${diffHours} ч.`;
  if (diffDays < 7) return `${diffDays} д.`;
  return postDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
};

type FeedPageProps = {
  onBack?: () => void;
};

const FeedPage = ({ onBack }: FeedPageProps) => {
  const { profile } = useProfile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canPost, setCanPost] = useState(false);

  const meInitials = useMemo(() => {
    if (!profile) return "U";
    const first = profile.first_name?.[0] || "";
    const last = profile.last_name?.[0] || "";
    return (first + last || "U").toUpperCase();
  }, [profile]);

  const loadPosts = async () => {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      setPosts(MOCK_POSTS);
      return;
    }

    const { data, error: loadError } = await supabase
      .from("posts")
      .select(
        "id, content, created_at, user_id, users(first_name, last_name, username, photo_url)",
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (loadError) {
      setError(loadError.message);
      return;
    }
    setPosts((data as Post[]) || []);
  };

  useEffect(() => {
    const init = async () => {
      const session = await supabase.auth.getSession();
      setCanPost(!!session.data.session);
      await loadPosts();
    };
    void init();
  }, []);

  const submit = async () => {
    if (!canPost) {
      setError("Публикация доступна только внутри Telegram.");
      return;
    }
    if (!content.trim()) return;
    if (content.length > MAX_LEN) {
      setError(`Максимум ${MAX_LEN} символов.`);
      return;
    }
    setLoading(true);
    setError(null);
    const userId = await getUserId();
    const { error: insertError } = await supabase
      .from("posts")
      .insert({ content, user_id: userId });
    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setContent("");
    void loadPosts();
  };

  return (
    <section className="page feed-page">
      <div className="card hero">
        <div className="card-title">Лента</div>
        <div className="muted">Короткие посты и быстрые запросы.</div>
        <button className="back-button" onClick={onBack}>
          Назад
        </button>
      </div>

      <div className="feed-list">
        {posts.map((post) => {
          const author = post.users?.[0];
          const name =
            `${author?.first_name || ""} ${author?.last_name || ""}`.trim() ||
            "Участник";
          const initials = (author?.first_name?.[0] || "U").toUpperCase();
          const username = author?.username || "user";

          return (
            <div key={post.id} className="feed-item">
              <div className="avatar">
                {author?.photo_url ? (
                  <img src={author.photo_url} alt="profile" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="feed-content">
                <div className="feed-meta">
                  <strong>{name}</strong>
                  <span className="username">@{username}</span>
                  <span className="dot">·</span>
                  <span className="time">{formatTime(post.created_at)}</span>
                </div>
                <div className="feed-text">{post.content}</div>
                <div className="feed-actions">
                  <button className="feed-action like" aria-label="like">
                    <HeartIcon />
                    <span>0</span>
                  </button>
                  <button className="feed-action" aria-label="comment">
                    <CommentIcon />
                    <span>0</span>
                  </button>
                  <button className="feed-action" aria-label="repost">
                    <RepostIcon />
                    <span>0</span>
                  </button>
                  <button className="feed-action" aria-label="share">
                    <ShareIcon />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {!posts.length && (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Пока нет постов.
          </div>
        )}
      </div>

      {/* Компонент для создания поста */}
      <Card className="feed-composer">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="avatar">
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="me" />
            ) : (
              <span className="font-bold">{meInitials}</span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: 1,
            }}
          >
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_LEN}
              placeholder="Что нового?"
              disabled={!canPost}
              style={{
                flex: 1,
                border: "1px solid #d8cdc1",
                borderRadius: "12px",
                padding: "10px 14px",
                fontSize: "14px",
                background: "#fff",
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <Button
              onClick={submit}
              disabled={loading || !canPost || !content.trim()}
              size="sm"
            >
              {loading ? "..." : "Отправить"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <div className="error">{error}</div>}
    </section>
  );
};

export default FeedPage;
