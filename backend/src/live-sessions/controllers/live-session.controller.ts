import type { Response } from "express";
import type { AuthenticatedRequest } from "../../auth/middleware/auth.middleware";
import {
  LiveSessionError,
  createAdminLiveSession,
  createTrainerLiveSession,
  deleteAdminLiveSession,
  deleteTrainerLiveSession,
  getAdminLiveSessions,
  getAdminOrTrainerLiveSession,
  getLiveSessionOptions,
  getSessionParticipants,
  getStudentLiveSession,
  getStudentLiveSessions,
  getTrainerLiveSessions,
  joinLiveSession,
  leaveLiveSession,
  updateAdminLiveSession,
  updateTrainerLiveSession,
  type LiveSessionCreateInput,
  type LiveSessionStatus,
  type LiveSessionUpdateInput,
} from "../services/live-session.service";

function currentUser(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new LiveSessionError("Authentication required.", 401);
  }

  return req.user;
}

function toPositiveInt(value: unknown, fieldName: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new LiveSessionError(`${fieldName} must be a positive integer.`);
  }

  return parsed;
}

function toCreateInput(body: any): LiveSessionCreateInput {
  return {
    courseId: body?.courseId,
    trainerId: body?.trainerId,
    title: body?.title,
    description: body?.description,
    startAt: body?.startAt,
    endAt: body?.endAt,
    meetingUrl: body?.meetingUrl,
    recordingUrl: body?.recordingUrl,
    status: body?.status
      ? (body.status as LiveSessionStatus)
      : "SCHEDULED",
    isPublished: body?.isPublished,
  };
}

function toUpdateInput(body: any): LiveSessionUpdateInput {
  return {
    ...(body?.courseId !== undefined ? { courseId: body.courseId } : {}),
    ...(body?.trainerId !== undefined ? { trainerId: body.trainerId } : {}),
    ...(body?.title !== undefined ? { title: body.title } : {}),
    ...(body?.description !== undefined
      ? { description: body.description }
      : {}),
    ...(body?.startAt !== undefined ? { startAt: body.startAt } : {}),
    ...(body?.endAt !== undefined ? { endAt: body.endAt } : {}),
    ...(body?.meetingUrl !== undefined
      ? { meetingUrl: body.meetingUrl }
      : {}),
    ...(body?.recordingUrl !== undefined
      ? { recordingUrl: body.recordingUrl }
      : {}),
    ...(body?.status !== undefined
      ? { status: body.status as LiveSessionStatus }
      : {}),
    ...(body?.isPublished !== undefined
      ? { isPublished: body.isPublished }
      : {}),
  };
}

function sendError(res: Response, error: unknown) {
  if (error instanceof LiveSessionError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error("Live session error:", error);

  return res.status(500).json({
    success: false,
    message: "Unable to process live session request.",
  });
}

export async function listAdminLiveSessions(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const data = await getAdminLiveSessions();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getAdminLiveSession(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);
    const sessionId = toPositiveInt(req.params.id, "session id");
    const data = await getAdminOrTrainerLiveSession(
      sessionId,
      user.userId,
      "ADMIN"
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listLiveSessionOptions(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const data = await getLiveSessionOptions();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function createAdminLiveSessionController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    currentUser(req);
    const data = await createAdminLiveSession(toCreateInput(req.body));

    return res.status(201).json({
      success: true,
      message: "Live session created successfully.",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function updateAdminLiveSessionController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    currentUser(req);
    const sessionId = toPositiveInt(req.params.id, "session id");
    const data = await updateAdminLiveSession(sessionId, toUpdateInput(req.body));

    return res.status(200).json({
      success: true,
      message: "Live session updated successfully.",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function deleteAdminLiveSessionController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    currentUser(req);
    const sessionId = toPositiveInt(req.params.id, "session id");
    const data = await deleteAdminLiveSession(sessionId);

    return res.status(200).json({
      success: true,
      message: "Live session deleted successfully.",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listAdminSessionParticipants(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);
    const sessionId = toPositiveInt(req.params.id, "session id");
    const data = await getSessionParticipants(sessionId, user.userId, "ADMIN");

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listTrainerLiveSessionsController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);
    const data = await getTrainerLiveSessions(user.userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getTrainerLiveSessionController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);
    const sessionId = toPositiveInt(req.params.id, "session id");
    const data = await getAdminOrTrainerLiveSession(
      sessionId,
      user.userId,
      "TRAINER"
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function createTrainerLiveSessionController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);
    const body = toCreateInput(req.body);
    const { trainerId: _ignoredTrainerId, ...trainerInput } = body;

    const data = await createTrainerLiveSession(
      user.userId,
      trainerInput
    );

    return res.status(201).json({
      success: true,
      message: "Live session created successfully.",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function updateTrainerLiveSessionController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);
    const sessionId = toPositiveInt(req.params.id, "session id");
    const data = await updateTrainerLiveSession(
      sessionId,
      user.userId,
      toUpdateInput(req.body)
    );

    return res.status(200).json({
      success: true,
      message: "Live session updated successfully.",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function deleteTrainerLiveSessionController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);
    const sessionId = toPositiveInt(req.params.id, "session id");
    const data = await deleteTrainerLiveSession(sessionId, user.userId);

    return res.status(200).json({
      success: true,
      message: "Live session deleted successfully.",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listTrainerSessionParticipants(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);
    const sessionId = toPositiveInt(req.params.id, "session id");
    const data = await getSessionParticipants(
      sessionId,
      user.userId,
      "TRAINER"
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listStudentLiveSessionsController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);
    const data = await getStudentLiveSessions(user.userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getStudentLiveSessionController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);
    const sessionId = toPositiveInt(req.params.id, "session id");
    const data = await getStudentLiveSession(sessionId, user.userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function joinStudentLiveSessionController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);
    const sessionId = toPositiveInt(req.params.id, "session id");
    const data = await joinLiveSession(sessionId, user.userId);

    return res.status(200).json({
      success: true,
      message: "Live session joined successfully.",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function leaveStudentLiveSessionController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);
    const sessionId = toPositiveInt(req.params.id, "session id");
    const data = await leaveLiveSession(sessionId, user.userId);

    return res.status(200).json({
      success: true,
      message: "Live session participation updated successfully.",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
