"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  Bell,
  Heart,
  Megaphone,
  MessageCircle,
  Pin,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

type PostRole = "Admin" | "Trainer" | "Student";

type CommunityPost = {
  id: number;
  author: string;
  role: PostRole;
  initials: string;
  time: string;
  title: string;
  content: string;
  likes: number;
  replies: number;
  pinned: boolean;
};

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 1,
    author: "SKCE Admin",
    role: "Admin",
    initials: "SK",
    time: "2 hours ago",
    title: "Welcome to the SKCE Student Community!",
    content:
      "Welcome to our student community. Use this space to stay updated with announcements, ask questions, share your learning experience, and connect with other students.",
    likes: 24,
    replies: 8,
    pinned: true,
  },
  {
    id: 2,
    author: "Rahul Kumar",
    role: "Student",
    initials: "RK",
    time: "5 hours ago",
    title: "Question about Python assignments",
    content:
      "Can someone explain how to submit the Python assignment? I have completed the program but I am not sure which file format I should upload.",
    likes: 6,
    replies: 4,
    pinned: false,
  },
  {
    id: 3,
    author: "SKCE Trainer",
    role: "Trainer",
    initials: "TR",
    time: "Yesterday",
    title: "Upcoming Live Training Session",
    content:
      "Our next live training session will cover practical Excel formulas and functions. Students enrolled in MS Office are encouraged to attend.",
    likes: 18,
    replies: 5,
    pinned: false,
  },
];

const TOPICS = [
  { label: "General Discussion", count: 18 },
  { label: "Questions & Help", count: 12 },
  { label: "Announcements", count: 8 },
  { label: "Learning Tips", count: 5 },
];

export default function CommunityPage() {
  const [posts, setPosts] =
    useState<CommunityPost[]>(INITIAL_POSTS);
  const [likedPosts, setLikedPosts] =
    useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [newPost, setNewPost] = useState("");
  const [activeTopic, setActiveTopic] =
    useState("All Posts");

  function toggleLike(postId: number) {
    setLikedPosts((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId]
    );
  }

  function createPost() {
    const text = newPost.trim();

    if (!text) {
      return;
    }

    const post: CommunityPost = {
      id: Date.now(),
      author: "Student Name",
      role: "Student",
      initials: "ST",
      time: "Just now",
      title: "New Community Post",
      content: text,
      likes: 0,
      replies: 0,
      pinned: false,
    };

    setPosts((current) => [post, ...current]);
    setNewPost("");
  }

  const filteredPosts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesSearch =
        !normalizedSearch ||
        post.title.toLowerCase().includes(normalizedSearch) ||
        post.content.toLowerCase().includes(normalizedSearch) ||
        post.author.toLowerCase().includes(normalizedSearch);

      if (activeTopic === "All Posts") {
        return matchesSearch;
      }

      if (activeTopic === "Announcements") {
        return matchesSearch && post.role === "Admin";
      }

      if (activeTopic === "Questions & Help") {
        return (
          matchesSearch &&
          post.title.toLowerCase().includes("question")
        );
      }

      if (activeTopic === "Learning Tips") {
        return (
          matchesSearch &&
          post.content
            .toLowerCase()
            .includes("learning")
        );
      }

      return matchesSearch;
    });
  }, [activeTopic, posts, search]);

  const pinnedPost = posts.find(
    (post) => post.pinned
  );

  return (
    <>
      <main style={pageStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>
              STUDENT COMMUNITY
            </div>

            <h1 style={titleStyle}>
              Our Community
            </h1>

            <p style={subtitleStyle}>
              Ask questions, share ideas, learn together,
              and stay connected with the SKCE community.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <div style={searchBoxStyle}>
              <Search
                size={16}
                color="#8b95a4"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search discussions..."
                style={searchInputStyle}
              />
            </div>
          </div>
        </header>

        {/* Community highlights */}
        <section className="community-highlight-grid">
          <HighlightCard
            icon={Users}
            label="Community Members"
            value="128"
            description="Students, trainers and staff"
            tone="blue"
          />

          <HighlightCard
            icon={MessageCircle}
            label="Discussions"
            value="46"
            description="Questions and conversations"
            tone="rose"
          />

          <HighlightCard
            icon={Megaphone}
            label="Announcements"
            value="12"
            description="Updates from the SKCE team"
            tone="gold"
          />
        </section>

        <section className="community-layout">
          {/* Main feed */}
          <div style={{ minWidth: 0 }}>
            {pinnedPost ? (
              <section style={pinnedCardStyle}>
                <div style={pinnedTopStyle}>
                  <div style={pinnedLabelStyle}>
                    <Pin size={14} />
                    Pinned by SKCE
                  </div>

                  <span style={pinnedSmallStyle}>
                    Community announcement
                  </span>
                </div>

                <h2 style={pinnedTitleStyle}>
                  {pinnedPost.title}
                </h2>

                <p style={pinnedTextStyle}>
                  {pinnedPost.content}
                </p>

                <div style={pinnedFooterStyle}>
                  <span>
                    {pinnedPost.likes} likes
                  </span>
                  <span>
                    {pinnedPost.replies} replies
                  </span>
                </div>
              </section>
            ) : null}

            {/* Create post */}
            <section style={composerCardStyle}>
              <div style={composerHeaderStyle}>
                <div style={studentAvatarStyle}>
                  ST
                </div>

                <div>
                  <strong style={composerTitleStyle}>
                    Start a discussion
                  </strong>

                  <span style={composerHintStyle}>
                    Share a question, idea, or learning update
                    with your community.
                  </span>
                </div>
              </div>

              <textarea
                value={newPost}
                onChange={(event) =>
                  setNewPost(event.target.value)
                }
                placeholder="What would you like to share?"
                rows={4}
                style={composerTextareaStyle}
              />

              <div style={composerFooterStyle}>
                <span style={composerFooterHintStyle}>
                  Be respectful and helpful to other learners.
                </span>

                <button
                  type="button"
                  onClick={createPost}
                  disabled={!newPost.trim()}
                  style={{
                    ...postButtonStyle,
                    opacity: newPost.trim() ? 1 : 0.55,
                    cursor: newPost.trim()
                      ? "pointer"
                      : "not-allowed",
                  }}
                >
                  <Send size={14} />
                  Post
                </button>
              </div>
            </section>

            {/* Feed heading */}
            <div style={feedHeaderStyle}>
              <div>
                <h2 style={feedTitleStyle}>
                  Community Feed
                </h2>

                <p style={feedSubtitleStyle}>
                  {filteredPosts.length} discussion
                  {filteredPosts.length === 1
                    ? ""
                    : "s"} found
                </p>
              </div>

              <div style={topicTabsStyle}>
                {[
                  "All Posts",
                  "Announcements",
                  "Questions & Help",
                  "Learning Tips",
                ].map((topic) => (
                  <button
                    type="button"
                    key={topic}
                    onClick={() => setActiveTopic(topic)}
                    style={{
                      ...topicButtonStyle,
                      ...(activeTopic === topic
                        ? topicButtonActiveStyle
                        : {}),
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts */}
            <div style={postListStyle}>
              {filteredPosts.map((post) => {
                const isLiked = likedPosts.includes(
                  post.id
                );

                return (
                  <article
                    key={post.id}
                    className="community-post-card"
                    style={postCardStyle}
                  >
                    <div style={postHeaderStyle}>
                      <div style={authorStyle}>
                        <div
                          style={{
                            ...authorAvatarStyle,
                            ...(post.role === "Admin"
                              ? {
                                  background: "#2f6bff",
                                  color: "#fff",
                                }
                              : post.role === "Trainer"
                              ? {
                                  background: "#f0eaff",
                                  color: "#7a56d6",
                                }
                              : {
                                  background: "#eef2f6",
                                  color: "#596579",
                                }),
                          }}
                        >
                          {post.initials}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={authorNameRowStyle}>
                            <strong
                              style={authorNameStyle}
                            >
                              {post.author}
                            </strong>

                            <RoleBadge role={post.role} />
                          </div>

                          <span style={postTimeStyle}>
                            {post.time}
                          </span>
                        </div>
                      </div>

                      {post.pinned ? (
                        <span style={pinnedFeedBadgeStyle}>
                          <Pin size={12} />
                          Pinned
                        </span>
                      ) : null}
                    </div>

                    <h3 style={postTitleStyle}>
                      {post.title}
                    </h3>

                    <p style={postContentStyle}>
                      {post.content}
                    </p>

                    <div style={postActionsStyle}>
                      <button
                        type="button"
                        onClick={() =>
                          toggleLike(post.id)
                        }
                        style={{
                          ...postActionButtonStyle,
                          color: isLiked
                            ? "#2f6bff"
                            : "#778293",
                        }}
                      >
                        <Heart
                          size={15}
                          fill={
                            isLiked
                              ? "currentColor"
                              : "none"
                          }
                        />
                        {post.likes +
                          (isLiked ? 1 : 0)}{" "}
                        Likes
                      </button>

                      <button
                        type="button"
                        style={postActionButtonStyle}
                      >
                        <MessageCircle size={15} />
                        {post.replies} Replies
                      </button>
                    </div>
                  </article>
                );
              })}

              {filteredPosts.length === 0 ? (
                <div style={emptyCardStyle}>
                  <div style={emptyIconStyle}>
                    <MessageCircle size={22} />
                  </div>

                  <strong style={emptyTitleStyle}>
                    No discussions found
                  </strong>

                  <span style={emptyTextStyle}>
                    Try another search term or choose a
                    different topic.
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right column */}
          <aside style={sideColumnStyle}>
            <section style={sideCardStyle}>
              <SideHeading
                icon={Sparkles}
                title="Community Topics"
                subtitle="Browse discussions by theme"
              />

              <div style={topicListStyle}>
                {TOPICS.map((topic) => (
                  <button
                    type="button"
                    key={topic.label}
                    onClick={() => {
                      if (
                        topic.label ===
                        "Announcements"
                      ) {
                        setActiveTopic(
                          "Announcements"
                        );
                      } else if (
                        topic.label ===
                        "Questions & Help"
                      ) {
                        setActiveTopic(
                          "Questions & Help"
                        );
                      } else if (
                        topic.label ===
                        "Learning Tips"
                      ) {
                        setActiveTopic(
                          "Learning Tips"
                        );
                      } else {
                        setActiveTopic("All Posts");
                      }
                    }}
                    style={topicRowStyle}
                  >
                    <span>{topic.label}</span>
                    <span style={topicCountStyle}>
                      {topic.count}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section style={guidelinesCardStyle}>
              <SideHeading
                icon={Bell}
                title="Community Guidelines"
                subtitle="Keep the learning space useful for everyone"
              />

              <div style={guidelineListStyle}>
                <Guideline
                  number="01"
                  text="Keep questions clear and constructive."
                />
                <Guideline
                  number="02"
                  text="Help other students when you can."
                />
                <Guideline
                  number="03"
                  text="Do not share private account details."
                />
                <Guideline
                  number="04"
                  text="Keep conversations respectful."
                />
              </div>
            </section>

            <section style={teamCardStyle}>
              <div style={teamIconStyle}>
                <Megaphone size={18} />
              </div>

              <strong style={teamTitleStyle}>
                SKCE Team
              </strong>

              <p style={teamTextStyle}>
                Announcements and important student
                updates are shared here by the SKCE team.
              </p>
            </section>
          </aside>
        </section>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .community-highlight-grid {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 13px;
              margin-bottom: 18px;
            }

            .community-layout {
              display: grid;
              grid-template-columns: minmax(0, 1.6fr) minmax(290px, 0.75fr);
              gap: 18px;
              align-items: start;
            }

            .community-post-card {
              transition:
                transform 160ms ease,
                box-shadow 160ms ease,
                border-color 160ms ease;
            }

            .community-post-card:hover {
              transform: translateY(-1px);
              box-shadow: 0 9px 20px rgba(15,23,42,0.06) !important;
              border-color: #dfe5ee !important;
            }

            @media (max-width: 1050px) {
              .community-layout {
                grid-template-columns: minmax(0, 1fr);
              }

              .community-highlight-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
              }
            }

            @media (max-width: 760px) {
              .community-highlight-grid {
                grid-template-columns: minmax(0, 1fr);
              }
            }
          `,
        }}
      />
    </>
  );
}

function HighlightCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  tone: "blue" | "rose" | "gold";
}) {
  const palette = {
    blue: {
      bg: "#eaf0ff",
      fg: "#316cf2",
    },
    rose: {
      bg: "#f8e8ef",
      fg: "#a01441",
    },
    gold: {
      bg: "#fff4dc",
      fg: "#b97812",
    },
  };

  const colors = palette[tone];

  return (
    <div style={highlightCardStyle}>
      <div
        style={{
          ...highlightIconStyle,
          background: colors.bg,
          color: colors.fg,
        }}
      >
        <Icon size={18} />
      </div>

      <div style={{ minWidth: 0 }}>
        <span style={highlightLabelStyle}>
          {label}
        </span>

        <strong style={highlightValueStyle}>
          {value}
        </strong>

        <span style={highlightDescriptionStyle}>
          {description}
        </span>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: PostRole }) {
  const styles: Record<
    PostRole,
    { bg: string; fg: string }
  > = {
    Admin: {
      bg: "#eaf0ff",
      fg: "#3161d3",
    },
    Trainer: {
      bg: "#f0eaff",
      fg: "#7247c7",
    },
    Student: {
      bg: "#f1f4f7",
      fg: "#657083",
    },
  };

  const current = styles[role];

  return (
    <span
      style={{
        ...roleBadgeStyle,
        background: current.bg,
        color: current.fg,
      }}
    >
      {role}
    </span>
  );
}

function SideHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={sideHeadingStyle}>
      <div style={sideHeadingIconStyle}>
        <Icon size={16} />
      </div>

      <div style={{ minWidth: 0 }}>
        <h2 style={sideHeadingTitleStyle}>
          {title}
        </h2>

        <p style={sideHeadingSubtitleStyle}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function Guideline({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div style={guidelineStyle}>
      <span style={guidelineNumberStyle}>
        {number}
      </span>

      <span style={guidelineTextStyle}>
        {text}
      </span>
    </div>
  );
}

const pageStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  flex: 1,
  boxSizing: "border-box",
  padding: "28px 32px 38px",
  background: "#f5f7fb",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 18,
};

const eyebrowStyle: CSSProperties = {
  marginBottom: 5,
  fontSize: 10.5,
  fontWeight: 800,
  letterSpacing: "0.11em",
  color: "#a01441",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 27,
  lineHeight: 1.2,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: "#111827",
};

const subtitleStyle: CSSProperties = {
  maxWidth: 700,
  margin: "6px 0 0",
  fontSize: 13,
  lineHeight: 1.6,
  color: "#818b9b",
};

const headerActionsStyle: CSSProperties = {
  flex: "0 0 auto",
};

const searchBoxStyle: CSSProperties = {
  width: 270,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 11px",
  border: "1px solid #dfe4ec",
  borderRadius: 9,
  background: "#ffffff",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: 0,
  outline: "none",
  background: "transparent",
  color: "#374151",
  fontSize: 11.5,
};

const highlightCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 11,
  minWidth: 0,
  padding: 15,
  border: "1px solid #e4e8ef",
  borderRadius: 15,
  background: "#ffffff",
  boxShadow:
    "0 4px 12px rgba(15,23,42,0.035)",
};

const highlightIconStyle: CSSProperties = {
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 40px",
  borderRadius: 11,
};

const highlightLabelStyle: CSSProperties = {
  display: "block",
  fontSize: 10.5,
  color: "#8b95a4",
};

const highlightValueStyle: CSSProperties = {
  display: "block",
  marginTop: 2,
  fontSize: 19,
  lineHeight: 1.15,
  color: "#111827",
};

const highlightDescriptionStyle: CSSProperties = {
  display: "block",
  marginTop: 3,
  fontSize: 9.5,
  color: "#9aa2af",
};

const pinnedCardStyle: CSSProperties = {
  marginBottom: 13,
  padding: 18,
  border: "1px solid #e7d9ad",
  borderRadius: 16,
  background:
    "linear-gradient(135deg,#fffdf5 0%,#fff8e8 100%)",
};

const pinnedTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const pinnedLabelStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 10,
  fontWeight: 800,
  color: "#a97011",
};

const pinnedSmallStyle: CSSProperties = {
  fontSize: 9.5,
  color: "#a09175",
};

const pinnedTitleStyle: CSSProperties = {
  margin: "12px 0 6px",
  fontSize: 15,
  lineHeight: 1.35,
  fontWeight: 800,
  color: "#372f22",
};

const pinnedTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 11.5,
  lineHeight: 1.6,
  color: "#736957",
};

const pinnedFooterStyle: CSSProperties = {
  display: "flex",
  gap: 14,
  marginTop: 11,
  fontSize: 9.5,
  color: "#9b8b70",
};

const composerCardStyle: CSSProperties = {
  padding: 18,
  marginBottom: 18,
  border: "1px solid #e4e8ef",
  borderRadius: 16,
  background: "#ffffff",
  boxShadow:
    "0 4px 14px rgba(15,23,42,0.035)",
};

const composerHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
};

const studentAvatarStyle: CSSProperties = {
  width: 38,
  height: 38,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 38px",
  borderRadius: "50%",
  background: "#2f6bff",
  color: "#ffffff",
  fontSize: 11,
  fontWeight: 800,
};

const composerTitleStyle: CSSProperties = {
  display: "block",
  fontSize: 12.5,
  color: "#273244",
};

const composerHintStyle: CSSProperties = {
  display: "block",
  marginTop: 2,
  fontSize: 10,
  color: "#969fac",
};

const composerTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 104,
  boxSizing: "border-box",
  resize: "vertical",
  border: "1px solid #dfe5ed",
  borderRadius: 11,
  padding: 11,
  outline: "none",
  fontFamily: "inherit",
  fontSize: 11.5,
  lineHeight: 1.55,
  color: "#344054",
  background: "#fbfcfd",
};

const composerFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 10,
};

const composerFooterHintStyle: CSSProperties = {
  minWidth: 0,
  fontSize: 9.5,
  color: "#99a1ae",
};

const postButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  flex: "0 0 auto",
  border: 0,
  borderRadius: 8,
  padding: "8px 12px",
  background: "#2f6bff",
  color: "#ffffff",
  fontSize: 10.5,
  fontWeight: 800,
};

const feedHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 15,
  marginBottom: 11,
};

const feedTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
  color: "#172033",
};

const feedSubtitleStyle: CSSProperties = {
  margin: "3px 0 0",
  fontSize: 10,
  color: "#99a1ae",
};

const topicTabsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: 6,
};

const topicButtonStyle: CSSProperties = {
  border: "1px solid #dfe4ec",
  borderRadius: 999,
  padding: "6px 9px",
  background: "#ffffff",
  color: "#667184",
  fontSize: 9.5,
  fontWeight: 750,
  cursor: "pointer",
};

const topicButtonActiveStyle: CSSProperties = {
  borderColor: "#2f6bff",
  background: "#2f6bff",
  color: "#ffffff",
};

const postListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 11,
};

const postCardStyle: CSSProperties = {
  minWidth: 0,
  padding: 18,
  border: "1px solid #e4e8ef",
  borderRadius: 15,
  background: "#ffffff",
  boxShadow:
    "0 3px 10px rgba(15,23,42,0.025)",
};

const postHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
};

const authorStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
};

const authorAvatarStyle: CSSProperties = {
  width: 38,
  height: 38,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 38px",
  borderRadius: "50%",
  fontSize: 11,
  fontWeight: 800,
};

const authorNameRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 6,
};

const authorNameStyle: CSSProperties = {
  fontSize: 12.5,
  color: "#202a3a",
};

const roleBadgeStyle: CSSProperties = {
  borderRadius: 999,
  padding: "3px 6px",
  fontSize: 8.5,
  fontWeight: 800,
};

const postTimeStyle: CSSProperties = {
  display: "block",
  marginTop: 2,
  fontSize: 9.5,
  color: "#99a1ae",
};

const pinnedFeedBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 6px",
  borderRadius: 7,
  background: "#fff7e3",
  color: "#a97011",
  fontSize: 8.5,
  fontWeight: 800,
};

const postTitleStyle: CSSProperties = {
  margin: "13px 0 6px",
  fontSize: 14.5,
  lineHeight: 1.35,
  fontWeight: 800,
  color: "#172033",
};

const postContentStyle: CSSProperties = {
  margin: 0,
  fontSize: 11.5,
  lineHeight: 1.65,
  color: "#687486",
};

const postActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 15,
  marginTop: 14,
  paddingTop: 12,
  borderTop: "1px solid #eef1f5",
};

const postActionButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  border: 0,
  padding: 0,
  background: "transparent",
  fontSize: 10.5,
  fontWeight: 700,
  cursor: "pointer",
};

const sideColumnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 13,
  minWidth: 0,
};

const sideCardStyle: CSSProperties = {
  padding: 17,
  border: "1px solid #e4e8ef",
  borderRadius: 15,
  background: "#ffffff",
  boxShadow:
    "0 4px 12px rgba(15,23,42,0.03)",
};

const sideHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
};

const sideHeadingIconStyle: CSSProperties = {
  width: 35,
  height: 35,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 35px",
  borderRadius: 10,
  background: "#f8e8ef",
  color: "#a01441",
};

const sideHeadingTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 13.5,
  fontWeight: 800,
  color: "#1d2738",
};

const sideHeadingSubtitleStyle: CSSProperties = {
  margin: "3px 0 0",
  fontSize: 9.5,
  lineHeight: 1.4,
  color: "#969fad",
};

const topicListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
  marginTop: 14,
};

const topicRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  width: "100%",
  padding: "9px 10px",
  border: "1px solid #eef1f5",
  borderRadius: 9,
  background: "#fbfcfd",
  color: "#667184",
  fontSize: 10.5,
  textAlign: "left",
  cursor: "pointer",
};

const topicCountStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 23,
  padding: "3px 5px",
  borderRadius: 999,
  background: "#edf2ff",
  color: "#3c68d8",
  fontSize: 8.5,
  fontWeight: 800,
};

const guidelinesCardStyle: CSSProperties = {
  padding: 17,
  border: "1px solid #e4e8ef",
  borderRadius: 15,
  background:
    "linear-gradient(145deg,#ffffff 0%,#fafbfd 100%)",
};

const guidelineListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginTop: 14,
};

const guidelineStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
};

const guidelineNumberStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  flex: "0 0 22px",
  borderRadius: 7,
  background: "#eef2f7",
  color: "#748092",
  fontSize: 7.5,
  fontWeight: 800,
};

const guidelineTextStyle: CSSProperties = {
  paddingTop: 3,
  fontSize: 10,
  lineHeight: 1.45,
  color: "#687486",
};

const teamCardStyle: CSSProperties = {
  padding: 17,
  border: "1px solid #dfe6f2",
  borderRadius: 15,
  background: "#f8faff",
};

const teamIconStyle: CSSProperties = {
  width: 37,
  height: 37,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 9,
  borderRadius: 10,
  background: "#eaf0ff",
  color: "#316cf2",
};

const teamTitleStyle: CSSProperties = {
  display: "block",
  fontSize: 12.5,
  color: "#253044",
};

const teamTextStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 10,
  lineHeight: 1.5,
  color: "#8590a0",
};

const emptyCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 220,
  padding: 25,
  border: "1px dashed #dce2eb",
  borderRadius: 15,
  background: "#fbfcfd",
  textAlign: "center",
};

const emptyIconStyle: CSSProperties = {
  width: 45,
  height: 45,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  background: "#eff2f6",
  color: "#919aaa",
};

const emptyTitleStyle: CSSProperties = {
  marginTop: 9,
  fontSize: 13,
  color: "#4b5565",
};

const emptyTextStyle: CSSProperties = {
  maxWidth: 340,
  marginTop: 4,
  fontSize: 10.5,
  lineHeight: 1.5,
  color: "#9aa2af",
};
