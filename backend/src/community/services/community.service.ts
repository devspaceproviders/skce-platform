import { db } from "../../prisma/db";

export interface CreateCommunityPostInput {
  title: string;
  content: string;
  topic?: string;
  imageUrl?: string | null;
}

export interface UpdateCommunityPostInput {
  title?: string;
  content?: string;
  topic?: string;
  imageUrl?: string | null;
}

export interface CreateCommunityCommentInput {
  content: string;
}

const DEFAULT_TOPIC = "General Discussion";

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/*
 * ============================================================
 * LIST COMMUNITY POSTS
 * ============================================================
 */

export async function listCommunityPosts(
  currentUserId: number
) {
  const posts =
    await db.orm.public.CommunityPost.all();

  const result = [];

  for (const post of posts) {
    const comments =
      await db.orm.public.CommunityComment
        .where({
          postId: post.id,
        })
        .all();

    const reactions =
      await db.orm.public.CommunityReaction
        .where({
          postId: post.id,
        })
        .all();

    const author =
      await db.orm.public.User
        .where({
          id: post.authorId,
        })
        .first();

    const currentUserReaction =
      await db.orm.public.CommunityReaction
        .where({
          postId: post.id,
          userId: currentUserId,
        })
        .first();

    result.push({
      id: post.id,
      authorId: post.authorId,

      author:
        author?.name ?? "Unknown User",

      role:
        author?.role ?? "STUDENT",

      profilePhotoUrl:
        author?.profilePhotoUrl ?? null,

      title: post.title,
      content: post.content,
      topic: post.topic,

      imageUrl:
        post.imageUrl ?? null,

      isPinned: post.isPinned,

      createdAt: post.createdAt,
      updatedAt: post.updatedAt,

      likes: reactions.length,
      replies: comments.length,

      likedByCurrentUser:
        Boolean(currentUserReaction),
    });
  }

  result.sort((a, b) => {
    if (a.isPinned && !b.isPinned) {
      return -1;
    }

    if (!a.isPinned && b.isPinned) {
      return 1;
    }

    return (
      new Date(String(b.createdAt)).getTime() -
      new Date(String(a.createdAt)).getTime()
    );
  });

  return result;
}

/*
 * ============================================================
 * GET SINGLE COMMUNITY POST
 * ============================================================
 */

export async function getCommunityPost(
  postId: number,
  currentUserId: number
) {
  const post =
    await db.orm.public.CommunityPost
      .where({
        id: postId,
      })
      .first();

  if (!post) {
    return null;
  }

  const author =
    await db.orm.public.User
      .where({
        id: post.authorId,
      })
      .first();

  const comments =
    await db.orm.public.CommunityComment
      .where({
        postId,
      })
      .all();

  const reactions =
    await db.orm.public.CommunityReaction
      .where({
        postId,
      })
      .all();

  const currentUserReaction =
    await db.orm.public.CommunityReaction
      .where({
        postId,
        userId: currentUserId,
      })
      .first();

  const commentResult = [];

  for (const comment of comments) {
    const commentAuthor =
      await db.orm.public.User
        .where({
          id: comment.authorId,
        })
        .first();

    commentResult.push({
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,

      author:
        commentAuthor?.name ??
        "Unknown User",

      role:
        commentAuthor?.role ??
        "STUDENT",

      profilePhotoUrl:
        commentAuthor?.profilePhotoUrl ??
        null,

      content: comment.content,

      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    });
  }

  return {
    id: post.id,
    authorId: post.authorId,

    author:
      author?.name ??
      "Unknown User",

    role:
      author?.role ??
      "STUDENT",

    profilePhotoUrl:
      author?.profilePhotoUrl ??
      null,

    title: post.title,
    content: post.content,
    topic: post.topic,

    imageUrl:
      post.imageUrl ?? null,

    isPinned: post.isPinned,

    createdAt: post.createdAt,
    updatedAt: post.updatedAt,

    likes: reactions.length,
    replies: comments.length,

    likedByCurrentUser:
      Boolean(currentUserReaction),

    comments: commentResult,
  };
}

/*
 * ============================================================
 * CREATE COMMUNITY POST
 * ============================================================
 */

export async function createCommunityPost(
  authorId: number,
  input: CreateCommunityPostInput
) {
  const title = cleanText(input.title);
  const content = cleanText(input.content);
  const topic =
    cleanText(input.topic) ||
    DEFAULT_TOPIC;

  const imageUrl =
    input.imageUrl === null
      ? null
      : cleanText(input.imageUrl) || null;

  if (!title) {
    throw new Error(
      "Post title is required"
    );
  }

  if (!content) {
    throw new Error(
      "Post content is required"
    );
  }

  if (title.length > 200) {
    throw new Error(
      "Post title cannot exceed 200 characters"
    );
  }

  const post =
    await db.orm.public.CommunityPost.create({
      authorId,
      title,
      content,
      topic,
      imageUrl,
      isPinned: false,
    });

  return post;
}

/*
 * ============================================================
 * UPDATE COMMUNITY POST
 * ============================================================
 */

export async function updateCommunityPost(
  postId: number,
  authorId: number,
  input: UpdateCommunityPostInput
) {
  const existing =
    await db.orm.public.CommunityPost
      .where({
        id: postId,
      })
      .first();

  if (!existing) {
    throw new Error(
      "Post not found"
    );
  }

  if (existing.authorId !== authorId) {
    throw new Error(
      "You can only edit your own posts"
    );
  }

  const nextValues: {
    title?: string;
    content?: string;
    topic?: string;
    imageUrl?: string | null;
  } = {};

  if (input.title !== undefined) {
    const title =
      cleanText(input.title);

    if (!title) {
      throw new Error(
        "Post title is required"
      );
    }

    if (title.length > 200) {
      throw new Error(
        "Post title cannot exceed 200 characters"
      );
    }

    nextValues.title = title;
  }

  if (input.content !== undefined) {
    const content =
      cleanText(input.content);

    if (!content) {
      throw new Error(
        "Post content is required"
      );
    }

    nextValues.content = content;
  }

  if (input.topic !== undefined) {
    nextValues.topic =
      cleanText(input.topic) ||
      DEFAULT_TOPIC;
  }

  /*
   * imageUrl handling:
   *
   * undefined = leave existing image unchanged
   * null      = remove existing image
   * string    = replace existing image
   */

  if (input.imageUrl !== undefined) {
    if (input.imageUrl === null) {
      nextValues.imageUrl = null;
    } else {
      const imageUrl =
        cleanText(input.imageUrl);

      nextValues.imageUrl =
        imageUrl || null;
    }
  }

  return await db.orm.public.CommunityPost
    .where({
      id: postId,
    })
    .update(nextValues);
}

/*
 * ============================================================
 * DELETE COMMUNITY POST
 * ============================================================
 */

export async function deleteCommunityPost(
  postId: number,
  userId: number,
  isAdmin: boolean
) {
  const existing =
    await db.orm.public.CommunityPost
      .where({
        id: postId,
      })
      .first();

  if (!existing) {
    throw new Error(
      "Post not found"
    );
  }

  if (
    !isAdmin &&
    existing.authorId !== userId
  ) {
    throw new Error(
      "You can only delete your own posts"
    );
  }

  await db.orm.public.CommunityPost
    .where({
      id: postId,
    })
    .delete();

  return {
    success: true,

    /*
     * The controller/upload layer can use this
     * value to remove the physical file.
     */
    imageUrl:
      existing.imageUrl ?? null,
  };
}

/*
 * ============================================================
 * LIST COMMUNITY COMMENTS
 * ============================================================
 */

export async function listCommunityComments(
  postId: number
) {
  const comments =
    await db.orm.public.CommunityComment
      .where({
        postId,
      })
      .all();

  const result = [];

  for (const comment of comments) {
    const author =
      await db.orm.public.User
        .where({
          id: comment.authorId,
        })
        .first();

    result.push({
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,

      author:
        author?.name ??
        "Unknown User",

      role:
        author?.role ??
        "STUDENT",

      profilePhotoUrl:
        author?.profilePhotoUrl ??
        null,

      content: comment.content,

      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    });
  }

  return result;
}

/*
 * ============================================================
 * CREATE COMMUNITY COMMENT
 * ============================================================
 */

export async function createCommunityComment(
  postId: number,
  authorId: number,
  input: CreateCommunityCommentInput
) {
  const post =
    await db.orm.public.CommunityPost
      .where({
        id: postId,
      })
      .first();

  if (!post) {
    throw new Error(
      "Post not found"
    );
  }

  const content =
    cleanText(input.content);

  if (!content) {
    throw new Error(
      "Comment content is required"
    );
  }

  const comment =
    await db.orm.public.CommunityComment
      .create({
        postId,
        authorId,
        content,
      });

  return comment;
}

/*
 * ============================================================
 * DELETE COMMUNITY COMMENT
 * ============================================================
 */

export async function deleteCommunityComment(
  commentId: number,
  userId: number,
  isAdmin: boolean
) {
  const comment =
    await db.orm.public.CommunityComment
      .where({
        id: commentId,
      })
      .first();

  if (!comment) {
    throw new Error(
      "Comment not found"
    );
  }

  if (
    !isAdmin &&
    comment.authorId !== userId
  ) {
    throw new Error(
      "You can only delete your own comments"
    );
  }

  await db.orm.public.CommunityComment
    .where({
      id: commentId,
    })
    .delete();

  return {
    success: true,
  };
}

/*
 * ============================================================
 * LIKE COMMUNITY POST
 * ============================================================
 */

export async function likeCommunityPost(
  postId: number,
  userId: number
) {
  const post =
    await db.orm.public.CommunityPost
      .where({
        id: postId,
      })
      .first();

  if (!post) {
    throw new Error(
      "Post not found"
    );
  }

  const existing =
    await db.orm.public.CommunityReaction
      .where({
        postId,
        userId,
      })
      .first();

  if (existing) {
    return {
      liked: true,
    };
  }

  await db.orm.public.CommunityReaction
    .create({
      postId,
      userId,
    });

  return {
    liked: true,
  };
}

/*
 * ============================================================
 * UNLIKE COMMUNITY POST
 * ============================================================
 */

export async function unlikeCommunityPost(
  postId: number,
  userId: number
) {
  const existing =
    await db.orm.public.CommunityReaction
      .where({
        postId,
        userId,
      })
      .first();

  if (!existing) {
    return {
      liked: false,
    };
  }

  await db.orm.public.CommunityReaction
    .where({
      id: existing.id,
    })
    .delete();

  return {
    liked: false,
  };
}

/*
 * ============================================================
 * PIN / UNPIN COMMUNITY POST
 * ============================================================
 */

export async function setCommunityPostPinned(
  postId: number,
  isPinned: boolean
) {
  const post =
    await db.orm.public.CommunityPost
      .where({
        id: postId,
      })
      .first();

  if (!post) {
    throw new Error(
      "Post not found"
    );
  }

  return await db.orm.public.CommunityPost
    .where({
      id: postId,
    })
    .update({
      isPinned,
    });
}