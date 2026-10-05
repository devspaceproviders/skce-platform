import type { Request, Response } from "express";
import fs from "fs";
import path from "path";

import { db } from "../../prisma/db";
import {
  createCommunityComment,
  createCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  getCommunityPost,
  likeCommunityPost,
  listCommunityComments,
  listCommunityPosts,
  unlikeCommunityPost,
  updateCommunityPost,
  setCommunityPostPinned,
} from "../services/community.service";

function parseId(value: string | string[] | undefined): number | null {
  if (!value || Array.isArray(value)) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isAdmin(req: Request): boolean {
  return req.user?.role === "ADMIN";
}

function getUploadedFile(req: Request): Express.Multer.File | undefined {
  return (req as Request & { file?: Express.Multer.File }).file;
}

function getCommunityImageUrl(file?: Express.Multer.File): string | null {
  if (!file) return null;
  return `/uploads/community/${file.filename}`;
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function removeCommunityImage(imageUrl?: string | null): void {
  if (!imageUrl || !imageUrl.startsWith("/uploads/community/")) return;

  const filename = path.basename(imageUrl);
  const filePath = path.join(
    process.cwd(),
    "uploads",
    "community",
    filename
  );

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Failed to remove community image:", error);
  }
}

export async function getStats(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const users = await db.orm.public.User.all();
    const activeUsers = users.filter((user) => user.isActive !== false);

    return res.status(200).json({
      success: true,
      data: {
        members: activeUsers.length,
        totalUsers: users.length,
      },
    });
  } catch (error) {
    console.error("Failed to load community stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load community statistics",
    });
  }
}

export async function listPosts(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const posts = await listCommunityPosts(req.user.userId);
    return res.status(200).json({ success: true, data: posts });
  } catch (error) {
    console.error("Failed to list community posts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load community posts",
    });
  }
}

export async function getPost(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const postId = parseId(req.params.id);
  if (!postId) {
    return res.status(400).json({
      success: false,
      message: "Invalid post id",
    });
  }

  try {
    const post = await getCommunityPost(postId, req.user.userId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error("Failed to get community post:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load community post",
    });
  }
}

export async function createPost(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const uploadedFile = getUploadedFile(req);
  const imageUrl = getCommunityImageUrl(uploadedFile);

  try {
    const post = await createCommunityPost(req.user.userId, {
      title: req.body?.title,
      content: req.body?.content,
      topic: req.body?.topic,
      imageUrl,
    });

    return res.status(201).json({ success: true, data: post });
  } catch (error) {
    if (uploadedFile) removeCommunityImage(imageUrl);

    if (error instanceof Error) {
      if (
        error.message.includes("required") ||
        error.message.includes("cannot exceed")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Failed to create community post:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create community post",
    });
  }
}

export async function updatePost(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const postId = parseId(req.params.id);
  if (!postId) {
    return res.status(400).json({
      success: false,
      message: "Invalid post id",
    });
  }

  const uploadedFile = getUploadedFile(req);
  const newImageUrl = getCommunityImageUrl(uploadedFile);
  const removeImage = parseBoolean(req.body?.removeImage);

  try {
    const existing = await getCommunityPost(postId, req.user.userId);

    if (!existing) {
      if (uploadedFile) removeCommunityImage(newImageUrl);
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const imageUrl = uploadedFile
      ? newImageUrl
      : removeImage
        ? null
        : undefined;

    const updateInput: {
      title?: string;
      content?: string;
      topic?: string;
      imageUrl?: string | null;
    } = {
      title: req.body?.title,
      content: req.body?.content,
      topic: req.body?.topic,
    };

    if (imageUrl !== undefined) {
      updateInput.imageUrl = imageUrl;
    }

    const post = await updateCommunityPost(
      postId,
      req.user.userId,
      updateInput
    );

    if (uploadedFile && existing.imageUrl) {
      removeCommunityImage(existing.imageUrl);
    } else if (removeImage && existing.imageUrl) {
      removeCommunityImage(existing.imageUrl);
    }

    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    if (uploadedFile) removeCommunityImage(newImageUrl);

    if (error instanceof Error) {
      if (error.message === "Post not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("only edit your own")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message.includes("required") ||
        error.message.includes("cannot exceed")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Failed to update community post:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update community post",
    });
  }
}

export async function deletePost(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const postId = parseId(req.params.id);
  if (!postId) {
    return res.status(400).json({
      success: false,
      message: "Invalid post id",
    });
  }

  try {
    const result = await deleteCommunityPost(
      postId,
      req.user.userId,
      isAdmin(req)
    );

    if (result.imageUrl) {
      removeCommunityImage(result.imageUrl);
    }

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Post not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("only delete your own")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Failed to delete community post:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete community post",
    });
  }
}

export async function listComments(req: Request, res: Response) {
  const postId = parseId(req.params.id);

  if (!postId) {
    return res.status(400).json({
      success: false,
      message: "Invalid post id",
    });
  }

  try {
    const comments = await listCommunityComments(postId);
    return res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("Failed to list community comments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load comments",
    });
  }
}

export async function createComment(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const postId = parseId(req.params.id);
  if (!postId) {
    return res.status(400).json({
      success: false,
      message: "Invalid post id",
    });
  }

  try {
    const comment = await createCommunityComment(
      postId,
      req.user.userId,
      { content: req.body?.content }
    );

    return res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Post not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("required")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Failed to create community comment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create comment",
    });
  }
}

export async function deleteComment(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const commentId = parseId(req.params.commentId);
  if (!commentId) {
    return res.status(400).json({
      success: false,
      message: "Invalid comment id",
    });
  }

  try {
    const result = await deleteCommunityComment(
      commentId,
      req.user.userId,
      isAdmin(req)
    );

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Comment not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("only delete your own")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Failed to delete community comment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete comment",
    });
  }
}

export async function likePost(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const postId = parseId(req.params.id);
  if (!postId) {
    return res.status(400).json({
      success: false,
      message: "Invalid post id",
    });
  }

  try {
    const result = await likeCommunityPost(postId, req.user.userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Post not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Failed to like community post:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to like post",
    });
  }
}

export async function unlikePost(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const postId = parseId(req.params.id);
  if (!postId) {
    return res.status(400).json({
      success: false,
      message: "Invalid post id",
    });
  }

  try {
    const result = await unlikeCommunityPost(postId, req.user.userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to unlike community post:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unlike post",
    });
  }
}

export async function pinPost(req: Request, res: Response) {
  const postId = parseId(req.params.id);

  if (!postId) {
    return res.status(400).json({
      success: false,
      message: "Invalid post id",
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!isAdmin(req)) {
    return res.status(403).json({
      success: false,
      message: "Only administrators can pin or unpin posts",
    });
  }

  if (typeof req.body?.isPinned !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isPinned must be a boolean",
    });
  }

  try {
    const post = await setCommunityPostPinned(
      postId,
      req.body.isPinned
    );

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Post not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Failed to pin community post:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update post pin status",
    });
  }
}
