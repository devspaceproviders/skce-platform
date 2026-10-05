import { Router } from "express";

import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  getPost,
  getStats,
  likePost,
  listComments,
  listPosts,
  pinPost,
  unlikePost,
  updatePost,
} from "../controllers/community.controller";

import {
  authenticate,
  requireRole,
} from "../../auth/middleware/auth.middleware";

import { communityImageUpload } from "../uploads/community.upload";

const router = Router();

router.use(
  authenticate,
  requireRole("ADMIN", "STUDENT", "TRAINER")
);

router.get("/stats", getStats);
router.get("/posts", listPosts);
router.get("/posts/:id", getPost);

router.post(
  "/posts",
  communityImageUpload.single("image"),
  createPost
);

router.patch(
  "/posts/:id",
  communityImageUpload.single("image"),
  updatePost
);

router.delete("/posts/:id", deletePost);
router.get("/posts/:id/comments", listComments);
router.post("/posts/:id/comments", createComment);
router.delete("/comments/:commentId", deleteComment);
router.post("/posts/:id/like", likePost);
router.delete("/posts/:id/like", unlikePost);
router.patch("/posts/:id/pin", pinPost);

export default router;
