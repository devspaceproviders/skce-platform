"use client";

import {

  Bell,

  BookOpen,

  Check,

  Edit3,

  Heart,

  ImageIcon,

  Loader2,

  MessageCircle,

  MoreHorizontal,

  Pin,

  Search,

  Send,

  Sparkles,

  Trash2,

  Users,

  X,

} from "lucide-react";

import {

  useEffect,

  useMemo,

  useState,

  type FormEvent,

  type ReactNode,

} from "react";

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

  liked: boolean;

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

const TOPICS = [

  "General Discussion",

  "Announcements",

  "Questions & Help",

  "Learning Tips",

];

const CREATE_TOPICS = [

  "General Discussion",

  "Questions & Help",

  "Learning Tips",

];

const API_URL =

  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getPhotoUrl(photoUrl?: string | null) {

  if (!photoUrl) return null;

  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;

  const backendUrl = API_URL.replace(/\/api\/?$/, "");

  return `${backendUrl}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;

}

export default function TrainerCommunityPage() {

  const [posts, setPosts] = useState<CommunityPost[]>([]);

  const [communityMembers, setCommunityMembers] = useState(0);

  const [search, setSearch] = useState("");

  const [activeTopic, setActiveTopic] = useState("All Posts");

  const [newPost, setNewPost] = useState("");

  const [newPostImage, setNewPostImage] = useState<File | null>(null);

  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);

  const [selectedTopic, setSelectedTopic] =

    useState("General Discussion");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [trainerInitials, setTrainerInitials] = useState("TR");

  const [expandedPostId, setExpandedPostId] =

    useState<number | null>(null);

  const [commentsByPost, setCommentsByPost] =

    useState<Record<number, CommunityComment[]>>({});

  const [commentsLoading, setCommentsLoading] =

    useState<number | null>(null);

  const [commentDrafts, setCommentDrafts] =

    useState<Record<number, string>>({});

  const [commentSubmitting, setCommentSubmitting] =

    useState<number | null>(null);

  const [editingPost, setEditingPost] =

    useState<CommunityPost | null>(null);

  const [editTitle, setEditTitle] = useState("");

  const [editContent, setEditContent] = useState("");

  const [editTopic, setEditTopic] =

    useState("General Discussion");

  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deletePostId, setDeletePostId] =

    useState<number | null>(null);

  const [deleteSubmitting, setDeleteSubmitting] =

    useState(false);

  const [deleteCommentId, setDeleteCommentId] =

    useState<number | null>(null);

  const [deleteCommentSubmitting, setDeleteCommentSubmitting] =

    useState(false);

  function handlePostImageChange(file?: File) {

    if (!file) return;

    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

    if (!allowed.has(file.type)) {

      setError("Only JPG, PNG, WEBP, and GIF images are allowed.");

      return;

    }

    if (file.size > 5 * 1024 * 1024) {

      setError("Image size must be 5 MB or less.");

      return;

    }

    setError("");

    if (newPostImagePreview) URL.revokeObjectURL(newPostImagePreview);

    setNewPostImage(file);

    setNewPostImagePreview(URL.createObjectURL(file));

  }

  function clearPostImage() {

    if (newPostImagePreview) URL.revokeObjectURL(newPostImagePreview);

    setNewPostImage(null);

    setNewPostImagePreview(null);

  }

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

      const user = JSON.parse(raw) as {

        id?: number;

        userId?: number;

      };

      const id = Number(user.id ?? user.userId);

      return Number.isInteger(id) && id > 0 ? id : null;

    } catch {

      return null;

    }

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

  async function authenticatedFetch(

    path: string,

    options: RequestInit = {}

  ) {

    const token = getToken();

    if (!token) {

      clearAuthAndRedirect();

      throw new Error("Authentication required");

    }

    const response = await fetch(`${API_URL}${path}`, {

      ...options,

      headers: {

        ...(options.headers || {}),

        Authorization: `Bearer ${token}`,

        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),

      },

      cache: "no-store",

    });

    if (response.status === 401 || response.status === 403) {

      clearAuthAndRedirect();

      throw new Error("Authentication required");

    }

    return response;

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

    if (hours < 24)

      return `${hours} hour${hours === 1 ? "" : "s"} ago`;

    if (days < 7)

      return `${days} day${days === 1 ? "" : "s"} ago`;

    return date.toLocaleDateString();

  }

  function mapPost(row: any): CommunityPost {

    const author = String(row?.author || "SKCE User");

    return {

      id: Number(row?.id),

      authorId: Number(row?.authorId || 0),

      author,

      role: normalizeRole(String(row?.role || "STUDENT")),

      initials: initialsFor(author),

      time: formatTime(row?.createdAt || row?.time),

      title: String(row?.title || "Community Post"),

      content: String(row?.content || ""),

      topic: String(row?.topic || "General Discussion"),

      likes: Number(row?.likes || 0),

      replies: Number(row?.replies || 0),

      pinned: Boolean(row?.pinned ?? row?.isPinned),

      liked: Boolean(row?.liked ?? row?.likedByCurrentUser ?? row?.isLiked),

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

  useEffect(() => {

    try {

      const raw = localStorage.getItem("user");

      if (!raw) {

        return;

      }

      const user = JSON.parse(raw) as {

        name?: string;

      };

      const name = user.name?.trim();

      if (!name) {

        return;

      }

      const initials = name

        .split(/\s+/)

        .filter(Boolean)

        .slice(0, 2)

        .map((part) => part.charAt(0).toUpperCase())

        .join("");

      if (initials) {

        setTrainerInitials(initials);

      }

    } catch {

      // Keep the SSR-safe fallback initials.

    }

  }, []);

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

      const response = await authenticatedFetch(

        "/community/posts"

      );

      const result = await response.json();

      if (!response.ok || !result?.success) {

        throw new Error(

          result?.message ||

            "Unable to load community posts."

        );

      }

      const rows = Array.isArray(result.data)

        ? result.data

        : [];

      setPosts(rows.map(mapPost));

    } catch (err) {

      console.error(

        "Failed to load trainer community posts:",

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

          : "Unable to load community posts."

      );

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {

    void Promise.all([

      loadPosts(),

      loadCommunityStats(),

    ]);

  }, []);

  async function createPost() {

    const content = newPost.trim();

    if ((!content && !newPostImage) || submitting) return;

    try {

      setSubmitting(true);

      setError("");

      const title = content

        ? content.length > 80

          ? `${content.slice(0, 77)}...`

          : content

        : "Community Image Post";

      const formData = new FormData();

      formData.append("title", title);

      formData.append("content", content || "");

      formData.append("topic", selectedTopic);

      if (newPostImage) {

        formData.append("image", newPostImage);

      }

      const response = await authenticatedFetch(

        "/community/posts",

        {

          method: "POST",

          body: formData,

        }

      );

      const result = await response.json();

      if (!response.ok || !result?.success) {

        throw new Error(

          result?.message ||

            "Unable to create the post."

        );

      }

      setNewPost("");

      clearPostImage();

      setSelectedTopic("General Discussion");

      await loadPosts();

    } catch (err) {

      console.error(

        "Failed to create community post:",

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

          : "Unable to create the post."

      );

    } finally {

      setSubmitting(false);

    }

  }

  async function toggleLike(post: CommunityPost) {

    try {

      setError("");

      const response = await authenticatedFetch(

        `/community/posts/${post.id}/like`,

        {

          method: post.liked ? "DELETE" : "POST",

        }

      );

      const result = await response.json();

      if (!response.ok || !result?.success) {

        throw new Error(

          result?.message ||

            "Unable to update the like."

        );

      }

      await loadPosts();

    } catch (err) {

      console.error(

        "Failed to update community like:",

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

          : "Unable to update the like."

      );

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

      const response = await authenticatedFetch(

        `/community/posts/${postId}/comments`

      );

      const result = await response.json();

      if (!response.ok || !result?.success) {

        throw new Error(

          result?.message || "Unable to load comments."

        );

      }

      const rows = Array.isArray(result.data)

        ? result.data

        : [];

      setCommentsByPost((current) => ({

        ...current,

        [postId]: rows.map(mapComment),

      }));

    } catch (err) {

      console.error(

        "Failed to load community comments:",

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

          : "Unable to load comments."

      );

    } finally {

      setCommentsLoading(null);

    }

  }

  async function createComment(postId: number) {

    const content = (

      commentDrafts[postId] || ""

    ).trim();

    if (!content || commentSubmitting === postId) {

      return;

    }

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

        throw new Error(

          result?.message || "Unable to add comment."

        );

      }

      setCommentDrafts((current) => ({

        ...current,

        [postId]: "",

      }));

      await loadComments(postId);

      await loadPosts();

    } catch (err) {

      console.error(

        "Failed to create community comment:",

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

          : "Unable to add comment."

      );

    } finally {

      setCommentSubmitting(null);

    }

  }

  async function loadComments(postId: number) {

    const response = await authenticatedFetch(

      `/community/posts/${postId}/comments`

    );

    const result = await response.json();

    if (!response.ok || !result?.success) {

      throw new Error(

        result?.message || "Unable to load comments."

      );

    }

    const rows = Array.isArray(result.data)

      ? result.data

      : [];

    setCommentsByPost((current) => ({

      ...current,

      [postId]: rows.map(mapComment),

    }));

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

          body: JSON.stringify({

            title,

            content,

            topic: editTopic,

          }),

        }

      );

      const result = await response.json();

      if (!response.ok || !result?.success) {

        throw new Error(

          result?.message || "Unable to update the post."

        );

      }

      closeEdit();

      await loadPosts();

    } catch (err) {

      console.error(

        "Failed to update community post:",

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

          : "Unable to update the post."

      );

    } finally {

      setEditSubmitting(false);

    }

  }

  async function confirmDeletePost() {

    if (!deletePostId || deleteSubmitting) return;

    try {

      setDeleteSubmitting(true);

      setError("");

      const response = await authenticatedFetch(

        `/community/posts/${deletePostId}`,

        { method: "DELETE" }

      );

      const result = await response.json();

      if (!response.ok || !result?.success) {

        throw new Error(

          result?.message ||

            "Unable to delete the post."

        );

      }

      setDeletePostId(null);

      if (expandedPostId === deletePostId) {

        setExpandedPostId(null);

      }

      await loadPosts();

    } catch (err) {

      console.error(

        "Failed to delete community post:",

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

          : "Unable to delete the post."

      );

    } finally {

      setDeleteSubmitting(false);

    }

  }

  async function confirmDeleteComment(

    postId: number

  ) {

    if (

      !deleteCommentId ||

      deleteCommentSubmitting

    ) {

      return;

    }

    try {

      setDeleteCommentSubmitting(true);

      setError("");

      const response = await authenticatedFetch(

        `/community/comments/${deleteCommentId}`,

        { method: "DELETE" }

      );

      const result = await response.json();

      if (!response.ok || !result?.success) {

        throw new Error(

          result?.message ||

            "Unable to delete the comment."

        );

      }

      setDeleteCommentId(null);

      await loadComments(postId);

      await loadPosts();

    } catch (err) {

      console.error(

        "Failed to delete community comment:",

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

          : "Unable to delete the comment."

      );

    } finally {

      setDeleteCommentSubmitting(false);

    }

  }

  const currentUserId = getCurrentUserId();

  const filteredPosts = useMemo(() => {

    const query = search.trim().toLowerCase();

    return posts.filter((post) => {

      const matchesSearch =

        !query ||

        post.title.toLowerCase().includes(query) ||

        post.content.toLowerCase().includes(query) ||

        post.author.toLowerCase().includes(query);

      const matchesTopic =

        activeTopic === "All Posts" ||

        post.topic === activeTopic;

      return matchesSearch && matchesTopic;

    });

  }, [activeTopic, posts, search]);

  const pinnedPost = posts.find((post) => post.pinned);

  const topicCounts = TOPICS.reduce<

    Record<string, number>

  >((result, topic) => {

    result[topic] = posts.filter(

      (post) => post.topic === topic

    ).length;

    return result;

  }, {});

  return (

    <>

      <main className="trainer-community-page min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-[1500px]">
               <section className="tc-hero mb-7 rounded-2xl bg-[#173B67] p-6 text-white shadow-sm sm:p-8 lg:p-10">
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "32px" }}>
                     <div style={{ flex: "1 1 420px", minWidth: 0, maxWidth: "720px", textAlign: "left" }}>
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-200">
                           <BookOpen size={18} />
                           <span>Trainer Portal</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ textAlign: "left" }}>Community</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base" style={{ textAlign: "left" }}>
                           Connect with students, trainers and the SKCE team. Share knowledge, answer questions, and support the learning community.
                        </p>
                     </div>
                     <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 px-5 py-4" style={{ flex: "0 1 320px", minWidth: "260px", boxSizing: "border-box" }}>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-200"><Users size={22} /></div>
                        <div style={{ minWidth: 0, textAlign: "left" }}>
                           <p className="text-xs font-medium text-blue-100" style={{ textAlign: "left" }}>Community discussions</p>
                           <p className="mt-1 text-2xl font-bold" style={{ textAlign: "left" }}>{posts.length}</p>
                           <p className="mt-0.5 text-xs text-blue-100/80" style={{ textAlign: "left" }}>Shared conversations</p>
                        </div>
                     </div>
                  </div>
               </section>
               {error ? (

            <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

              <p>{error}</p>

              <button

                type="button"

                onClick={() => setError("")}

                className="shrink-0 rounded-md p-1 hover:bg-red-100"

              >

                <X size={16} />

              </button>

            </div>

          ) : null}

          <section className="tc-stats mb-7 grid grid-cols-1 gap-4 md:grid-cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "16px", width: "100%", alignItems: "stretch" }}>

            <StatCard

              icon={Users}

              label="Community Members"

              value={String(communityMembers)}

              description="Students, trainers and staff"

              iconClass="bg-blue-50 text-blue-600"

            />

            <StatCard

              icon={MessageCircle}

              label="Discussions"

              value={String(posts.length)}

              description="Questions and conversations"

              iconClass="bg-rose-50 text-rose-600"

            />

            <StatCard

              icon={Bell}

              label="Announcements"

              value={String(

                topicCounts["Announcements"] || 0

              )}

              description="Updates from the SKCE team"

              iconClass="bg-orange-50 text-orange-600"

            />

          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

            <div className="min-w-0">

              {pinnedPost ? (

                <section className="tc-pinned mb-6 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">

                  <div className="mb-3 flex items-center justify-between gap-3">

                    <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">

                      <Pin size={13} />

                      Pinned by SKCE

                    </span>

                    <span className="text-xs text-slate-400">

                      {pinnedPost.topic}

                    </span>

                  </div>

                  <h2 className="text-lg font-bold text-slate-900">

                    {pinnedPost.title}

                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">

                    {pinnedPost.content}

                  </p>

                  {pinnedPost.imageUrl ? (

                    <div className="tc-post-image tc-pinned-image mt-4 overflow-hidden rounded-xl border border-orange-200 bg-white">

                      <img

                        src={getPhotoUrl(pinnedPost.imageUrl) as string}

                        alt="Pinned post attachment"

                        className="mx-auto block max-h-[260px] w-full object-contain"

                      />

                    </div>

                  ) : null}

                </section>

              ) : null}

              <section className="tc-composer mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">

                <div className="mb-4 flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F97316] text-sm font-bold text-white">

                    {trainerInitials}

                  </div>

                  <div>

                    <h2 className="text-base font-bold text-slate-900">

                      Start a discussion

                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">

                      Share a question, teaching tip, or

                      learning update with the community.

                    </p>

                  </div>

                </div>

                <textarea

                  value={newPost}

                  onChange={(event) =>

                    setNewPost(event.target.value)

                  }

                  placeholder="What would you like to share?"

                  rows={4}

                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10"

                />

                <div className="mt-3 flex flex-wrap items-center gap-2">

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">

                    <ImageIcon size={15} /> Add image

                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => handlePostImageChange(event.target.files?.[0])} />

                  </label>

                  {newPostImagePreview ? <button type="button" onClick={clearPostImage} className="rounded-lg px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Remove</button> : null}

                </div>

                {newPostImagePreview ? (

                  <div className="tc-preview-image relative mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

                    <img src={newPostImagePreview} alt="Selected attachment preview" className="max-h-56 w-full object-contain" />

                    <button type="button" onClick={clearPostImage} className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"><X size={15} /></button>

                  </div>

                ) : null}

                <div className="mt-3">

                  <select

                    value={selectedTopic}

                    onChange={(event) => setSelectedTopic(event.target.value)}

                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-orange-500 sm:w-auto"

                  >

                    {CREATE_TOPICS.map((topic) => (

                      <option key={topic} value={topic}>{topic}</option>

                    ))}

                  </select>

                </div>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 sm:w-auto">General Discussion</div>

                  <button

                    type="button"

                    onClick={createPost}

                    disabled={

                      (!newPost.trim() && !newPostImage) || submitting

                    }

                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-50"

                  >

                    {submitting ? (

                      <Loader2

                        size={16}

                        className="animate-spin"

                      />

                    ) : (

                      <Send size={16} />

                    )}

                    {submitting ? "Posting..." : "Post"}

                  </button>

                </div>

              </section>

              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">

                    Community Feed

                  </h2>

                  <p className="mt-1 text-xs text-slate-500">

                    {filteredPosts.length}{" "}

                    {filteredPosts.length === 1

                      ? "discussion"

                      : "discussions"}{" "}

                    found

                  </p>

                </div>

                <div className="flex flex-wrap gap-2">

                  {[

                    "All Posts",

                    ...TOPICS,

                  ].map((topic) => (

                    <button

                      key={topic}

                      type="button"

                      onClick={() =>

                        setActiveTopic(topic)

                      }

                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${

                        activeTopic === topic

                          ? "bg-[#F97316] text-white shadow-sm"

                          : "border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-[#F97316]"

                      }`}

                    >

                      {topic}

                    </button>

                  ))}

                </div>

              </div>

              {loading ? (

                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">

                  <div className="text-center">

                    <Loader2

                      size={30}

                      className="mx-auto animate-spin text-[#F97316]"

                    />

                    <p className="mt-3 text-sm text-slate-500">

                      Loading community...

                    </p>

                  </div>

                </div>

              ) : filteredPosts.length === 0 ? (

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">

                    <MessageCircle size={22} />

                  </div>

                  <h3 className="mt-4 font-bold text-slate-800">

                    No discussions found

                  </h3>

                  <p className="mt-1 text-sm text-slate-500">

                    Try another search or topic.

                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {filteredPosts.map((post) => {

                    const isOwner =

                      currentUserId !== null &&

                      post.authorId === currentUserId;

                    return (

                      <article

                        key={post.id}

                        className="tc-post rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"

                      >

                        <div className="flex items-start justify-between gap-4">

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-600">

                              {getPhotoUrl(post.profilePhotoUrl) ? (

                                <img

                                  src={getPhotoUrl(post.profilePhotoUrl) as string}

                                  alt={post.author}

                                  className="h-full w-full object-cover"

                                />

                              ) : (

                                post.initials

                              )}

                            </div>

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="truncate text-sm font-bold text-slate-900">

                                  {post.author}

                                </span>

                                <RoleBadge role={post.role} />

                              </div>

                              <p className="mt-0.5 text-xs text-slate-400">

                                {post.time}

                                {" · "}

                                {post.topic}

                              </p>

                            </div>

                          </div>

                          {isOwner ? (

                            <div className="relative">

                              <details className="group">

                                <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">

                                  <MoreHorizontal size={18} />

                                </summary>

                                <div className="absolute right-0 top-9 z-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg">

                                  <button

                                    type="button"

                                    onClick={() =>

                                      openEdit(post)

                                    }

                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"

                                  >

                                    <Edit3 size={14} />

                                    Edit

                                  </button>

                                  <button

                                    type="button"

                                    onClick={() =>

                                      setDeletePostId(

                                        post.id

                                      )

                                    }

                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"

                                  >

                                    <Trash2 size={14} />

                                    Delete

                                  </button>

                                </div>

                              </details>

                            </div>

                          ) : null}

                        </div>

                        <div className="mt-4">

                          <h3 className="text-base font-bold text-slate-900">

                            {post.title}

                          </h3>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">

                            {post.content}

                          </p>

                          {post.imageUrl ? (

                            <div className="tc-post-image mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

                              <img

                                src={getPhotoUrl(post.imageUrl) as string}

                                alt="Community post attachment"

                                className="mx-auto block max-h-[360px] w-full object-contain"

                              />

                            </div>

                          ) : null}

                        </div>

                        <div className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-3">

                          <button

                            type="button"

                            onClick={() =>

                              toggleLike(post)

                            }

                            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition ${

                              post.liked

                                ? "text-rose-600"

                                : "text-slate-500 hover:text-rose-600"

                            }`}

                          >

                            <Heart

                              size={16}

                              fill={

                                post.liked

                                  ? "currentColor"

                                  : "none"

                              }

                            />

                            {post.likes}{" "}

                            {post.likes === 1

                              ? "Like"

                              : "Likes"}

                          </button>

                          <button

                            type="button"

                            onClick={() =>

                              toggleComments(post.id)

                            }

                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#F97316]"

                          >

                            <MessageCircle size={16} />

                            {post.replies}{" "}

                            {post.replies === 1

                              ? "Reply"

                              : "Replies"}

                          </button>

                        </div>

                        {expandedPostId === post.id ? (

                          <CommentsSection

                            comments={

                              commentsByPost[post.id] ||

                              []

                            }

                            loading={

                              commentsLoading === post.id

                            }

                            draft={

                              commentDrafts[post.id] || ""

                            }

                            submitting={

                              commentSubmitting ===

                              post.id

                            }

                            currentUserId={

                              currentUserId

                            }

                            onDraftChange={(value) =>

                              setCommentDrafts(

                                (current) => ({

                                  ...current,

                                  [post.id]: value,

                                })

                              )

                            }

                            onSubmit={() =>

                              createComment(post.id)

                            }

                            onDelete={(commentId) =>

                              setDeleteCommentId(

                                commentId

                              )

                            }

                          />

                        ) : null}

                      </article>

                    );

                  })}

                </div>

              )}

            </div>

            <aside className="tc-sidebar space-y-5">

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">

                <SideHeading

                  icon={Search}

                  title="Find Discussions"

                  subtitle="Search the community feed"

                />

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">

                  <Search

                    size={16}

                    className="shrink-0 text-slate-400"

                  />

                  <input

                    value={search}

                    onChange={(event) =>

                      setSearch(event.target.value)

                    }

                    placeholder="Search discussions..."

                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"

                  />

                </div>

              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">

                <SideHeading

                  icon={Sparkles}

                  title="Community Topics"

                  subtitle="Browse discussions by theme"

                />

                <div className="mt-4 space-y-2">

                  <TopicButton

                    label="All Posts"

                    count={posts.length}

                    active={activeTopic === "All Posts"}

                    onClick={() =>

                      setActiveTopic("All Posts")

                    }

                  />

                  {TOPICS.map((topic) => (

                    <TopicButton

                      key={topic}

                      label={topic}

                      count={topicCounts[topic] || 0}

                      active={activeTopic === topic}

                      onClick={() =>

                        setActiveTopic(topic)

                      }

                    />

                  ))}

                </div>

              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">

                <SideHeading

                  icon={Bell}

                  title="Community Guidelines"

                  subtitle="Keep the learning space useful"

                />

                <div className="mt-4 space-y-3">

                  <Guideline

                    number="01"

                    text="Keep questions clear and constructive."

                  />

                  <Guideline

                    number="02"

                    text="Help students when you can."

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

              </div>

              <div className="tc-team-panel rounded-2xl border border-blue-100 bg-blue-50/60 p-5">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#173B67] shadow-sm">

                  <BookOpen size={18} />

                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-900">

                  Trainer Community

                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">

                  Share useful resources, answer student

                  questions and keep discussions focused on

                  learning.

                </p>

              </div>

            </aside>

          </section>

        </div>

      </main>

      {editingPost ? (

        <Modal onClose={closeEdit}>

          <form onSubmit={saveEdit}>

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>

                <h2 className="text-base font-bold text-slate-900">

                  Edit Post

                </h2>

                <p className="mt-0.5 text-xs text-slate-500">

                  Update your community discussion.

                </p>

              </div>

              <button

                type="button"

                onClick={closeEdit}

                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"

              >

                <X size={18} />

              </button>

            </div>

            <div className="space-y-4 p-5">

              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-600">

                  Title

                </label>

                <input

                  value={editTitle}

                  onChange={(event) =>

                    setEditTitle(event.target.value)

                  }

                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"

                />

              </div>

              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-600">

                  Topic

                </label>

                <select value={editTopic} onChange={(event) => setEditTopic(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 outline-none focus:border-orange-500">

                  {CREATE_TOPICS.map((topic) => (

                    <option key={topic} value={topic}>{topic}</option>

                  ))}

                </select>

              </div>

              <div>

                <label className="mb-1.5 block text-xs font-semibold text-slate-600">

                  Content

                </label>

                <textarea

                  value={editContent}

                  onChange={(event) =>

                    setEditContent(event.target.value)

                  }

                  rows={6}

                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-6 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"

                />

              </div>

            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">

              <button

                type="button"

                onClick={closeEdit}

                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"

              >

                Cancel

              </button>

              <button

                type="submit"

                disabled={editSubmitting}

                className="inline-flex items-center gap-2 rounded-lg bg-[#F97316] px-4 py-2 text-sm font-semibold text-white hover:bg-[#EA580C] disabled:opacity-50"

              >

                {editSubmitting ? (

                  <Loader2

                    size={15}

                    className="animate-spin"

                  />

                ) : (

                  <Check size={15} />

                )}

                {editSubmitting

                  ? "Saving..."

                  : "Save Changes"}

              </button>

            </div>

          </form>

        </Modal>

      ) : null}

      {deletePostId ? (

        <ConfirmModal

          title="Delete this post?"

          message="This will permanently remove your post and its comments."

          loading={deleteSubmitting}

          onCancel={() => setDeletePostId(null)}

          onConfirm={confirmDeletePost}

        />

      ) : null}

      {deleteCommentId ? (

        <ConfirmModal

          title="Delete this comment?"

          message="This comment will be permanently removed."

          loading={deleteCommentSubmitting}

          onCancel={() => setDeleteCommentId(null)}

          onConfirm={() => {

            const postId =

              expandedPostId || 0;

            if (postId) {

              void confirmDeleteComment(postId);

            }

          }}

        />

      ) : null}


      <style jsx global>{`
        .trainer-community-page{--skce-navy:#173B67;--skce-orange:#F97316;--skce-orange-deep:#EA580C;--skce-gold:#D7A94B;color:#183653}
        .trainer-community-page .tc-hero{position:relative;isolation:isolate;overflow:hidden;border:1px solid rgba(255,255,255,.14);border-bottom:4px solid var(--skce-orange);border-radius:22px;background:linear-gradient(112deg,#202334 0%,#173B67 56%,#244f80 100%);box-shadow:0 16px 34px rgba(15,47,95,.13);padding:30px 32px!important}
        .trainer-community-page .tc-hero:after{content:"";position:absolute;z-index:-1;right:-90px;top:-190px;width:390px;height:390px;border:1px solid rgba(255,255,255,.13);border-radius:50%;box-shadow:0 0 0 20px rgba(255,255,255,.025),0 0 0 44px rgba(255,255,255,.025),0 0 0 68px rgba(255,255,255,.02);pointer-events:none}
        .trainer-community-page .tc-hero h1{font-size:clamp(28px,2.4vw,36px);line-height:1.15;letter-spacing:-.035em}
        .trainer-community-page .tc-stats{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:16px!important}
        .trainer-community-page .tc-stats>div{min-height:112px;border-color:#DFE8F4;border-radius:17px;background:linear-gradient(135deg,#fff 0%,#fff 68%,#FFF8F0 100%);box-shadow:0 3px 10px rgba(15,47,95,.045);transition:transform .2s ease,box-shadow .2s ease}
        .trainer-community-page .tc-stats>div:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(15,47,95,.09)}
        .trainer-community-page .tc-stats>div:nth-child(1) .rounded-xl{background:#EDF4FF!important;color:var(--skce-navy)!important}.trainer-community-page .tc-stats>div:nth-child(2) .rounded-xl{background:#FFF0E3!important;color:var(--skce-orange-deep)!important}.trainer-community-page .tc-stats>div:nth-child(3) .rounded-xl{background:#FFF6DF!important;color:#946B13!important}
        .trainer-community-page .tc-pinned{border:1px solid #F3D3A9!important;border-left:4px solid var(--skce-orange)!important;border-radius:16px!important;background:linear-gradient(120deg,#FFF7EC 0%,#fff 68%,#F4F7FC 100%)!important;box-shadow:0 4px 14px rgba(15,47,95,.045)}
        .trainer-community-page .tc-composer{border:1px solid #DCE6F4;border-radius:17px;background:linear-gradient(135deg,#fff 0%,#fff 75%,#FFF8F0 100%);box-shadow:0 3px 12px rgba(15,47,95,.045)}
        .trainer-community-page .tc-composer textarea:focus,.trainer-community-page input:focus,.trainer-community-page select:focus{outline:none;border-color:var(--skce-orange)!important;box-shadow:0 0 0 3px rgba(249,115,22,.12)}
        .trainer-community-page .tc-post{position:relative;min-width:0;padding:18px 20px 14px;border:1px solid #DCE6F4;border-left:4px solid var(--skce-navy);border-radius:16px;background:linear-gradient(115deg,#F3F7FD 0%,#fff 52%);box-shadow:0 3px 8px rgba(15,47,95,.05);scroll-margin-top:90px;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
        .trainer-community-page .tc-post:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(15,47,95,.09);border-color:#B8CDE8}
        .trainer-community-page .tc-post:nth-child(4n + 2){border-left-color:var(--skce-orange);background:linear-gradient(115deg,#FFF7EF 0%,#fff 55%)}.trainer-community-page .tc-post:nth-child(4n + 3){border-left-color:var(--skce-gold);background:linear-gradient(115deg,#FFFAEB 0%,#fff 55%)}.trainer-community-page .tc-post:nth-child(4n + 4){border-left-color:#7E3448;background:linear-gradient(115deg,#FCF3F5 0%,#fff 55%)}
        .trainer-community-page .tc-post h3{color:var(--skce-navy);font-size:16px;line-height:1.4}
        .trainer-community-page .tc-post-image{width:min(100%,560px);margin-top:14px;overflow:hidden;border:1px solid #D7E2F0;border-radius:12px;background:linear-gradient(135deg,#F6F8FC,#fff);box-shadow:0 3px 10px rgba(15,47,95,.04)}
        .trainer-community-page .tc-post-image img{display:block;width:100%;height:260px;max-height:260px;margin:0 auto;object-fit:contain;object-position:center;background:#fff}
        .trainer-community-page .tc-pinned-image{border-color:#F0D6B5!important}.trainer-community-page .tc-preview-image{width:min(100%,440px);background:#fff}.trainer-community-page .tc-preview-image img{display:block;width:100%;height:220px;max-height:220px;object-fit:contain;background:#fff}
        .trainer-community-page .tc-sidebar>div{border-color:#DFE8F4;border-radius:16px;box-shadow:0 3px 10px rgba(15,47,95,.04)}.trainer-community-page .tc-team-panel{border-color:#D7E3F3!important;background:linear-gradient(130deg,#F1F6FD,#fff 75%,#FFF6EC)!important}.trainer-community-page .tc-team-panel h3{color:var(--skce-navy)}
        @media(max-width:900px){.trainer-community-page .tc-hero{padding:24px!important}.trainer-community-page .tc-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
        @media(max-width:560px){.trainer-community-page{padding-left:12px!important;padding-right:12px!important}.trainer-community-page .tc-hero{padding:22px 18px!important;border-radius:17px}.trainer-community-page .tc-stats{grid-template-columns:minmax(0,1fr)!important;gap:10px!important}.trainer-community-page .tc-stats>div{min-height:92px;padding:16px}.trainer-community-page .tc-post{padding:14px 13px 12px;border-radius:14px}.trainer-community-page .tc-post-image{width:100%}.trainer-community-page .tc-post-image img{height:220px;max-height:220px}.trainer-community-page .tc-preview-image img{height:190px;max-height:190px}}
        @media(prefers-reduced-motion:reduce){.trainer-community-page .tc-post,.trainer-community-page .tc-stats>div{transition:none!important}}
      `}</style>
    </>

  );

}

function StatCard({

  icon: Icon,

  label,

  value,

  description,

  iconClass,

}: {

  icon: typeof Users;

  label: string;

  value: string;

  description: string;

  iconClass: string;

}) {

  return (

    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md" style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
      <div className="flex items-center gap-4" style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "flex-start", textAlign: "left" }}>

        <div

          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}

        >

          <Icon size={21} />

        </div>

        <div style={{ minWidth: 0, textAlign: "left" }}>
          <p className="text-xs font-medium text-slate-400" style={{ textAlign: "left" }}>{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900" style={{ textAlign: "left" }}>{value}</p>
          <p className="mt-0.5 text-[11px] text-slate-400" style={{ textAlign: "left" }}>{description}</p>
        </div>

      </div>

    </div>

  );

}

function RoleBadge({ role }: { role: PostRole }) {

  const classes =

    role === "Admin"

      ? "bg-orange-50 text-orange-700"

      : role === "Trainer"

        ? "bg-orange-50 text-orange-700"

        : "bg-slate-100 text-slate-600";

  return (

    <span

      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${classes}`}

    >

      {role}

    </span>

  );

}

function CommentsSection({

  comments,

  loading,

  draft,

  submitting,

  currentUserId,

  onDraftChange,

  onSubmit,

  onDelete,

}: {

  comments: CommunityComment[];

  loading: boolean;

  draft: string;

  submitting: boolean;

  currentUserId: number | null;

  onDraftChange: (value: string) => void;

  onSubmit: () => void;

  onDelete: (commentId: number) => void;

}) {

  return (

    <div className="mt-4 rounded-xl bg-slate-50 p-4">

      <div className="mb-3 flex items-center gap-2">

        <MessageCircle

          size={15}

          className="text-[#F97316]"

        />

        <h4 className="text-xs font-bold text-slate-700">

          Replies

        </h4>

      </div>

      {loading ? (

        <div className="flex items-center justify-center py-6">

          <Loader2

            size={20}

            className="animate-spin text-[#F97316]"

          />

        </div>

      ) : comments.length === 0 ? (

        <p className="py-3 text-xs text-slate-400">

          No replies yet. Start the conversation.

        </p>

      ) : (

        <div className="space-y-3">

          {comments.map((comment) => {

            const isOwner =

              currentUserId !== null &&

              comment.authorId === currentUserId;

            return (

              <div

                key={comment.id}

                className="rounded-xl border border-slate-200 bg-white p-3"

              >

                <div className="flex items-start justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-2">

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">

                        {getPhotoUrl(comment.profilePhotoUrl) ? (

                          <img src={getPhotoUrl(comment.profilePhotoUrl) as string} alt={comment.author} className="h-full w-full object-cover" />

                        ) : (

                          comment.author.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("")

                        )}

                      </div>

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="text-xs font-bold text-slate-800">

                          {comment.author}

                        </span>

                        <RoleBadge role={comment.role} />

                      </div>

                      <span className="text-[10px] text-slate-400">

                        {formatCommentTime(

                          comment.createdAt

                        )}

                      </span>

                    </div>

                  </div>

                  {isOwner ? (

                    <button

                      type="button"

                      onClick={() =>

                        onDelete(comment.id)

                      }

                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"

                      title="Delete comment"

                    >

                      <Trash2 size={13} />

                    </button>

                  ) : null}

                </div>

                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">

                  {comment.content}

                </p>

              </div>

            );

          })}

        </div>

      )}

      <div className="mt-3 flex gap-2">

        <input

          value={draft}

          onChange={(event) =>

            onDraftChange(event.target.value)

          }

          onKeyDown={(event) => {

            if (

              event.key === "Enter" &&

              !event.shiftKey

            ) {

              event.preventDefault();

              onSubmit();

            }

          }}

          placeholder="Write a reply..."

          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"

        />

        <button

          type="button"

          onClick={onSubmit}

          disabled={!draft.trim() || submitting}

          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#F97316] px-3 text-white hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-50"

          title="Send reply"

        >

          {submitting ? (

            <Loader2

              size={14}

              className="animate-spin"

            />

          ) : (

            <Send size={14} />

          )}

        </button>

      </div>

    </div>

  );

}

function SideHeading({

  icon: Icon,

  title,

  subtitle,

}: {

  icon: typeof Search;

  title: string;

  subtitle: string;

}) {

  return (

    <div className="flex items-start gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#F97316]">

        <Icon size={17} />

      </div>

      <div>

        <h3 className="text-sm font-bold text-slate-900">

          {title}

        </h3>

        <p className="mt-0.5 text-[11px] text-slate-400">

          {subtitle}

        </p>

      </div>

    </div>

  );

}

function TopicButton({

  label,

  count,

  active,

  onClick,

}: {

  label: string;

  count: number;

  active: boolean;

  onClick: () => void;

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${

        active

          ? "border-orange-100 bg-orange-50 text-[#F97316]"

          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white"

      }`}

    >

      <span>{label}</span>

      <span

        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${

          active

            ? "bg-white text-[#F97316]"

            : "bg-white text-slate-400"

        }`}

      >

        {count}

      </span>

    </button>

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

    <div className="flex items-start gap-3">

      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-bold text-slate-500">

        {number}

      </span>

      <p className="pt-0.5 text-xs leading-5 text-slate-500">

        {text}

      </p>

    </div>

  );

}

function Modal({

  children,

  onClose,

}: {

  children: ReactNode;

  onClose: () => void;

}) {

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">

      <button

        type="button"

        aria-label="Close modal"

        onClick={onClose}

        className="absolute inset-0 cursor-default"

      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {children}

      </div>

    </div>

  );

}

function ConfirmModal({

  title,

  message,

  loading,

  onCancel,

  onConfirm,

}: {

  title: string;

  message: string;

  loading: boolean;

  onCancel: () => void;

  onConfirm: () => void;

}) {

  return (

    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">

      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">

          <Trash2 size={18} />

        </div>

        <h2 className="mt-4 text-base font-bold text-slate-900">

          {title}

        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">

          {message}

        </p>

        <div className="mt-5 flex justify-end gap-2">

          <button

            type="button"

            onClick={onCancel}

            disabled={loading}

            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"

          >

            Cancel

          </button>

          <button

            type="button"

            onClick={onConfirm}

            disabled={loading}

            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"

          >

            {loading ? (

              <Loader2

                size={15}

                className="animate-spin"

              />

            ) : (

              <Trash2 size={15} />

            )}

            {loading ? "Deleting..." : "Delete"}

          </button>

        </div>

      </div>

    </div>

  );

}

function formatCommentTime(value: string) {

  if (!value) return "Just now";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  const diff = Date.now() - date.getTime();

  const minutes = Math.floor(diff / 60000);

  const hours = Math.floor(diff / 3600000);

  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";

  if (minutes < 60) return `${minutes} min ago`;

  if (hours < 24)

    return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  if (days < 7)

    return `${days} day${days === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();

}
