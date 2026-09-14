"use client";

import { useState } from "react";
import {
  Megaphone,
  MessageCircle,
  Heart,
  Send,
  Users,
  Pin,
  Search,
} from "lucide-react";

const INITIAL_POSTS = [
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

export default function CommunityPage() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [newPost, setNewPost] = useState("");

  const toggleLike = (postId: number) => {
    setLikedPosts((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId]
    );
  };

  const createPost = () => {
    const text = newPost.trim();

    if (!text) return;

    const post = {
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
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.content.toLowerCase().includes(search.toLowerCase()) ||
      post.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main
      style={{
        flex: 1,
        padding: "28px 40px 50px",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 26,
          gap: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Our Community
          </h1>

          <p
            style={{
              margin: "7px 0 0",
              color: "#64748B",
              fontSize: 15,
            }}
          >
            Connect with students, trainers and the SKCE team.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            padding: "9px 13px",
            width: 250,
          }}
        >
          <Search size={17} color="#94A3B8" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search community..."
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              fontSize: 13,
              color: "#334155",
              background: "transparent",
            }}
          />
        </div>
      </div>

      {/* Community Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<Users size={20} />}
          label="Community Members"
          value="128"
        />

        <StatCard
          icon={<MessageCircle size={20} />}
          label="Discussions"
          value="46"
        />

        <StatCard
          icon={<Megaphone size={20} />}
          label="Announcements"
          value="12"
        />
      </div>

      {/* Create Post */}
      <section
        style={{
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#2F6BFF",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ST
          </div>

          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Start a discussion
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#94A3B8",
              }}
            >
              Share something with the community
            </div>
          </div>
        </div>

        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Ask a question or share something..."
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid #E2E8F0",
            borderRadius: 9,
            padding: 12,
            resize: "vertical",
            outline: "none",
            fontSize: 13.5,
            color: "#334155",
            fontFamily: "inherit",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 12,
          }}
        >
          <button
            onClick={createPost}
            disabled={!newPost.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              background: newPost.trim() ? "#2F6BFF" : "#CBD5E1",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: newPost.trim() ? "pointer" : "not-allowed",
            }}
          >
            <Send size={15} />
            Post
          </button>
        </div>
      </section>

      {/* Community Feed */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {filteredPosts.map((post) => {
          const isLiked = likedPosts.includes(post.id);

          return (
            <article
              key={post.id}
              style={{
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: 22,
              }}
            >
              {/* Author */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background:
                        post.role === "Admin"
                          ? "#2F6BFF"
                          : post.role === "Trainer"
                          ? "#7C3AED"
                          : "#E2E8F0",
                      color:
                        post.role === "Student"
                          ? "#475569"
                          : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {post.initials}
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {post.author}
                      </span>

                      <span
                        style={{
                          fontSize: 10.5,
                          background:
                            post.role === "Admin"
                              ? "#DBEAFE"
                              : post.role === "Trainer"
                              ? "#EDE9FE"
                              : "#F1F5F9",
                          color:
                            post.role === "Admin"
                              ? "#1D4ED8"
                              : post.role === "Trainer"
                              ? "#6D28D9"
                              : "#64748B",
                          borderRadius: 5,
                          padding: "3px 6px",
                          fontWeight: 600,
                        }}
                      >
                        {post.role}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 11.5,
                        color: "#94A3B8",
                        marginTop: 2,
                      }}
                    >
                      {post.time}
                    </div>
                  </div>
                </div>

                {post.pinned && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      color: "#2F6BFF",
                      fontSize: 11.5,
                      fontWeight: 600,
                    }}
                  >
                    <Pin size={14} />
                    Pinned
                  </span>
                )}
              </div>

              {/* Post Content */}
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                {post.title}
              </h2>

              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.7,
                  color: "#64748B",
                }}
              >
                {post.content}
              </p>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  borderTop: "1px solid #F1F5F9",
                  marginTop: 18,
                  paddingTop: 14,
                }}
              >
                <button
                  onClick={() => toggleLike(post.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    border: "none",
                    background: "transparent",
                    color: isLiked ? "#2F6BFF" : "#64748B",
                    fontSize: 12.5,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <Heart
                    size={16}
                    fill={isLiked ? "currentColor" : "none"}
                  />
                  {post.likes + (isLiked ? 1 : 0)} Likes
                </button>

                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    border: "none",
                    background: "transparent",
                    color: "#64748B",
                    fontSize: 12.5,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <MessageCircle size={16} />
                  {post.replies} Replies
                </button>
              </div>
            </article>
          );
        })}

        {filteredPosts.length === 0 && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              padding: "50px 20px",
              textAlign: "center",
              color: "#94A3B8",
            }}
          >
            <MessageCircle
              size={34}
              style={{ marginBottom: 10 }}
            />

            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#475569",
              }}
            >
              No discussions found
            </div>

            <div
              style={{
                fontSize: 12.5,
                marginTop: 5,
              }}
            >
              Try a different search term.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 11,
        padding: 18,
        display: "flex",
        alignItems: "center",
        gap: 13,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 9,
          background: "#EAF0FF",
          color: "#2F6BFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            color: "#64748B",
            marginBottom: 3,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}