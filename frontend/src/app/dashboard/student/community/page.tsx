"use client";



import {

  useEffect,

  useMemo,

  useState,

  type FormEvent,

} from "react";

import {

  AlertCircle,

  Bell,

  Edit3,

  Heart,

  Image as ImageIcon,

  Megaphone,

  MessageCircle,

  MoreHorizontal,

  Pin,

  RefreshCw,

  Search,

  Send,

  Sparkles,

  Trash2,

  Users,

  X,

  ChevronRight,

} from "lucide-react";

import {

  DetailPanel,

  Modal,

  SkStyles,

  SkTile,

  reveal,

  useToasts,

  usePreview,

} from "@/components/student/skce-ui";



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



type TileKey = "discussions" | "announcements";



const TOPIC_LABELS = [

  "General Discussion",

  "Questions & Help",

  "Announcements",

  "Learning Tips",

];



const CREATE_TOPICS = ["General Discussion", "Questions & Help"];



const FEED_TABS = ["All Posts", "Announcements", "Questions & Help", "Learning Tips"];



export default function CommunityPage() {

  const API_URL =

    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";



  const toasts = useToasts();

  const preview = usePreview<TileKey>("discussions");



  const [posts, setPosts] = useState<CommunityPost[]>([]);

  const [communityMembers, setCommunityMembers] = useState(0);

  const [likedPosts, setLikedPosts] = useState<number[]>([]);

  const [search, setSearch] = useState("");

  const [newPost, setNewPost] = useState("");

  const [newPostImage, setNewPostImage] = useState<File | null>(null);

  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(

    null

  );

  const [activeTopic, setActiveTopic] = useState("All Posts");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

  const [commentsByPost, setCommentsByPost] = useState<

    Record<number, CommunityComment[]>

  >({});

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

  const [menuPostId, setMenuPostId] = useState<number | null>(null);



  function getToken() {

    return typeof window !== "undefined" ? localStorage.getItem("token") : null;

  }



  function getCurrentUserId() {

    if (typeof window === "undefined") return null;



    try {

      const raw = localStorage.getItem("user");

      if (!raw) return null;

      const user = JSON.parse(raw) as { id?: number; userId?: number };

      const id = Number(user.id ?? user.userId);

      return Number.isInteger(id) && id > 0 ? id : null;

    } catch {

      return null;

    }

  }



  function clearAuthAndRedirect() {

    if (typeof window === "undefined") return;



    ["token", "user", "role", "student", "studentId"].forEach((key) =>

      localStorage.removeItem(key)

    );



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

      profilePhotoUrl: row?.profilePhotoUrl ? String(row.profilePhotoUrl) : null,

    };

  }



  async function authenticatedFetch(path: string, options: RequestInit = {}) {

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

      const response = await authenticatedFetch("/community/stats");

      const result = await response.json();



      if (!response.ok || !result?.success) {

        throw new Error(result?.message || "Unable to load community statistics.");

      }



      setCommunityMembers(Number(result?.data?.members ?? 0));

    } catch (err) {

      console.error("Failed to load community statistics:", err);



      if (err instanceof Error && err.message === "Authentication required") {

        return;

      }



      setError(

        err instanceof Error ? err.message : "Unable to load community statistics."

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

    void Promise.all([loadPosts(), loadCommunityStats()]);

  }, []);



  useEffect(() => {

    if (menuPostId === null) {

      return;

    }



    const close = () => setMenuPostId(null);



    document.addEventListener("click", close);



    return () => document.removeEventListener("click", close);

  }, [menuPostId]);



  async function createPost() {

    const text = newPost.trim();

    if (!text || submitting) return;



    try {

      setSubmitting(true);

      setError("");



      const formData = new FormData();

      formData.append("title", text.length > 80 ? `${text.slice(0, 77)}...` : text);

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



      toasts.push("success", "Your post has been published.");



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



      const response = await authenticatedFetch(`/community/posts/${postId}/like`, {

        method: isLiked ? "DELETE" : "POST",

      });



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

    setEditingPost(post);

    setEditTitle(post.title);

    setEditContent(post.content);

    setEditTopic(post.topic);

    setError("");

  }



  function closeEdit() {

    if (editSubmitting) return;

    setEditingPost(null);

    setEditTitle("");

    setEditContent("");

    setEditTopic("General Discussion");

  }



  async function saveEdit(event?: FormEvent) {

    event?.preventDefault();

    if (!editingPost || editSubmitting) return;



    const title = editTitle.trim();

    const content = editContent.trim();



    if (!title || !content) {

      setError("Title and content are required.");

      return;

    }



    try {

      setEditSubmitting(true);

      setError("");



      const response = await authenticatedFetch(

        `/community/posts/${editingPost.id}`,

        {

          method: "PATCH",

          body: JSON.stringify({ title, content, topic: editTopic }),

        }

      );



      const result = await response.json();



      if (!response.ok || !result?.success) {

        throw new Error(result?.message || "Unable to update the post.");

      }



      setEditingPost(null);

      toasts.push("success", "Post updated.");

      await loadPosts();

    } catch (err) {

      setError(err instanceof Error ? err.message : "Unable to update the post.");

    } finally {

      setEditSubmitting(false);

    }

  }



  async function confirmDeletePost() {

    if (!deletePostId || deleteSubmitting) return;



    const deletedId = deletePostId;



    try {

      setDeleteSubmitting(true);

      setError("");



      const response = await authenticatedFetch(`/community/posts/${deletedId}`, {

        method: "DELETE",

      });



      const result = await response.json();



      if (!response.ok || !result?.success) {

        throw new Error(result?.message || "Unable to delete the post.");

      }



      setDeletePostId(null);

      if (expandedPostId === deletedId) setExpandedPostId(null);

      toasts.push("success", "Post deleted.");

      await loadPosts();

    } catch (err) {

      setError(err instanceof Error ? err.message : "Unable to delete the post.");

    } finally {

      setDeleteSubmitting(false);

    }

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



      const response = await authenticatedFetch(`/community/posts/${postId}/comments`);

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



      const response = await authenticatedFetch(`/community/posts/${postId}/comments`, {

        method: "POST",

        body: JSON.stringify({ content }),

      });



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

        const rows = Array.isArray(commentsResult.data) ? commentsResult.data : [];

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



      const matchesTopic = activeTopic === "All Posts" || post.topic === activeTopic;



      return matchesSearch && matchesTopic;

    });

  }, [activeTopic, posts, search]);



  const pinnedPost = posts.find((post) => post.pinned);

  const announcementPosts = posts.filter((post) => post.topic === "Announcements");

  const announcementCount = announcementPosts.length;

  const discussionCount = posts.length;

  const topicCounts = TOPIC_LABELS.reduce<Record<string, number>>((acc, topic) => {

    acc[topic] = posts.filter((post) => post.topic === topic).length;

    return acc;

  }, {});



  const tileProps = (key: TileKey) => ({

    active: preview.shown === key,

    pinned: preview.pinned === key,

    onEnter: () => preview.setHover(key),

    onToggle: () => preview.toggle(key),

  });



  const previewPosts = preview.last === "announcements" ? announcementPosts : posts;



  function jumpToPost(postId: number) {

    setSearch("");

    setActiveTopic("All Posts");



    window.setTimeout(() => {

      document

        .getElementById(`post-${postId}`)

        ?.scrollIntoView({ behavior: "smooth", block: "center" });

    }, 80);

  }



  function selectTopic(topicLabel: string) {

    if (

      topicLabel === "Announcements" ||

      topicLabel === "Questions & Help" ||

      topicLabel === "Learning Tips"

    ) {

      setActiveTopic(topicLabel);

    } else {

      setActiveTopic("All Posts");

    }

  }



  return (

    <>

      <main className="sk-page">

        <div className="sk-container">

          <header className="cm-hero sk-reveal">

            <div className="cm-hero-copy sk-min0">

              <div className="cm-hero-icon" aria-hidden="true">

                <Users size={26} />

              </div>

              <div className="cm-hero-text">

                <div className="sk-kicker">Student community</div>

                <h1>Our Community</h1>

                <p>

                  Ask questions, share ideas, learn together, and stay connected

                  with the SKCE community.

                </p>

              </div>

            </div>



            <label className="sk-search cm-search">

              <Search size={16} />

              <input

                value={search}

                onChange={(event) => setSearch(event.target.value)}

                placeholder="Search discussions..."

                aria-label="Search discussions"

              />

              {search ? (

                <button

                  type="button"

                  className="cm-clear"

                  onClick={() => setSearch("")}

                  aria-label="Clear search"

                >

                  <X size={14} />

                </button>

              ) : null}

            </label>

          </header>



          {error ? (

            <div className="sk-alert is-error" role="alert">

              <AlertCircle size={18} />

              <span>{error}</span>

              <button type="button" onClick={() => setError("")} aria-label="Dismiss">

                <X size={15} />

              </button>

            </div>

          ) : null}



          {/* Highlights: hover to preview, click to pin */}

          <div className="sk-zone" onMouseLeave={() => preview.setHover(null)}>

            <section className="sk-tiles sk-tiles-3">

              <SkTile

                isStatic

                index={1}

                icon={Users}

                label="Community Members"

                value={communityMembers}

                helper="Students, trainers and staff"

                tone="blue"

              />

              <SkTile

                index={2}

                icon={MessageCircle}

                label="Discussions"

                value={discussionCount}

                helper="Questions and conversations"

                tone="orange"

                {...tileProps("discussions")}

              />

              <SkTile

                index={3}

                icon={Megaphone}

                label="Announcements"

                value={announcementCount}

                helper="Updates from the SKCE team"

                tone="navy"

                {...tileProps("announcements")}

              />

            </section>



            <DetailPanel

              open={Boolean(preview.shown)}

              itemKey={preview.last}

              icon={preview.last === "announcements" ? Megaphone : MessageCircle}

              title={

                preview.last === "announcements"

                  ? "Latest announcements"

                  : "Latest discussions"

              }

              subtitle="Click a post to jump straight to it in the feed"

              pinned={preview.pinned === preview.last}

              onUnpin={() => preview.setPinned(null)}

            >

              {previewPosts.length === 0 ? (

                <p className="sk-detail-empty">Nothing here yet.</p>

              ) : (

                <div className="sk-rows">

                  {previewPosts.slice(0, 6).map((post) => (

                    <button

                      key={post.id}

                      type="button"

                      className="sk-row"

                      onClick={() => jumpToPost(post.id)}

                    >

                      <div className="sk-avatar" style={{ width: 36, height: 36, flexBasis: 36, fontSize: 12 }}>

                        {getPhotoUrl(post.profilePhotoUrl) ? (

                          <img src={getPhotoUrl(post.profilePhotoUrl) as string} alt={post.author} />

                        ) : (

                          post.initials

                        )}

                      </div>

                      <div className="sk-min0 sk-grow">

                        <span className="sk-row-title">{post.title}</span>

                        <span className="sk-row-sub">

                          {post.author} · {post.time}

                        </span>

                      </div>

                      <ChevronRight size={15} className="sk-arrow" />

                    </button>

                  ))}

                </div>

              )}

            </DetailPanel>

          </div>



          <section className="cm-layout">

            {/* Main feed */}

            <div className="sk-min0">

              {pinnedPost ? (

                <section className="cm-pinned sk-reveal" style={reveal(4)}>

                  <div className="cm-pinned-top">

                    <span className="cm-pinned-label">

                      <Pin size={14} />

                      Pinned by SKCE

                    </span>

                    <span className="sk-badge tone-orange">{pinnedPost.topic}</span>

                  </div>



                  <h2>{pinnedPost.title}</h2>

                  <p>{pinnedPost.content}</p>



                  {getPhotoUrl(pinnedPost.imageUrl) ? (

                    <div className="cm-image">

                      <img

                        src={getPhotoUrl(pinnedPost.imageUrl) as string}

                        alt="Pinned post attachment"

                      />

                    </div>

                  ) : null}



                  <div className="cm-pinned-foot">

                    <span>{pinnedPost.likes} likes</span>

                    <span>{pinnedPost.replies} replies</span>

                  </div>

                </section>

              ) : null}



              {/* Composer */}

              <section className="sk-panel cm-composer sk-reveal" style={reveal(5)}>

                <div className="cm-composer-head">

                  <div className="sk-avatar">ST</div>

                  <div>

                    <strong>Start a discussion</strong>

                    <span>Share a question, idea, or learning update with your community.</span>

                  </div>

                </div>



                <textarea

                  className="sk-textarea"

                  value={newPost}

                  onChange={(event) => setNewPost(event.target.value)}

                  placeholder="What would you like to share?"

                  rows={3}

                />



                {newPostImagePreview ? (

                  <div className="cm-preview">

                    <img src={newPostImagePreview} alt="Selected post image" />

                    <button

                      type="button"

                      onClick={clearPostImage}

                      aria-label="Remove selected image"

                      title="Remove image"

                    >

                      <X size={14} />

                    </button>

                  </div>

                ) : null}



                <div className="cm-composer-bar">

                  <select

                    className="sk-select cm-topic-select"

                    value={selectedTopic}

                    onChange={(event) => setSelectedTopic(event.target.value)}

                    aria-label="Post topic"

                  >

                    {CREATE_TOPICS.map((topic) => (

                      <option key={topic} value={topic}>

                        {topic}

                      </option>

                    ))}

                  </select>



                  <label className="sk-btn sk-btn-secondary sk-btn-sm cm-attach">

                    <ImageIcon size={14} />

                    Add image

                    <input

                      type="file"

                      accept="image/jpeg,image/png,image/webp,image/gif"

                      onChange={(event) => {

                        handlePostImageChange(event.target.files?.[0] || null);

                        event.currentTarget.value = "";

                      }}

                      style={{ display: "none" }}

                    />

                  </label>



                  <span className="cm-hint">JPG, PNG, WEBP or GIF · max 5 MB</span>



                  <button

                    type="button"

                    onClick={() => void createPost()}

                    disabled={(!newPost.trim() && !newPostImage) || submitting}

                    className="sk-btn sk-btn-primary cm-post-btn"

                  >

                    {submitting ? (

                      <>

                        <RefreshCw size={14} className="sk-spin" />

                        Posting...

                      </>

                    ) : (

                      <>

                        <Send size={14} />

                        Post

                      </>

                    )}

                  </button>

                </div>

              </section>



              {/* Feed heading */}

              <div className="cm-feed-head">

                <div>

                  <h2>Community Feed</h2>

                  <p>

                    {filteredPosts.length} discussion

                    {filteredPosts.length === 1 ? "" : "s"} found

                  </p>

                </div>



                <div className="cm-tabs" role="tablist" aria-label="Feed topics">

                  {FEED_TABS.map((topic) => (

                    <button

                      type="button"

                      role="tab"

                      aria-selected={activeTopic === topic}

                      key={topic}

                      onClick={() => setActiveTopic(topic)}

                      className={`cm-tab${activeTopic === topic ? " is-active" : ""}`}

                    >

                      {topic}

                    </button>

                  ))}

                </div>

              </div>



              {/* Posts */}

              <div className="cm-posts" key={`${activeTopic}-${search}`}>

                {loading ? (

                  <>

                    {[0, 1, 2].map((n) => (

                      <div key={n} className="sk-skel" style={{ height: 150 }} />

                    ))}

                    <span className="sk-sr">Loading community</span>

                  </>

                ) : null}



                {!loading

                  ? filteredPosts.map((post, index) => {

                      const isLiked = likedPosts.includes(post.id);

                      const expanded = expandedPostId === post.id;

                      const comments = commentsByPost[post.id];

                      const isOwner =

                        currentUserId !== null && post.authorId === currentUserId;



                      return (

                        <article

                          key={post.id}

                          id={`post-${post.id}`}

                          className="cm-post sk-reveal"

                          style={reveal(Math.min(index, 8))}

                        >

                          <div className="cm-post-head">

                            <div className="cm-author">

                              <div className={`cm-avatar role-${post.role.toLowerCase()}`}>

                                {getPhotoUrl(post.profilePhotoUrl) ? (

                                  <img

                                    src={getPhotoUrl(post.profilePhotoUrl) as string}

                                    alt={post.author}

                                  />

                                ) : (

                                  post.initials

                                )}

                              </div>



                              <div className="sk-min0">

                                <div className="cm-author-row">

                                  <strong>{post.author}</strong>

                                  <RoleBadge role={post.role} />

                                </div>

                                <span className="cm-time">{post.time}</span>

                              </div>

                            </div>



                            <div className="cm-post-tools">

                              {post.pinned ? (

                                <span className="sk-badge tone-orange">

                                  <Pin size={12} />

                                  Pinned

                                </span>

                              ) : null}



                              {isOwner ? (

                                <div className="cm-menu-wrap">

                                  <button

                                    type="button"

                                    className="cm-menu-btn"

                                    onClick={(event) => {

                                      event.stopPropagation();

                                      setMenuPostId((current) =>

                                        current === post.id ? null : post.id

                                      );

                                    }}

                                    aria-label="Post options"

                                    aria-expanded={menuPostId === post.id}

                                  >

                                    <MoreHorizontal size={18} />

                                  </button>



                                  {menuPostId === post.id ? (

                                    <div

                                      className="cm-menu"

                                      onClick={(event) => event.stopPropagation()}

                                    >

                                      <button

                                        type="button"

                                        onClick={() => {

                                          setMenuPostId(null);

                                          openEdit(post);

                                        }}

                                      >

                                        <Edit3 size={14} /> Edit

                                      </button>

                                      <button

                                        type="button"

                                        className="is-danger"

                                        onClick={() => {

                                          setMenuPostId(null);

                                          setDeletePostId(post.id);

                                        }}

                                      >

                                        <Trash2 size={14} /> Delete

                                      </button>

                                    </div>

                                  ) : null}

                                </div>

                              ) : null}

                            </div>

                          </div>



                          <h3>{post.title}</h3>

                          <p className="cm-content">{post.content}</p>



                          {getPhotoUrl(post.imageUrl) ? (

                            <div className="cm-image">

                              <img

                                src={getPhotoUrl(post.imageUrl) as string}

                                alt="Post attachment"

                              />

                            </div>

                          ) : null}



                          <div className="cm-actions">

                            <button

                              type="button"

                              onClick={() => toggleLike(post.id)}

                              className={`cm-action${isLiked ? " is-liked" : ""}`}

                            >

                              <Heart size={16} fill={isLiked ? "currentColor" : "none"} />

                              {post.likes} Likes

                            </button>



                            <button

                              type="button"

                              onClick={() => void toggleComments(post.id)}

                              className={`cm-action${expanded ? " is-open" : ""}`}

                              aria-expanded={expanded}

                            >

                              <MessageCircle size={16} />

                              {post.replies} Replies

                            </button>

                          </div>



                          <div className={`sk-expand${expanded ? " is-open" : ""}`}>

                            <div className="sk-expand-inner">

                              {expanded || comments ? (

                                <section className="cm-comments">

                                  <div className="cm-comments-head">

                                    <strong>Comments</strong>

                                    <span>{(comments || []).length}</span>

                                  </div>



                                  {commentsLoading === post.id ? (

                                    <div className="cm-muted">

                                      <RefreshCw size={14} className="sk-spin" /> Loading comments...

                                    </div>

                                  ) : (comments || []).length === 0 ? (

                                    <div className="cm-muted">

                                      No comments yet. Be the first to reply.

                                    </div>

                                  ) : (

                                    <div className="cm-comment-list">

                                      {(comments || []).map((comment, commentIndex) => (

                                        <div

                                          key={comment.id}

                                          className="cm-comment"

                                          style={{

                                            animationDelay: `${Math.min(commentIndex, 8) * 40}ms`,

                                          }}

                                        >

                                          <div className="cm-avatar cm-avatar-sm role-student">

                                            {getPhotoUrl(comment.profilePhotoUrl) ? (

                                              <img

                                                src={getPhotoUrl(comment.profilePhotoUrl) as string}

                                                alt={comment.author}

                                              />

                                            ) : (

                                              initialsFor(comment.author)

                                            )}

                                          </div>



                                          <div className="cm-comment-body">

                                            <div className="cm-author-row">

                                              <strong>{comment.author}</strong>

                                              <RoleBadge role={comment.role} />

                                              <span className="cm-time">

                                                {formatTime(comment.createdAt)}

                                              </span>

                                            </div>

                                            <p>{comment.content}</p>

                                          </div>

                                        </div>

                                      ))}

                                    </div>

                                  )}



                                  <div className="cm-reply">

                                    <textarea

                                      className="sk-textarea"

                                      value={commentDrafts[post.id] || ""}

                                      onChange={(event) =>

                                        setCommentDrafts((current) => ({

                                          ...current,

                                          [post.id]: event.target.value,

                                        }))

                                      }

                                      placeholder="Write a reply..."

                                      rows={2}

                                    />

                                    <button

                                      type="button"

                                      onClick={() => void createComment(post.id)}

                                      disabled={

                                        !commentDrafts[post.id]?.trim() ||

                                        commentSubmitting === post.id

                                      }

                                      className="sk-btn sk-btn-primary sk-btn-sm"

                                    >

                                      <Send size={13} />

                                      {commentSubmitting === post.id ? "Replying..." : "Reply"}

                                    </button>

                                  </div>

                                </section>

                              ) : null}

                            </div>

                          </div>

                        </article>

                      );

                    })

                  : null}



                {!loading && filteredPosts.length === 0 ? (

                  <div className="sk-empty">

                    <div className="sk-empty-icon">

                      <MessageCircle size={22} />

                    </div>

                    <strong>No discussions found</strong>

                    <span>Try another search term or choose a different topic.</span>

                    {search || activeTopic !== "All Posts" ? (

                      <button

                        type="button"

                        className="sk-btn sk-btn-secondary"

                        onClick={() => {

                          setSearch("");

                          setActiveTopic("All Posts");

                        }}

                      >

                        Clear Filters

                      </button>

                    ) : null}

                  </div>

                ) : null}

              </div>

            </div>



            {/* Right column */}

            <aside className="cm-side">

              <section className="sk-panel sk-reveal" style={reveal(6)}>

                <div className="sk-panel-head">

                  <div className="sk-icon sk-icon-sm sk-tone-blue">

                    <Sparkles size={17} />

                  </div>

                  <div>

                    <h2 style={{ fontSize: 15 }}>Community Topics</h2>

                    <p>Browse discussions by theme</p>

                  </div>

                </div>



                <div className="cm-topics">

                  {TOPIC_LABELS.map((topicLabel) => {

                    const isActive =

                      topicLabel === "General Discussion"

                        ? activeTopic === "All Posts"

                        : activeTopic === topicLabel;



                    return (

                      <button

                        type="button"

                        key={topicLabel}

                        onClick={() => selectTopic(topicLabel)}

                        className={`cm-topic${isActive ? " is-active" : ""}`}

                      >

                        <span>{topicLabel}</span>

                        <b>{topicCounts[topicLabel] || 0}</b>

                      </button>

                    );

                  })}

                </div>

              </section>



              <section className="sk-panel sk-reveal" style={reveal(7)}>

                <div className="sk-panel-head">

                  <div className="sk-icon sk-icon-sm sk-tone-orange">

                    <Bell size={17} />

                  </div>

                  <div>

                    <h2 style={{ fontSize: 15 }}>Community Guidelines</h2>

                    <p>Keep the learning space useful for everyone</p>

                  </div>

                </div>



                <div className="cm-guides">

                  <Guideline number="01" text="Keep questions clear and constructive." />

                  <Guideline number="02" text="Help other students when you can." />

                  <Guideline number="03" text="Do not share private account details." />

                  <Guideline number="04" text="Keep conversations respectful." />

                </div>

              </section>



              <section className="cm-team sk-reveal" style={reveal(8)}>

                <div className="sk-icon sk-tone-blue">

                  <Megaphone size={18} />

                </div>

                <strong>SKCE Team</strong>

                <p>

                  Announcements and important student updates are shared here by

                  the SKCE team.

                </p>

              </section>

            </aside>

          </section>

        </div>

      </main>



      {editingPost ? (

        <Modal

          onClose={closeEdit}

          maxWidth={580}

          labelledBy="edit-post-title"

          locked={editSubmitting}

        >

          {(close) => (

            <form onSubmit={saveEdit}>

              <div className="sk-modal-head">

                <div>

                  <h2 id="edit-post-title">Edit Post</h2>

                  <p>Update your title, topic or message.</p>

                </div>

                <button

                  type="button"

                  onClick={close}

                  className="sk-modal-close"

                  aria-label="Close"

                  disabled={editSubmitting}

                >

                  <X size={18} />

                </button>

              </div>



              <div className="sk-modal-body">

                <div className="sk-field">

                  <label className="sk-label" htmlFor="edit-title">

                    Title

                  </label>

                  <input

                    id="edit-title"

                    className="sk-input"

                    value={editTitle}

                    onChange={(e) => setEditTitle(e.target.value)}

                    placeholder="Title"

                  />

                </div>



                <div className="sk-field">

                  <label className="sk-label" htmlFor="edit-topic">

                    Topic

                  </label>

                  <select

                    id="edit-topic"

                    className="sk-select"

                    value={editTopic}

                    onChange={(e) => setEditTopic(e.target.value)}

                  >

                    {CREATE_TOPICS.map((topic) => (

                      <option key={topic} value={topic}>

                        {topic}

                      </option>

                    ))}

                  </select>

                </div>



                <div className="sk-field" style={{ marginBottom: 0 }}>

                  <label className="sk-label" htmlFor="edit-content">

                    Message

                  </label>

                  <textarea

                    id="edit-content"

                    className="sk-textarea"

                    value={editContent}

                    onChange={(e) => setEditContent(e.target.value)}

                    rows={6}

                  />

                </div>

              </div>



              <div className="sk-modal-foot">

                <button

                  type="button"

                  onClick={close}

                  disabled={editSubmitting}

                  className="sk-btn sk-btn-secondary"

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  disabled={editSubmitting}

                  className="sk-btn sk-btn-primary"

                >

                  {editSubmitting ? (

                    <>

                      <RefreshCw size={15} className="sk-spin" />

                      Saving...

                    </>

                  ) : (

                    "Save changes"

                  )}

                </button>

              </div>

            </form>

          )}

        </Modal>

      ) : null}



      {deletePostId ? (

        <Modal

          onClose={() => setDeletePostId(null)}

          maxWidth={440}

          labelledBy="delete-post-title"

          locked={deleteSubmitting}

        >

          {(close) => (

            <>

              <div className="sk-modal-body cm-delete">

                <div className="cm-delete-icon">

                  <Trash2 size={22} />

                </div>

                <h2 id="delete-post-title">Delete this post?</h2>

                <p>This action cannot be undone.</p>

              </div>



              <div className="sk-modal-foot">

                <button

                  type="button"

                  onClick={close}

                  disabled={deleteSubmitting}

                  className="sk-btn sk-btn-secondary"

                >

                  Cancel

                </button>

                <button

                  type="button"

                  onClick={() => void confirmDeletePost()}

                  disabled={deleteSubmitting}

                  className="sk-btn sk-btn-danger"

                >

                  {deleteSubmitting ? (

                    <>

                      <RefreshCw size={15} className="sk-spin" />

                      Deleting...

                    </>

                  ) : (

                    "Delete"

                  )}

                </button>

              </div>

            </>

          )}

        </Modal>

      ) : null}



      {toasts.node}

      <SkStyles />

      <style dangerouslySetInnerHTML={{ __html: communityCss }} />

    </>

  );

}



function RoleBadge({ role }: { role: PostRole }) {

  const tone =

    role === "Admin" ? "tone-navy" : role === "Trainer" ? "tone-blue" : "";



  return (

    <span className={`sk-badge ${tone}`} style={{ padding: "2px 8px", fontSize: 11 }}>

      {role}

    </span>

  );

}



function Guideline({ number, text }: { number: string; text: string }) {

  return (

    <div className="cm-guide">

      <span>{number}</span>

      <p>{text}</p>

    </div>

  );

}



const communityCss = `
.cm-hero{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:176px;margin-bottom:20px;padding:30px 32px;overflow:hidden;border:1px solid rgba(255,255,255,.12);border-bottom:3px solid #ff7900;border-radius:22px;background:linear-gradient(112deg,#202334 0%,#153866 54%,#245b9d 100%);box-shadow:0 16px 34px rgba(15,47,95,.13);color:#fff;animation:cm-hero-enter .55s cubic-bezier(.2,.75,.25,1) both}
.cm-hero:before{content:"";position:absolute;z-index:-1;right:-75px;top:-190px;width:370px;height:370px;border:1px solid rgba(255,255,255,.1);border-radius:50%;box-shadow:0 0 0 20px rgba(255,255,255,.025),0 0 0 42px rgba(255,255,255,.025),0 0 0 64px rgba(255,255,255,.02)}
.cm-hero:after{content:"";position:absolute;z-index:-1;inset:0;opacity:.13;background-image:radial-gradient(rgba(255,255,255,.5) .7px,transparent .7px);background-size:22px 22px;mask-image:linear-gradient(90deg,transparent,#000 55%,#000)}
.cm-hero-copy{display:flex;align-items:center;gap:20px;min-width:0}
.cm-hero-icon{display:grid;place-items:center;flex:0 0 66px;width:66px;height:66px;border:1px solid rgba(255,255,255,.24);border-radius:18px;background:rgba(255,255,255,.13);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.12);transition:transform .25s ease,background .25s ease}
.cm-hero:hover .cm-hero-icon{transform:translateY(-2px) rotate(-3deg);background:rgba(255,255,255,.19)}
.cm-hero-text{min-width:0}
.cm-hero .sk-kicker{margin:0 0 9px;color:#ff9a3d;font-weight:800;letter-spacing:.09em;text-transform:none}
.cm-hero h1{margin:0;color:#fff;font-size:clamp(28px,2.3vw,36px);line-height:1.15;font-weight:800;letter-spacing:-.035em}
.cm-hero p{max-width:720px;margin:10px 0 0;color:rgba(239,245,255,.84);font-size:15px;line-height:1.65}
.cm-search{position:relative;z-index:1;width:min(320px,34%);flex:0 0 auto;min-height:46px;border:1px solid rgba(255,255,255,.28)!important;border-radius:12px!important;background:rgba(255,255,255,.12)!important;color:#fff!important;backdrop-filter:blur(8px);transition:border-color .2s ease,background .2s ease,box-shadow .2s ease}
.cm-search:focus-within{border-color:rgba(255,255,255,.68)!important;background:rgba(255,255,255,.17)!important;box-shadow:0 0 0 3px rgba(255,255,255,.08)}
.cm-search>svg{color:rgba(255,255,255,.78)}
.cm-search input{min-width:0;color:#fff!important}
.cm-search input::placeholder{color:rgba(239,245,255,.7)!important}
.cm-clear{background:rgba(255,255,255,.16)!important;color:#fff!important}
.cm-clear:hover{background:rgba(255,255,255,.26)!important}
@keyframes cm-hero-enter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@media (max-width:900px){.cm-hero{align-items:flex-start;flex-direction:column;padding:26px}.cm-search{width:100%;max-width:none}.cm-hero-copy{align-items:flex-start}}
@media (max-width:560px){.cm-hero{min-height:0;padding:22px 18px;border-radius:17px}.cm-hero-copy{gap:13px}.cm-hero-icon{flex-basis:48px;width:48px;height:48px;border-radius:13px}.cm-hero-icon svg{width:21px;height:21px}.cm-hero h1{font-size:27px}.cm-hero p{font-size:13px;margin-top:8px}}

.cm-search{width:290px;flex:0 0 auto}

.cm-clear{display:flex;align-items:center;justify-content:center;width:22px;height:22px;border:0;border-radius:50%;background:var(--line-2);color:var(--muted);cursor:pointer}

.cm-clear:hover{background:#D9E3F2}

.cm-layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,.7fr);gap:14px;align-items:start}

.cm-side{display:flex;flex-direction:column;gap:12px;min-width:0}

.cm-pinned{margin-bottom:12px;padding:14px 16px;border:1px solid #CFE0FA;border-left:4px solid #FF7900;border-radius:16px;background:linear-gradient(120deg,#F2F7FF 0%,#FFFFFF 72%,#FFF8F1 100%);transition:transform .3s var(--ease),box-shadow .3s ease}

.cm-pinned:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(15,47,95,.10)}

.cm-pinned-top{display:flex;align-items:center;justify-content:space-between;gap:10px}

.cm-pinned-label{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--orange-2)}

.cm-pinned h2{margin:12px 0 6px;font-size:18px;line-height:1.35;font-weight:700;color:var(--navy)}

.cm-pinned p{margin:0;font-size:14px;line-height:1.65;color:var(--muted)}

.cm-pinned-foot{display:flex;gap:16px;margin-top:12px;font-size:12.5px;color:var(--muted)}

.cm-image{display:table;width:fit-content;max-width:min(100%,520px);margin-top:12px;overflow:hidden;border:1px solid #D8E4F5;border-radius:12px;background:linear-gradient(135deg,#F3F7FD,#FFFFFF);box-shadow:0 3px 10px rgba(15,47,95,.04)}

.cm-image img{display:block;width:auto;max-width:100%;max-height:260px;object-fit:contain;transition:transform .35s var(--ease)}

.cm-post:hover .cm-image img{transform:scale(1.01)}

.cm-composer{margin-bottom:14px}

.cm-composer-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}

.cm-composer-head strong{display:block;font-size:15px;color:var(--navy)}

.cm-composer-head span{display:block;margin-top:2px;font-size:12.5px;color:var(--muted)}

.cm-preview{position:relative;width:fit-content;max-width:100%;margin-top:12px;overflow:hidden;border:1px solid var(--line);border-radius:12px;animation:sk-pop .35s var(--ease) both}

.cm-preview img{display:block;width:min(360px,100%);max-height:220px;object-fit:cover}

.cm-preview button{position:absolute;top:8px;right:8px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:0;border-radius:50%;background:rgba(15,47,95,.8);color:#fff;cursor:pointer;transition:transform .25s var(--ease),background .2s ease}

.cm-preview button:hover{transform:rotate(90deg);background:var(--red)}

.cm-composer-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px}

.cm-topic-select{width:auto;min-width:200px;height:36px;font-size:13px}

.cm-attach input{display:none}

.cm-hint{font-size:12px;color:var(--soft)}

.cm-post-btn{margin-left:auto}

.cm-respect{margin:10px 0 0;font-size:12px;color:var(--soft)}

.cm-feed-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:12px}

.cm-feed-head h2{margin:0;font-size:20px;font-weight:700;color:var(--navy)}

.cm-feed-head p{margin:3px 0 0;font-size:13px;color:var(--muted)}

.cm-tabs{display:flex;flex-wrap:wrap;gap:6px}

.cm-tab{height:34px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--muted);font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s ease,color .2s ease,border-color .2s ease,transform .2s var(--ease),box-shadow .2s ease}

.cm-tab:hover{border-color:#BFD3F2;color:var(--blue);transform:translateY(-1px)}

.cm-tab.is-active{background:var(--blue);border-color:var(--blue);color:#fff;box-shadow:0 6px 14px rgba(20,89,184,.25)}

.cm-posts{display:flex;flex-direction:column;gap:12px}

.cm-post{position:relative;min-width:0;padding:14px 16px 12px 19px;border:1px solid #DCE6F4;border-left:4px solid #1D5FC2;border-radius:15px;background:linear-gradient(115deg,#F5F9FF 0%,#FFFFFF 48%);box-shadow:0 2px 6px rgba(15,47,95,.045);transition:transform .25s var(--ease),box-shadow .25s ease,border-color .25s ease,background .25s ease;scroll-margin-top:90px;animation:cm-post-enter .38s var(--ease) both}

.cm-post:hover{transform:translateY(-2px);border-color:#A9C6F0;box-shadow:0 10px 22px rgba(15,47,95,.09)}
.cm-post:nth-child(4n + 2){border-left-color:#FF7900;background:linear-gradient(115deg,#FFF8F1 0%,#FFFFFF 48%)}
.cm-post:nth-child(4n + 3){border-left-color:#153866;background:linear-gradient(115deg,#F1F5FB 0%,#FFFFFF 48%)}
.cm-post:nth-child(4n + 4){border-left-color:#2F73C8;background:linear-gradient(115deg,#F2F8FF 0%,#FFFFFF 48%)}
@keyframes cm-post-enter{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.cm-post-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}

.cm-author{display:flex;align-items:center;gap:12px;min-width:0}

.cm-avatar{width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:50%;font-size:13px;font-weight:700}

.cm-avatar img{width:100%;height:100%;object-fit:cover;display:block}

.cm-avatar-sm{width:32px;height:32px;flex-basis:32px;font-size:11px}

.role-admin{background:var(--navy);color:#fff}

.role-trainer{background:var(--blue-tint);color:var(--blue)}

.role-student{background:#EDF1F7;color:var(--muted)}

.cm-author-row{display:flex;align-items:center;flex-wrap:wrap;gap:8px}

.cm-author-row strong{font-size:14px;color:var(--navy)}

.cm-time{display:block;margin-top:2px;font-size:12px;color:var(--soft)}

.cm-author-row .cm-time{display:inline;margin:0}

.cm-post-tools{display:flex;align-items:center;gap:8px;flex:0 0 auto}

.cm-menu-wrap{position:relative}

.cm-menu-btn{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:0;border-radius:9px;background:transparent;color:var(--muted);cursor:pointer;transition:background .2s ease,color .2s ease}

.cm-menu-btn:hover,.cm-menu-btn[aria-expanded="true"]{background:var(--blue-tint);color:var(--blue)}

.cm-menu{position:absolute;right:0;top:40px;z-index:30;width:140px;padding:5px;border:1px solid var(--line);border-radius:12px;background:#fff;box-shadow:0 14px 32px rgba(15,47,95,.18);animation:sk-modal-in .2s var(--ease) both;transform-origin:top right}

.cm-menu button{display:flex;align-items:center;gap:8px;width:100%;padding:9px 10px;border:0;border-radius:8px;background:transparent;color:var(--navy);font:inherit;font-size:13px;cursor:pointer;text-align:left;transition:background .15s ease}

.cm-menu button:hover{background:var(--blue-tint)}

.cm-menu button.is-danger{color:var(--red)}

.cm-menu button.is-danger:hover{background:var(--red-tint)}

.cm-post h3{margin:11px 0 5px;font-size:16px;line-height:1.4;font-weight:750;color:var(--navy);word-break:break-word}

.cm-content{margin:0;font-size:13.5px;line-height:1.65;color:#5F7190;white-space:pre-wrap;overflow-wrap:anywhere}

.cm-actions{display:flex;align-items:center;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line-2)}

.cm-action{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 12px;border:0;border-radius:10px;background:transparent;color:var(--muted);font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s ease,color .2s ease,transform .2s var(--ease)}

.cm-action:hover{background:var(--blue-tint);color:var(--blue)}

.cm-action:active{transform:scale(.95)}

.cm-action.is-liked{color:var(--orange)}

.cm-action.is-liked:hover{background:var(--orange-tint)}

.cm-action.is-liked svg{animation:sk-pop .4s var(--ease) both}

.cm-action.is-open{background:var(--blue-tint);color:var(--blue)}

.cm-comments{margin-top:14px;padding-top:14px;border-top:1px solid var(--line-2)}

.cm-comments-head{display:flex;align-items:center;gap:8px;margin-bottom:12px}

.cm-comments-head strong{font-size:14px;color:var(--navy)}

.cm-comments-head span{min-width:22px;height:22px;padding:0 7px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:var(--line-2);color:var(--muted);font-size:12px;font-weight:700}

.cm-muted{display:flex;align-items:center;gap:8px;padding:6px 0 14px;font-size:13px;color:var(--soft)}

.cm-comment-list{display:grid;gap:12px;margin-bottom:14px}

.cm-comment{display:flex;gap:10px;animation:sk-swap .35s var(--ease) both}

.cm-comment-body{min-width:0;flex:1;padding:10px 12px;border-radius:12px;background:#F8FAFD;transition:background .2s ease}

.cm-comment:hover .cm-comment-body{background:var(--blue-tint)}

.cm-comment-body p{margin:5px 0 0;font-size:13.5px;line-height:1.6;color:var(--muted);white-space:pre-wrap;overflow-wrap:anywhere}

.cm-reply{display:flex;align-items:flex-end;gap:10px}

.cm-reply .sk-textarea{flex:1;min-height:62px}

.cm-topics{display:flex;flex-direction:column;gap:6px}

.cm-topic{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:11px 12px;border:1px solid var(--line-2);border-radius:11px;background:#FBFCFE;color:var(--muted);font:inherit;font-size:13.5px;text-align:left;cursor:pointer;transition:background .2s ease,border-color .2s ease,color .2s ease,transform .2s var(--ease)}

.cm-topic:hover{border-color:#9DBBEA;color:var(--blue);transform:translateX(4px)}

.cm-topic b{min-width:26px;padding:3px 7px;border-radius:999px;background:var(--blue-tint);color:var(--blue);font-size:12px;text-align:center}

.cm-topic.is-active{border-color:var(--blue-2);background:var(--blue-tint);color:var(--blue);font-weight:600}

.cm-topic.is-active b{background:var(--blue);color:#fff}

.cm-guides{display:flex;flex-direction:column;gap:6px}

.cm-guide{display:flex;align-items:flex-start;gap:10px;padding:8px;margin:0 -8px;border-radius:9px;transition:background .2s ease}

.cm-guide:hover{background:#F5F8FD}

.cm-guide span{width:26px;height:26px;flex:0 0 26px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:var(--orange-tint);color:var(--orange-2);font-size:11px;font-weight:700}

.cm-guide p{margin:4px 0 0;font-size:13px;line-height:1.5;color:var(--muted)}

.cm-team{padding:14px 16px;border:1px solid #CFE0FA;border-radius:16px;background:linear-gradient(135deg,#F5F9FF,#fff);transition:transform .3s var(--ease),box-shadow .3s ease}

.cm-team:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(15,47,95,.1)}

.cm-team .sk-icon{margin-bottom:10px}

.cm-team strong{display:block;font-size:15px;color:var(--navy)}

.cm-team p{margin:5px 0 0;font-size:13px;line-height:1.55;color:var(--muted)}

.cm-delete{text-align:center;padding:30px 24px 14px}

.cm-delete-icon{width:52px;height:52px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;border-radius:14px;background:var(--red-tint);color:var(--red);animation:sk-pop .4s var(--ease) both}

.cm-delete h2{margin:0;font-size:19px;color:var(--navy)}

.cm-delete p{margin:8px 0 0;font-size:14px;color:var(--muted)}

@media (max-width:1050px){.cm-layout{grid-template-columns:minmax(0,1fr)}}

@media (max-width:760px){

  .cm-search{width:100%}

  .cm-post-btn{margin-left:0;width:100%}

  .cm-topic-select{width:100%}

  .cm-reply{flex-direction:column;align-items:stretch}

}

@media (prefers-reduced-motion:reduce){.cm-hero,.cm-post{animation:none!important}.cm-comment,.cm-menu,.cm-preview,.cm-action.is-liked svg,.cm-delete-icon{animation:none!important}.cm-post,.cm-pinned,.cm-team,.cm-topic{transition:none!important}}

`;
