"use client";







import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";



import {



  Bell,



  Heart,



  Megaphone,



  MessageCircle,



    MoreHorizontal,
  Edit3,
  Trash2,
Pin,



  Search,



  Send,



  Image as ImageIcon,



  X,



  Sparkles,



  Users,



} from "lucide-react";







type PostRole = "Admin" | "Trainer" | "Student";



type CommunityPost = {

  id: number;

  authorId: number;

  author: string;

  role: PostRole;

  initials: string;

  time: string;

  title: string;

  content: string;

  topic: string;

  likes: number;

  replies: number;

  pinned: boolean;
  profilePhotoUrl?: string | null;
  imageUrl?: string | null;

};



type CommunityComment = {

  id: number;

  postId: number;

  authorId: number;

  author: string;

  role: PostRole;

  content: string;

  createdAt: string;

  updatedAt?: string;
  profilePhotoUrl?: string | null;

};



const TOPIC_LABELS = [

  "General Discussion",

  "Questions & Help",

  "Announcements",

  "Learning Tips",

];

const CREATE_TOPICS = [

  "General Discussion",

  "Questions & Help",

];



export default function CommunityPage() {

  const API_URL =

    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";



  const [posts, setPosts] = useState<CommunityPost[]>([]);

  const [communityMembers, setCommunityMembers] = useState(0);

  const [likedPosts, setLikedPosts] = useState<number[]>([]);

  const [search, setSearch] = useState("");

  const [newPost, setNewPost] = useState("");
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);

  const [activeTopic, setActiveTopic] = useState("All Posts");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

  const [commentsByPost, setCommentsByPost] = useState<Record<number, CommunityComment[]>>({});

  const [commentsLoading, setCommentsLoading] = useState<number | null>(null);

  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});

  const [commentSubmitting, setCommentSubmitting] = useState<number | null>(null);

  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTopic, setEditTopic] = useState("General Discussion");
  const [selectedTopic, setSelectedTopic] = useState("General Discussion");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);



  function getToken() {

    return typeof window !== "undefined"

      ? localStorage.getItem("token")

      : null;

  }



  function getCurrentUserId() {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const user = JSON.parse(raw) as { id?: number; userId?: number };
      const id = Number(user.id ?? user.userId);
      return Number.isInteger(id) && id > 0 ? id : null;
    } catch { return null; }
  }

  function clearAuthAndRedirect() {

    if (typeof window === "undefined") return;



    [

      "token",

      "user",

      "role",

      "student",

      "studentId",

    ].forEach((key) => localStorage.removeItem(key));



    window.location.href = "/login";

  }



  function getPhotoUrl(photoUrl?: string | null): string | null {
    if (!photoUrl) return null;
    if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
      return photoUrl;
    }

    const backendUrl = API_URL.replace(/\/api\/?$/, "");
    return `${backendUrl}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;
  }

  function handlePostImageChange(file: File | null) {
    if (!file) {
      setNewPostImage(null);
      setNewPostImagePreview(null);
      return;
    }

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);

    if (!allowedTypes.has(file.type)) {
      setError("Only JPG, PNG, WEBP, and GIF images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size cannot exceed 5 MB.");
      return;
    }

    setError("");
    setNewPostImage(file);
    setNewPostImagePreview(URL.createObjectURL(file));
  }

  function clearPostImage() {
    if (newPostImagePreview) {
      URL.revokeObjectURL(newPostImagePreview);
    }
    setNewPostImage(null);
    setNewPostImagePreview(null);
  }

  function initialsFor(name: string) {

    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (!parts.length) return "SK";

    return parts

      .slice(0, 2)

      .map((part) => part.charAt(0).toUpperCase())

      .join("");

  }



  function normalizeRole(role: string): PostRole {

    if (role === "ADMIN") return "Admin";

    if (role === "TRAINER") return "Trainer";

    return "Student";

  }



  function formatTime(value: string | undefined) {

    if (!value) return "Just now";



    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;



    const diff = Date.now() - date.getTime();

    const minutes = Math.floor(diff / 60000);

    const hours = Math.floor(diff / 3600000);

    const days = Math.floor(diff / 86400000);



    if (minutes < 1) return "Just now";

    if (minutes < 60) return `${minutes} min ago`;

    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;



    return date.toLocaleDateString();

  }



  function mapPost(row: any): CommunityPost {

    const author = String(row?.author || "SKCE User");

    const role = normalizeRole(String(row?.role || "STUDENT"));



    return {

      id: Number(row?.id),

      authorId: Number(row?.authorId || 0),

      author,

      role,

      initials: initialsFor(author),

      time: formatTime(row?.createdAt || row?.time),

      title: String(row?.title || "Community Post"),

      content: String(row?.content || ""),

      topic: String(row?.topic || "General Discussion"),

      likes: Number(row?.likes || 0),

      replies: Number(row?.replies || 0),

      pinned: Boolean(row?.pinned ?? row?.isPinned),
      profilePhotoUrl: row?.profilePhotoUrl ? String(row.profilePhotoUrl) : null,
      imageUrl: row?.imageUrl ? String(row.imageUrl) : null,

    };

  }



  function mapComment(row: any): CommunityComment {

    const author = String(row?.author || "SKCE User");



    return {

      id: Number(row?.id),

      postId: Number(row?.postId),

      authorId: Number(row?.authorId || 0),

      author,

      role: normalizeRole(String(row?.role || "STUDENT")),

      content: String(row?.content || ""),

      createdAt: String(row?.createdAt || ""),

      updatedAt: row?.updatedAt ? String(row.updatedAt) : undefined,

    };

  }



  async function authenticatedFetch(

    path: string,

    options: RequestInit = {}

  ) {

    const token = getToken();



    if (!token) {

      clearAuthAndRedirect();

      throw new Error("Authentication required");

    }



    const headers = new Headers(options.headers);

    headers.set("Authorization", `Bearer ${token}`);



    // Let the browser set the multipart/form-data boundary for FormData.
    // For JSON requests, explicitly send the JSON content type.
    if (options.body instanceof FormData) {
      headers.delete("Content-Type");
    } else if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }



    const response = await fetch(`${API_URL}${path}`, {

      ...options,

      headers,

      cache: "no-store",

    });



    if (response.status === 401 || response.status === 403) {

      clearAuthAndRedirect();

      throw new Error("Authentication required");

    }



    return response;

  }



  async function loadCommunityStats() {

    try {

      const response = await authenticatedFetch(

        "/community/stats"

      );

      const result = await response.json();



      if (!response.ok || !result?.success) {

        throw new Error(

          result?.message ||

            "Unable to load community statistics."

        );

      }



      setCommunityMembers(

        Number(result?.data?.members ?? 0)

      );

    } catch (err) {

      console.error(

        "Failed to load community statistics:",

        err

      );



      if (

        err instanceof Error &&

        err.message === "Authentication required"

      ) {

        return;

      }



      setError(

        err instanceof Error

          ? err.message

          : "Unable to load community statistics."

      );

    }

  }



  async function loadPosts() {

    try {

      setLoading(true);

      setError("");



      const response = await authenticatedFetch("/community/posts");

      const result = await response.json();



      if (!response.ok || !result?.success) {

        throw new Error(result?.message || "Unable to load community posts.");

      }



      const rows = Array.isArray(result.data) ? result.data : [];

      setPosts(rows.map(mapPost));

    } catch (err) {

      console.error("Failed to load community posts:", err);

      if (err instanceof Error && err.message === "Authentication required") return;

      setError(err instanceof Error ? err.message : "Unable to load community posts.");

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {
    return () => {
      if (newPostImagePreview) {
        URL.revokeObjectURL(newPostImagePreview);
      }
    };
  }, [newPostImagePreview]);

  useEffect(() => {
    void Promise.all([
      loadPosts(),
      loadCommunityStats(),
    ]);
  }, []);



  async function createPost() {

    const text = newPost.trim();

    if (!text || submitting) return;



    try {

      setSubmitting(true);

      setError("");



      const formData = new FormData();
      formData.append(
        "title",
        text.length > 80 ? `${text.slice(0, 77)}...` : text
      );
      formData.append("content", text);
      formData.append("topic", selectedTopic);

      if (newPostImage) {
        formData.append("image", newPostImage);
      }

      const response = await authenticatedFetch("/community/posts", {
        method: "POST",
        body: formData,
      });



      const result = await response.json();



      if (!response.ok || !result?.success) {

        throw new Error(result?.message || "Unable to create the post.");

      }



      setNewPost("");
      clearPostImage();
      setSelectedTopic("General Discussion");

      await loadPosts();

    } catch (err) {

      console.error("Failed to create community post:", err);

      if (err instanceof Error && err.message === "Authentication required") return;

      setError(err instanceof Error ? err.message : "Unable to create the post.");

    } finally {

      setSubmitting(false);

    }

  }



  async function toggleLike(postId: number) {

    const isLiked = likedPosts.includes(postId);



    try {

      setError("");



      const response = await authenticatedFetch(

        `/community/posts/${postId}/like`,

        { method: isLiked ? "DELETE" : "POST" }

      );



      const result = await response.json();



      if (!response.ok || !result?.success) {

        throw new Error(result?.message || "Unable to update the like.");

      }



      const liked = Boolean(result?.data?.liked);

      setLikedPosts((current) =>

        liked

          ? current.includes(postId)

            ? current

            : [...current, postId]

          : current.filter((id) => id !== postId)

      );



      await loadPosts();

    } catch (err) {

      console.error("Failed to update community like:", err);

      if (err instanceof Error && err.message === "Authentication required") return;

      setError(err instanceof Error ? err.message : "Unable to update the like.");

    }

  }



  function openEdit(post: CommunityPost) {
    setEditingPost(post); setEditTitle(post.title); setEditContent(post.content); setEditTopic(post.topic); setError("");
  }

  function closeEdit() {
    if (editSubmitting) return;
    setEditingPost(null); setEditTitle(""); setEditContent(""); setEditTopic("General Discussion");
  }

  async function saveEdit(event?: FormEvent) {
    event?.preventDefault();
    if (!editingPost || editSubmitting) return;
    const title = editTitle.trim(); const content = editContent.trim();
    if (!title || !content) { setError("Title and content are required."); return; }
    try {
      setEditSubmitting(true); setError("");
      const response = await authenticatedFetch(`/community/posts/${editingPost.id}`, { method: "PATCH", body: JSON.stringify({ title, content, topic: editTopic }) });
      const result = await response.json();
      if (!response.ok || !result?.success) throw new Error(result?.message || "Unable to update the post.");
      setEditingPost(null); await loadPosts();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to update the post."); }
    finally { setEditSubmitting(false); }
  }

  async function confirmDeletePost() {
    if (!deletePostId || deleteSubmitting) return;
    const deletedId = deletePostId;
    try {
      setDeleteSubmitting(true); setError("");
      const response = await authenticatedFetch(`/community/posts/${deletedId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result?.success) throw new Error(result?.message || "Unable to delete the post.");
      setDeletePostId(null);
      if (expandedPostId === deletedId) setExpandedPostId(null);
      await loadPosts();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete the post."); }
    finally { setDeleteSubmitting(false); }
  }

  async function toggleComments(postId: number) {

    if (expandedPostId === postId) {

      setExpandedPostId(null);

      return;

    }



    setExpandedPostId(postId);



    if (commentsByPost[postId]) return;



    try {

      setCommentsLoading(postId);

      setError("");



      const response = await authenticatedFetch(

        `/community/posts/${postId}/comments`

      );

      const result = await response.json();



      if (!response.ok || !result?.success) {

        throw new Error(result?.message || "Unable to load comments.");

      }



      const rows = Array.isArray(result.data) ? result.data : [];

      setCommentsByPost((current) => ({

        ...current,

        [postId]: rows.map(mapComment),

      }));

    } catch (err) {

      console.error("Failed to load community comments:", err);

      if (err instanceof Error && err.message === "Authentication required") return;

      setError(err instanceof Error ? err.message : "Unable to load comments.");

    } finally {

      setCommentsLoading(null);

    }

  }



  async function createComment(postId: number) {

    const content = (commentDrafts[postId] || "").trim();

    if (!content || commentSubmitting === postId) return;



    try {

      setCommentSubmitting(postId);

      setError("");



      const response = await authenticatedFetch(

        `/community/posts/${postId}/comments`,

        {

          method: "POST",

          body: JSON.stringify({ content }),

        }

      );



      const result = await response.json();



      if (!response.ok || !result?.success) {

        throw new Error(result?.message || "Unable to add comment.");

      }



      setCommentDrafts((current) => ({ ...current, [postId]: "" }));



      const commentsResponse = await authenticatedFetch(

        `/community/posts/${postId}/comments`

      );

      const commentsResult = await commentsResponse.json();



      if (commentsResponse.ok && commentsResult?.success) {

        const rows = Array.isArray(commentsResult.data)

          ? commentsResult.data

          : [];

        setCommentsByPost((current) => ({

          ...current,

          [postId]: rows.map(mapComment),

        }));

      }



      await loadPosts();

    } catch (err) {

      console.error("Failed to create community comment:", err);

      if (err instanceof Error && err.message === "Authentication required") return;

      setError(err instanceof Error ? err.message : "Unable to add comment.");

    } finally {

      setCommentSubmitting(null);

    }

  }



  const currentUserId = getCurrentUserId();

  const filteredPosts = useMemo(() => {

    const normalizedSearch = search.trim().toLowerCase();



    return posts.filter((post) => {

      const matchesSearch =

        !normalizedSearch ||

        post.title.toLowerCase().includes(normalizedSearch) ||

        post.content.toLowerCase().includes(normalizedSearch) ||

        post.author.toLowerCase().includes(normalizedSearch);



      const matchesTopic =

        activeTopic === "All Posts" || post.topic === activeTopic;



      return matchesSearch && matchesTopic;

    });

  }, [activeTopic, posts, search]);



  const pinnedPost = posts.find((post) => post.pinned);

  const announcementCount = posts.filter((post) => post.topic === "Announcements").length;

  const discussionCount = posts.length;

  const topicCounts = TOPIC_LABELS.reduce<Record<string, number>>((acc, topic) => {

    acc[topic] = posts.filter((post) => post.topic === topic).length;

    return acc;

  }, {});



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







        {error ? (

          <div style={errorBannerStyle}>

            {error}

          </div>

        ) : null}



        {/* Community highlights */}



        <section className="community-highlight-grid">



          <HighlightCard



            icon={Users}



            label="Community Members"



            value={String(communityMembers)}



            description="Students, trainers and staff"



            tone="blue"



          />







          <HighlightCard



            icon={MessageCircle}



            label="Discussions"



            value={String(discussionCount)}



            description="Questions and conversations"



            tone="rose"



          />







          <HighlightCard



            icon={Megaphone}



            label="Announcements"



            value={String(announcementCount)}



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



                    {pinnedPost.topic}



                  </span>



                </div>







                <h2 style={pinnedTitleStyle}>



                  {pinnedPost.title}



                </h2>







                <p style={pinnedTextStyle}>



                  {pinnedPost.content}



                </p>

                  {getPhotoUrl(pinnedPost.imageUrl) ? (
                    <div style={{ marginTop: 14, overflow: "hidden", borderRadius: 12, border: "1px solid #e5e7eb", background: "#f8fafc" }}>
                      <img src={getPhotoUrl(pinnedPost.imageUrl) as string} alt="Pinned post attachment" style={{ display: "block", width: "100%", maxHeight: 260, objectFit: "contain", margin: "0 auto" }} />
                    </div>
                  ) : null}







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







              {newPostImagePreview ? (
                <div style={postImagePreviewStyle}>
                  <img
                    src={newPostImagePreview}
                    alt="Selected post image"
                    style={postImagePreviewImageStyle}
                  />
                  <button
                    type="button"
                    onClick={clearPostImage}
                    style={postImageRemoveButtonStyle}
                    aria-label="Remove selected image"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : null}

              <div style={{ marginTop: 12, marginBottom: 12 }}>
                <select
                  value={selectedTopic}
                  onChange={(event) => setSelectedTopic(event.target.value)}
                  style={{ width: "100%", maxWidth: 260, border: "1px solid #dce2eb", borderRadius: 10, background: "#fff", padding: "9px 12px", fontSize: 12, color: "#475569", outline: "none" }}
                >
                  {CREATE_TOPICS.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>

              <div style={composerFooterStyle}>
                <div style={composerFooterLeftStyle}>
                  <label style={attachImageButtonStyle}>
                    <ImageIcon size={14} />
                    Add image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(event) => {
                        handlePostImageChange(event.target.files?.[0] || null);
                        event.currentTarget.value = "";
                      }}
                      style={hiddenFileInputStyle}
                    />
                  </label>
                  <span style={composerFooterHintStyle}>
                    JPG, PNG, WEBP or GIF · max 5 MB
                  </span>
                </div>

                <span style={composerFooterHintStyle}>
                  Be respectful and helpful to other learners.
                </span>

                <button



                  type="button"



                  onClick={() => void createPost()}



                  disabled={(!newPost.trim() && !newPostImage) || submitting}



                  style={{



                    ...postButtonStyle,



                    opacity: newPost.trim() || newPostImage ? 1 : 0.55,



                    cursor: newPost.trim()



                      ? "pointer"



                      : "not-allowed",



                  }}



                >



                  <Send size={14} />



                  {submitting ? "Posting..." : "Post"}



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



              {loading ? (

                <div style={emptyCardStyle}>

                  <div style={emptyIconStyle}>

                    <MessageCircle size={22} />

                  </div>

                  <strong style={emptyTitleStyle}>Loading community...</strong>

                  <span style={emptyTextStyle}>Fetching the latest discussions.</span>

                </div>

              ) : null}



              {!loading ? filteredPosts.map((post) => {



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
                          {getPhotoUrl(post.profilePhotoUrl) ? (
                            <img
                              src={getPhotoUrl(post.profilePhotoUrl) as string}
                              alt={post.author}
                              style={avatarImageStyle}
                            />
                          ) : (
                            post.initials
                          )}
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







                      {currentUserId !== null && post.authorId === currentUserId ? (
                        <details style={{ position: "relative" }}>
                          <summary style={{ listStyle: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, color: "#778293" }}><MoreHorizontal size={18} /></summary>
                          <div style={{ position: "absolute", right: 0, top: 34, zIndex: 20, width: 120, background: "#fff", border: "1px solid #e3e7ee", borderRadius: 12, padding: 4, boxShadow: "0 8px 24px rgba(15,23,42,.12)" }}>
                            <button type="button" onClick={() => openEdit(post)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "8px 9px", border: 0, background: "transparent", cursor: "pointer", color: "#4b5565", fontSize: 12, textAlign: "left" }}><Edit3 size={14} /> Edit</button>
                            <button type="button" onClick={() => setDeletePostId(post.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "8px 9px", border: 0, background: "transparent", cursor: "pointer", color: "#dc2626", fontSize: 12, textAlign: "left" }}><Trash2 size={14} /> Delete</button>
                          </div>
                        </details>
                      ) : null}

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

                    {getPhotoUrl(post.imageUrl) ? (
                      <div style={postImageContainerStyle}>
                        <img
                          src={getPhotoUrl(post.imageUrl) as string}
                          alt="Post attachment"
                          style={postImageStyle}
                        />
                      </div>
                    ) : null}

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



                        {post.likes}{" "}



                        Likes



                      </button>







                      <button

                        type="button"

                        onClick={() => void toggleComments(post.id)}

                        style={postActionButtonStyle}

                      >

                        <MessageCircle size={15} />

                        {post.replies} Replies

                      </button>



                    </div>



                    {expandedPostId === post.id ? (

                      <section style={commentsSectionStyle}>

                        <div style={commentsHeaderStyle}>

                          <strong style={commentsTitleStyle}>Comments</strong>

                          <span style={commentsCountStyle}>

                            {(commentsByPost[post.id] || []).length}

                          </span>

                        </div>



                        {commentsLoading === post.id ? (

                          <div style={commentsMutedStyle}>Loading comments...</div>

                        ) : (commentsByPost[post.id] || []).length === 0 ? (

                          <div style={commentsMutedStyle}>No comments yet. Be the first to reply.</div>

                        ) : (

                          <div style={commentsListStyle}>

                            {(commentsByPost[post.id] || []).map((comment) => (

                              <div key={comment.id} style={commentItemStyle}>

                                <div style={commentAvatarStyle}>
                                  {getPhotoUrl(comment.profilePhotoUrl) ? (
                                    <img
                                      src={getPhotoUrl(comment.profilePhotoUrl) as string}
                                      alt={comment.author}
                                      style={avatarImageStyle}
                                    />
                                  ) : (
                                    initialsFor(comment.author)
                                  )}
                                </div>

                                <div style={commentBodyStyle}>

                                  <div style={commentAuthorRowStyle}>

                                    <strong style={commentAuthorStyle}>{comment.author}</strong>

                                    <RoleBadge role={comment.role} />

                                    <span style={commentTimeStyle}>{formatTime(comment.createdAt)}</span>

                                  </div>

                                  <p style={commentTextStyle}>{comment.content}</p>

                                </div>

                              </div>

                            ))}

                          </div>

                        )}



                        <div style={commentComposerStyle}>

                          <textarea

                            value={commentDrafts[post.id] || ""}

                            onChange={(event) =>

                              setCommentDrafts((current) => ({

                                ...current,

                                [post.id]: event.target.value,

                              }))

                            }

                            placeholder="Write a reply..."

                            rows={2}

                            style={commentTextareaStyle}

                          />

                          <button

                            type="button"

                            onClick={() => void createComment(post.id)}

                            disabled={

                              !commentDrafts[post.id]?.trim() ||

                              commentSubmitting === post.id

                            }

                            style={{

                              ...commentButtonStyle,

                              opacity:

                                commentDrafts[post.id]?.trim() &&

                                commentSubmitting !== post.id

                                  ? 1

                                  : 0.55,

                              cursor:

                                commentDrafts[post.id]?.trim() &&

                                commentSubmitting !== post.id

                                  ? "pointer"

                                  : "not-allowed",

                            }}

                          >

                            <Send size={13} />

                            {commentSubmitting === post.id ? "Replying..." : "Reply"}

                          </button>

                        </div>

                      </section>

                    ) : null}



                  </article>



                );



              }) : null}







              {!loading && filteredPosts.length === 0 ? (



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



                {TOPIC_LABELS.map((topicLabel) => (



                  <button



                    type="button"



                    key={topicLabel}



                    onClick={() => {



                      if (



                        topicLabel ===



                        "Announcements"



                      ) {



                        setActiveTopic(



                          "Announcements"



                        );



                      } else if (



                        topicLabel ===



                        "Questions & Help"



                      ) {



                        setActiveTopic(



                          "Questions & Help"



                        );



                      } else if (



                        topicLabel ===



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



                    <span>{topicLabel}</span>



                    <span style={topicCountStyle}>



                      {topicCounts[topicLabel] || 0}



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

      {editingPost ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(15,23,42,.45)" }}>
          <form onSubmit={saveEdit} style={{ width: "100%", maxWidth: 560, borderRadius: 18, background: "#fff", padding: 22, boxShadow: "0 20px 60px rgba(15,23,42,.22)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#172033" }}>Edit Post</h2><button type="button" onClick={closeEdit} style={{ border: 0, background: "transparent", cursor: "pointer", color: "#64748b" }}><X size={20} /></button></div>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" style={{ width: "100%", boxSizing: "border-box", border: "1px solid #dce2eb", borderRadius: 10, padding: "10px 12px", marginBottom: 10, fontSize: 13 }} />
            <select value={editTopic} onChange={(e) => setEditTopic(e.target.value)} style={{ width: "100%", boxSizing: "border-box", border: "1px solid #dce2eb", borderRadius: 10, padding: "10px 12px", marginBottom: 10, fontSize: 13, background: "#fff", color: "#475569" }}>
              {CREATE_TOPICS.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
            </select>
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6} style={{ width: "100%", boxSizing: "border-box", border: "1px solid #dce2eb", borderRadius: 10, padding: "10px 12px", fontSize: 13, resize: "vertical" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}><button type="button" onClick={closeEdit} disabled={editSubmitting} style={{ border: "1px solid #dce2eb", background: "#fff", borderRadius: 10, padding: "9px 14px", cursor: "pointer", color: "#475569" }}>Cancel</button><button type="submit" disabled={editSubmitting} style={{ border: 0, background: "#2f6bff", color: "#fff", borderRadius: 10, padding: "9px 16px", cursor: "pointer", opacity: editSubmitting ? .6 : 1 }}>{editSubmitting ? "Saving..." : "Save changes"}</button></div>
          </form>
        </div>
      ) : null}

      {deletePostId ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(15,23,42,.45)" }}>
          <div style={{ width: "100%", maxWidth: 420, borderRadius: 18, background: "#fff", padding: 22, boxShadow: "0 20px 60px rgba(15,23,42,.22)" }}><h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#172033" }}>Delete this post?</h2><p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b" }}>This action cannot be undone.</p><div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><button type="button" onClick={() => setDeletePostId(null)} disabled={deleteSubmitting} style={{ border: "1px solid #dce2eb", background: "#fff", borderRadius: 10, padding: "9px 14px", cursor: "pointer", color: "#475569" }}>Cancel</button><button type="button" onClick={() => void confirmDeletePost()} disabled={deleteSubmitting} style={{ border: 0, background: "#dc2626", color: "#fff", borderRadius: 10, padding: "9px 16px", cursor: "pointer", opacity: deleteSubmitting ? .6 : 1 }}>{deleteSubmitting ? "Deleting..." : "Delete"}</button></div></div>
        </div>
      ) : null}




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







const composerFooterLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  minWidth: 0,
  flexWrap: "wrap",
};

const attachImageButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  padding: "7px 9px",
  border: "1px solid #dfe4ec",
  borderRadius: 8,
  background: "#ffffff",
  color: "#596579",
  fontSize: 9.5,
  fontWeight: 750,
  cursor: "pointer",
};

const hiddenFileInputStyle: CSSProperties = {
  display: "none",
};

const postImagePreviewStyle: CSSProperties = {
  position: "relative",
  width: "fit-content",
  maxWidth: "100%",
  marginTop: 11,
  borderRadius: 11,
  overflow: "hidden",
  border: "1px solid #e2e7ee",
  background: "#f8fafc",
};

const postImagePreviewImageStyle: CSSProperties = {
  display: "block",
  width: "min(360px, 100%)",
  maxHeight: 220,
  objectFit: "cover",
};

const postImageRemoveButtonStyle: CSSProperties = {
  position: "absolute",
  top: 7,
  right: 7,
  width: 27,
  height: 27,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: 0,
  borderRadius: "50%",
  background: "rgba(17,24,39,0.78)",
  color: "#ffffff",
  cursor: "pointer",
};

const avatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "50%",
  display: "block",
};

const postImageContainerStyle: CSSProperties = {
  marginTop: 13,
  width: "min(100%, 680px)",
  maxWidth: "100%",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid #e5e9ef",
  background: "#f8fafc",
};

const postImageStyle: CSSProperties = {
  display: "block",
  width: "100%",
  maxHeight: 360,
  objectFit: "contain",
  background: "#f8fafc",
};

const errorBannerStyle: CSSProperties = {

  marginBottom: 14,

  padding: "11px 14px",

  border: "1px solid #fecaca",

  borderRadius: 12,

  background: "#fff7f7",

  color: "#b42318",

  fontSize: 13,

  lineHeight: 1.5,

};



const commentsSectionStyle: CSSProperties = {

  marginTop: 14,

  paddingTop: 14,

  borderTop: "1px solid #edf0f4",

};



const commentsHeaderStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  gap: 7,

  marginBottom: 11,

};



const commentsTitleStyle: CSSProperties = {

  color: "#253044",

  fontSize: 13,

};



const commentsCountStyle: CSSProperties = {

  minWidth: 20,

  height: 20,

  padding: "0 6px",

  borderRadius: 999,

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  background: "#f1f4f8",

  color: "#6b7687",

  fontSize: 11,

  fontWeight: 700,

};



const commentsMutedStyle: CSSProperties = {

  padding: "8px 0 12px",

  color: "#8a94a4",

  fontSize: 12,

};



const commentsListStyle: CSSProperties = {

  display: "grid",

  gap: 12,

  marginBottom: 12,

};



const commentItemStyle: CSSProperties = {

  display: "flex",

  gap: 10,

};



const commentAvatarStyle: CSSProperties = {

  width: 30,

  height: 30,

  flexShrink: 0,

  borderRadius: "50%",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  background: "#eef2f6",

  color: "#596579",

  fontSize: 10,

  fontWeight: 800,

};



const commentBodyStyle: CSSProperties = {

  minWidth: 0,

  flex: 1,

  padding: "8px 10px",

  borderRadius: 10,

  background: "#f8fafc",

};



const commentAuthorRowStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  gap: 7,

  flexWrap: "wrap",

};



const commentAuthorStyle: CSSProperties = {

  color: "#344054",

  fontSize: 12,

};



const commentTimeStyle: CSSProperties = {

  color: "#98a2b3",

  fontSize: 10,

};



const commentTextStyle: CSSProperties = {

  margin: "5px 0 0",

  color: "#596579",

  fontSize: 12,

  lineHeight: 1.55,

  whiteSpace: "pre-wrap",

  overflowWrap: "anywhere",

};



const commentComposerStyle: CSSProperties = {

  display: "flex",

  alignItems: "flex-end",

  gap: 9,

};



const commentTextareaStyle: CSSProperties = {

  flex: 1,

  minHeight: 62,

  resize: "vertical",

  border: "1px solid #dfe4eb",

  borderRadius: 10,

  padding: "9px 11px",

  outline: "none",

  color: "#344054",

  background: "#fff",

  fontFamily: "inherit",

  fontSize: 12,

  lineHeight: 1.5,

};



const commentButtonStyle: CSSProperties = {

  height: 36,

  display: "inline-flex",

  alignItems: "center",

  gap: 6,

  border: 0,

  borderRadius: 9,

  padding: "0 12px",

  background: "#2f6bff",

  color: "#fff",

  fontSize: 12,

  fontWeight: 700,

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
