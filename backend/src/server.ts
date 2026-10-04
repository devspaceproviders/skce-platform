import certificateAssetRouter from "./certificates/certificate-assets.routes";

import certificateRouter from "./certificates/certificate.routes";

import adminReportsRouter from "./reports/routes/admin-reports.routes";

import express from "express";

import cors from "cors";

import helmet from "helmet";

import dotenv from "dotenv";

import path from "path";

import authRoutes from "./auth/routes/auth.routes";

import courseRoutes,{adminCourseRouter} from "./courses/routes/course.routes";

import packageRoutes from "./packages/routes/package.routes";

import packageAdminRoutes from "./packages/routes/package-admin.routes";

import studentRoutes from "./students/routes/student.routes";

import paymentRoutes from "./payments/routes/payment.routes";

import courseContentRoutes from "./course-content/routes/course-content.routes";

import courseContentAdminRoutes from "./course-content/routes/course-content-admin.routes";

import courseProgressRoutes from "./course-content/routes/course-progress.routes";

import assessmentRoutes,{adminAssessmentRouter} from "./assessments/routes/assessment.routes";

import {adminBatchRouter,trainerBatchRouter} from "./batches/routes/batch.routes";

import meetingRoutes,{adminMeetingRouter,trainerMeetingRouter} from "./meetings/routes/meeting.routes";

import trainerAvailabilityRouter from "./trainers/routes/trainer-availability.routes";

import trainerAdminRouter,{publicTrainerRouter} from "./trainers/routes/trainer.routes";

import trainerEngagementRouter from "./trainers/routes/trainer-engagement.routes";

import trainerProfileRouter from "./trainers/routes/trainer-profile.routes";

import trainerCoursePermissionRouter from "./trainers/routes/trainer-course-permission.routes";

import trainerCoursePermissionTrainerRouter from "./trainers/routes/trainer-course-permission-trainer.routes";

import profilePhotoRouter from "./profile/profile-photo.routes";

import ceoRouter from "./ceo/routes/ceo.routes";

import adminCeoRouter from "./ceo/routes/admin-ceo.routes";

import { db } from "./prisma/db";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

/*

 * ============================================================

 * SECURITY

 * ============================================================

 */

app.use(helmet());

app.use(

  cors({

    origin:

      process.env.FRONTEND_URL ||

      "http://localhost:3000",

    credentials: true,

  })

);

/*

 * ============================================================

 * PROFILE PHOTO / UPLOADS

 * ============================================================

 *

 * Profile photos and certificate assets are stored under:

 *

 * backend/uploads

 *

 * They are available through:

 *

 * http://localhost:5000/uploads/<path>

 *

 * Cross-Origin-Resource-Policy is explicitly set to

 * cross-origin so the Next.js frontend on localhost:3000

 * can display images served by localhost:5000.

 *

 * ============================================================

 */

app.use(

  "/uploads",

  (req,res,next) => {

    res.setHeader(

      "Access-Control-Allow-Origin",

      "http://localhost:3000"

    );

    res.setHeader(

      "Cross-Origin-Resource-Policy",

      "cross-origin"

    );

    next();

  },

  express.static(

    path.join(

      process.cwd(),

      "uploads"

    )

  )

);

/*

 * ============================================================

 * BODY PARSING

 * ============================================================

 */

app.use(express.json());

app.use(

  express.urlencoded({

    extended: true,

  })

);

/*

 * ============================================================

 * API ROUTES

 * ============================================================

 */

app.use(

  "/api/auth",

  authRoutes

);

/*

 * ============================================================

 * PROFILE PHOTO

 * ============================================================

 *

 * POST /api/profile/photo

 *

 * Authenticated users can upload their own profile photo.

 *

 * ============================================================

 */

app.use(

  "/api/profile",

  profilePhotoRouter

);

/*

 * ============================================================

 * CEO / FOUNDER PROFILE

 * ============================================================

 *

 * GET /api/ceo

 *

 * Public CEO information used by the website.

 *

 * ADMIN:

 * GET   /api/admin/ceo

 * PATCH /api/admin/ceo

 *

 * ============================================================

 */

app.use(

  "/api/ceo",

  ceoRouter

);

app.use(

  "/api/admin/ceo",

  adminCeoRouter

);

/*

 * ============================================================

 * PUBLIC COURSES

 * ============================================================

 */

app.use(

  "/api/courses",

  courseRoutes

);

/*

 * ============================================================

 * ADMIN COURSES

 * ============================================================

 */

app.use(

  "/api/admin/courses",

  adminCourseRouter

);

/*

 * ============================================================

 * PACKAGES

 * ============================================================

 */

app.use(

  "/api/packages",

  packageRoutes

);

app.use(

  "/api/admin/packages",

  packageAdminRoutes

);

/*

 * ============================================================

 * STUDENTS

 * ============================================================

 */

app.use(

  "/api/students",

  studentRoutes

);

app.use(

  "/api/admin/reports",

  adminReportsRouter

);

/*

 * ============================================================

 * PAYMENTS

 * ============================================================

 */

app.use(

  "/api/payments",

  paymentRoutes

);

/*

 * ============================================================

 * COURSE CONTENT

 * ============================================================

 */

app.use(

  "/api/course-content",

  courseContentRoutes

);

/*

 * ============================================================

 * STUDENT COURSE PROGRESS

 * ============================================================

 */

app.use(

  "/api/course-progress",

  courseProgressRoutes

);

/*

 * ============================================================

 * ADMIN COURSE CONTENT

 * ============================================================

 */

app.use(

  "/api/admin/course-content",

  courseContentAdminRoutes

);

/*

 * ============================================================

 * ASSESSMENTS

 * ============================================================

 */

app.use(

  "/api/assessments",

  assessmentRoutes

);

app.use(

  "/api/admin/assessments",

  adminAssessmentRouter

);

/*

 * ============================================================

 * TRAINERS

 * ============================================================

 *

 * PUBLIC:

 * GET /api/trainers

 *

 * ADMIN:

 * GET    /api/admin/trainers

 * GET    /api/admin/trainers/:id

 * POST   /api/admin/trainers

 * PATCH  /api/admin/trainers/:id

 * POST   /api/admin/trainers/:id/photo

 * POST   /api/admin/trainers/:id/reset-password

 *

 * ============================================================

 */

app.use(

  "/api/trainers",

  publicTrainerRouter

);

app.use(

  "/api/admin/trainers",

  trainerAdminRouter

);

app.use(

  "/api/trainer/engagements",

  trainerEngagementRouter

);  

/*

 * ============================================================

 * ADMIN TRAINER AVAILABILITY

 * ============================================================

 */

app.use(

  "/api/admin/trainer-availability",

  trainerAvailabilityRouter

);

/*

 * ============================================================

 * ADMIN TRAINER COURSE PERMISSIONS

 * ============================================================

 *

 * GET    /api/admin/trainer-course-permissions

 * GET    /api/admin/trainer-course-permissions/:trainerId/:courseId

 * POST   /api/admin/trainer-course-permissions

 * PATCH  /api/admin/trainer-course-permissions/:trainerId/:courseId

 * DELETE /api/admin/trainer-course-permissions/:trainerId/:courseId

 *

 * ============================================================

 */

app.use(

  "/api/admin/trainer-course-permissions",

  trainerCoursePermissionRouter

);

/*

 * ============================================================

 * TRAINER COURSE PERMISSIONS

 * ============================================================

 *

 * GET /api/trainer/course-permissions

 *

 * Returns only the permissions belonging to the

 * currently authenticated TRAINER.

 *

 * ============================================================

 */

app.use(

  "/api/trainer/course-permissions",

  trainerCoursePermissionTrainerRouter

);

/*

 * ============================================================

 * TRAINER PROFILE

 * ============================================================

 *

 * GET   /api/trainer/profile

 * PATCH /api/trainer/profile

 *

 * Only authenticated TRAINER users can access these routes.

 *

 * ============================================================

 */

app.use(

  "/api/trainer/profile",

  trainerProfileRouter

);

/*

 * ============================================================

 * ADMIN CERTIFICATE ASSETS

 * ============================================================

 *

 * POST /api/admin/certificate-assets/LOGO

 * POST /api/admin/certificate-assets/SIGNATURE

 *

 * ADMIN only.

 *

 * ============================================================

 */

app.use(

  "/api/admin/certificate-assets",

  certificateAssetRouter

);

app.use(

  "/api/certificates",

  certificateRouter

);

/*

 * ============================================================

 * ADMIN BATCHES

 * ============================================================

 *

 * GET    /api/admin/batches

 * GET    /api/admin/batches/options

 * GET    /api/admin/batches/:id

 * GET    /api/admin/batches/:id/students

 * POST   /api/admin/batches

 * POST   /api/admin/batches/:id/students

 * PATCH  /api/admin/batches/:id

 * DELETE /api/admin/batches/:id

 * DELETE /api/admin/batches/:id/students/:studentId

 *

 * TRAINER:

 * GET /api/trainer/batches

 * GET /api/trainer/batches/:id

 * GET /api/trainer/batches/:id/students

 *

 * ============================================================

 */

app.use(

  "/api/admin/batches",

  adminBatchRouter

);

app.use(

  "/api/trainer/batches",

  trainerBatchRouter

);

/*

 * ============================================================

 * MEETINGS / CALENDAR

 * ============================================================

 */

app.use(

  "/api/meetings",

  meetingRoutes

);

app.use(

  "/api/admin/meetings",

  adminMeetingRouter

);

app.use(

  "/api/trainer/meetings",

  trainerMeetingRouter

);

/*

 * ============================================================

 * BASIC API TEST

 * ============================================================

 */

app.get(

  "/api",

  (_req,res) => {

    return res.status(200).json({

      success: true,

      message:

        "Welcome to SK Computer Education API",

    });

  }

);

/*

 * ============================================================

 * SERVER HEALTH CHECK

 * ============================================================

 */

app.get(

  "/api/health",

  (_req,res) => {

    return res.status(200).json({

      success: true,

      message:

        "SKCE Backend is running",

      timestamp:

        new Date().toISOString(),

    });

  }

);

/*

 * ============================================================

 * DATABASE CONNECTION TEST

 * ============================================================

 */

app.get(

  "/api/db-test",

  async (_req,res) => {

    try {

      const users =

        await db.orm.public.User.all();

      return res.status(200).json({

        success: true,

        message:

          "SKCE database connection is working",

        userCount:

          users.length,

      });

    } catch (error) {

      console.error(

        "Database test failed:",

        error

      );

      return res.status(500).json({

        success: false,

        message:

          "Database connection failed",

      });

    }

  }

);

/*

 * ============================================================

 * START SERVER

 * ============================================================

 */

app.listen(

  PORT,

  () => {

    console.log("");

    console.log(

      "=========================================="

    );

    console.log(

      "       SK COMPUTER EDUCATION API"

    );

    console.log(

      "=========================================="

    );

    console.log(

      `Server: http://localhost:${PORT}`

    );

    console.log(

      `API:    http://localhost:${PORT}/api`

    );

    console.log(

      `Health: http://localhost:${PORT}/api/health`

    );

    console.log(

      `DB:     http://localhost:${PORT}/api/db-test`

    );

    console.log(

      `Uploads: http://localhost:${PORT}/uploads`

    );

    console.log(

      `CEO:    http://localhost:${PORT}/api/ceo`

    );

    console.log(

      "=========================================="

    );

    console.log("");

  }

);
