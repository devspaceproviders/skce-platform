  import { Router } from "express";

  import { authenticate } from "../auth/middleware/auth.middleware";

  import {
    uploadProfilePhotoController,
  } from "./profile-photo.controller";

  import {
    profilePhotoUpload,
  } from "./profile-photo.upload";

  const profilePhotoRouter =
    Router();

  /**
   * Upload or replace the
   * currently logged-in user's
   * profile photo.
   *
   * POST /api/profile/photo
   *
   * Content-Type:
   * multipart/form-data
   *
   * Field name:
   * photo
   */
  profilePhotoRouter.post(
    "/photo",
    authenticate,
    profilePhotoUpload.single("photo"),
    uploadProfilePhotoController
  );

  export default profilePhotoRouter;