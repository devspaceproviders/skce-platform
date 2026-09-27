import { db } from "../../prisma/db";

export type LiveSessionStatus =
  | "SCHEDULED"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED";

export type LiveSessionCreateInput = {
  courseId: number;
  trainerId: number;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  meetingUrl?: string | null;
  recordingUrl?: string | null;
  status?: LiveSessionStatus;
  isPublished?: boolean;
};

export type LiveSessionUpdateInput = Partial<LiveSessionCreateInput>;

export class LiveSessionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "LiveSessionError";
    this.statusCode = statusCode;
  }
}

function cleanOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new LiveSessionError("Expected a string value.");
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseDate(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new LiveSessionError(`${fieldName} is required.`);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new LiveSessionError(`${fieldName} is invalid.`);
  }

  return parsed.toISOString();
}

function validateTimeRange(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new LiveSessionError("Session start/end time is invalid.");
  }

  if (end <= start) {
    throw new LiveSessionError(
      "End time must be later than the start time."
    );
  }
}

function validatePositiveInt(value: unknown, fieldName: string): number {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new LiveSessionError(`${fieldName} must be a positive integer.`);
  }

  return numberValue;
}

function validateUrl(value: string | null | undefined, fieldName: string) {
  if (!value) {
    return;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
  } catch {
    throw new LiveSessionError(`${fieldName} must be a valid HTTP/HTTPS URL.`);
  }
}

function normalizeCreateInput(input: LiveSessionCreateInput): LiveSessionCreateInput {
  const courseId = validatePositiveInt(input.courseId, "courseId");
  const trainerId = validatePositiveInt(input.trainerId, "trainerId");

  if (typeof input.title !== "string" || !input.title.trim()) {
    throw new LiveSessionError("title is required.");
  }

  const title = input.title.trim();
  const description = cleanOptionalString(input.description) ?? null;
  const meetingUrl = cleanOptionalString(input.meetingUrl) ?? null;
  const recordingUrl = cleanOptionalString(input.recordingUrl) ?? null;

  const startAt = parseDate(input.startAt, "startAt");
  const endAt = parseDate(input.endAt, "endAt");
  validateTimeRange(startAt, endAt);
  validateUrl(meetingUrl, "meetingUrl");
  validateUrl(recordingUrl, "recordingUrl");

  const status = input.status ?? "SCHEDULED";
  const allowedStatuses: LiveSessionStatus[] = [
    "SCHEDULED",
    "LIVE",
    "COMPLETED",
    "CANCELLED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new LiveSessionError("Invalid live session status.");
  }

  const isPublished = input.isPublished ?? false;

  if (typeof isPublished !== "boolean") {
    throw new LiveSessionError("isPublished must be a boolean.");
  }

  return {
    courseId,
    trainerId,
    title,
    description,
    startAt,
    endAt,
    meetingUrl,
    recordingUrl,
    status,
    isPublished,
  };
}

function getDisplayStatus(session: {
  status: LiveSessionStatus;
  startAt: string;
  endAt: string;
}): "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED" {
  if (session.status === "CANCELLED") {
    return "CANCELLED";
  }

  if (session.status === "COMPLETED") {
    return "COMPLETED";
  }

  const now = Date.now();
  const start = new Date(session.startAt).getTime();
  const end = new Date(session.endAt).getTime();

  if (now < start) {
    return "UPCOMING";
  }

  if (now < end) {
    return "LIVE";
  }

  return "COMPLETED";
}

function decorateSession(
  session: any,
  courseMap: Map<number, any>,
  trainerMap: Map<number, any>,
  participation?: any,
  participantCount?: number
) {
  const course = courseMap.get(session.courseId) ?? null;
  const trainer = trainerMap.get(session.trainerId) ?? null;

  return {
    ...session,
    displayStatus: getDisplayStatus(session),
    course: course
      ? {
          id: course.id,
          slug: course.slug,
          title: course.title,
        }
      : null,
    trainer: trainer
      ? {
          id: trainer.id,
          userId: trainer.userId,
          name: trainer.name,
          email: trainer.email,
        }
      : null,
    ...(participation
      ? {
          participation: {
            id: participation.id,
            joinedAt: participation.joinedAt,
            leftAt: participation.leftAt,
            participated: participation.participated,
          },
        }
      : {}),
    ...(participantCount !== undefined ? { participantCount } : {}),
  };
}

async function getCourseMap() {
  const courses = await db.orm.public.Course.all();
  return new Map(courses.map((course) => [course.id, course]));
}

async function getTrainerMap() {
  const [trainers, users] = await Promise.all([
    db.orm.public.TrainerProfile.all(),
    db.orm.public.User.all(),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user]));

  return new Map(
    trainers.map((trainer) => {
      const user = userMap.get(trainer.userId);
      return [
        trainer.id,
        {
          ...trainer,
          name: user?.name ?? "",
          email: user?.email ?? "",
        },
      ];
    })
  );
}

async function getSessionOrThrow(sessionId: number) {
  const session = await db.orm.public.LiveSession.first({ id: sessionId });

  if (!session) {
    throw new LiveSessionError("Live session not found.", 404);
  }

  return session;
}

async function getTrainerProfileOrThrow(userId: number) {
  const trainer = await db.orm.public.TrainerProfile.first({ userId });

  if (!trainer) {
    throw new LiveSessionError("Trainer profile not found.", 404);
  }

  return trainer;
}

async function getStudentCourseIds(userId: number): Promise<Set<number>> {
  const enrollments = await db.orm.public.Enrollment.where({
    userId,
    status: "ACTIVE",
  }).all();

  const directCourseIds = enrollments
    .map((enrollment) => enrollment.courseId)
    .filter((courseId): courseId is number => courseId !== null);

  const packageIds = enrollments
    .map((enrollment) => enrollment.packageId)
    .filter((packageId): packageId is number => packageId !== null);

  const packageCourses = await db.orm.public.PackageCourse.all();

  const courseIds = new Set<number>(directCourseIds);

  for (const packageCourse of packageCourses) {
    if (packageIds.includes(packageCourse.packageId)) {
      courseIds.add(packageCourse.courseId);
    }
  }

  return courseIds;
}

export async function getAdminLiveSessions() {
  const [sessions, courseMap, trainerMap, participations] = await Promise.all([
    db.orm.public.LiveSession.orderBy((session) => session.startAt.asc()).all(),
    getCourseMap(),
    getTrainerMap(),
    db.orm.public.LiveSessionParticipation.all(),
  ]);

  const participantCounts = new Map<number, number>();

  for (const participation of participations) {
    participantCounts.set(
      participation.sessionId,
      (participantCounts.get(participation.sessionId) ?? 0) + 1
    );
  }

  return sessions.map((session) =>
    decorateSession(
      session,
      courseMap,
      trainerMap,
      undefined,
      participantCounts.get(session.id) ?? 0
    )
  );
}

export async function getTrainerLiveSessions(userId: number) {
  const trainer = await getTrainerProfileOrThrow(userId);

  const [sessions, courseMap, trainerMap, participations] = await Promise.all([
    db.orm.public.LiveSession.where({
      trainerId: trainer.id,
    })
      .orderBy((session) => session.startAt.asc())
      .all(),
    getCourseMap(),
    getTrainerMap(),
    db.orm.public.LiveSessionParticipation.all(),
  ]);

  const participantCounts = new Map<number, number>();

  for (const participation of participations) {
    participantCounts.set(
      participation.sessionId,
      (participantCounts.get(participation.sessionId) ?? 0) + 1
    );
  }

  return sessions.map((session) =>
    decorateSession(
      session,
      courseMap,
      trainerMap,
      undefined,
      participantCounts.get(session.id) ?? 0
    )
  );
}

export async function getStudentLiveSessions(userId: number) {
  const courseIds = await getStudentCourseIds(userId);

  if (courseIds.size === 0) {
    return [];
  }

  const [sessions, courseMap, trainerMap, participations] = await Promise.all([
    db.orm.public.LiveSession.all(),
    getCourseMap(),
    getTrainerMap(),
    db.orm.public.LiveSessionParticipation.where({ userId }).all(),
  ]);

  const participationMap = new Map(
    participations.map((participation) => [
      participation.sessionId,
      participation,
    ])
  );

  return sessions
    .filter(
      (session) =>
        courseIds.has(session.courseId) &&
        session.isPublished &&
        session.status !== "CANCELLED"
    )
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() -
        new Date(b.startAt).getTime()
    )
    .map((session) =>
      decorateSession(
        session,
        courseMap,
        trainerMap,
        participationMap.get(session.id)
      )
    );
}

export async function getLiveSessionOptions() {
  const [courses, trainers, users] = await Promise.all([
    db.orm.public.Course.where({ isActive: true })
      .orderBy((course) => course.title.asc())
      .all(),
    db.orm.public.TrainerProfile.all(),
    db.orm.public.User.all(),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user]));

  return {
    courses: courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
    })),
    trainers: trainers
      .map((trainer) => {
        const user = userMap.get(trainer.userId);
        return {
          id: trainer.id,
          userId: trainer.userId,
          name: user?.name ?? "",
          email: user?.email ?? "",
        };
      })
      .filter((trainer) => trainer.name),
  };
}

export async function getAdminOrTrainerLiveSession(
  sessionId: number,
  userId: number,
  role: "ADMIN" | "TRAINER"
) {
  const session = await getSessionOrThrow(sessionId);
  const courseMap = await getCourseMap();
  const trainerMap = await getTrainerMap();

  if (role === "TRAINER") {
    const trainer = await getTrainerProfileOrThrow(userId);

    if (session.trainerId !== trainer.id) {
      throw new LiveSessionError("You do not have access to this session.", 403);
    }
  }

  const participationCount = (
    await db.orm.public.LiveSessionParticipation.where({ sessionId }).all()
  ).length;

  return decorateSession(
    session,
    courseMap,
    trainerMap,
    undefined,
    participationCount
  );
}

export async function getStudentLiveSession(
  sessionId: number,
  userId: number
) {
  const session = await getSessionOrThrow(sessionId);

  const courseIds = await getStudentCourseIds(userId);

  if (!courseIds.has(session.courseId) || !session.isPublished) {
    throw new LiveSessionError("You do not have access to this session.", 403);
  }

  if (session.status === "CANCELLED") {
    throw new LiveSessionError("This session has been cancelled.", 400);
  }

  const [courseMap, trainerMap, participation] = await Promise.all([
    getCourseMap(),
    getTrainerMap(),
    db.orm.public.LiveSessionParticipation.first({
      sessionId,
      userId,
    }),
  ]);

  return decorateSession(
    session,
    courseMap,
    trainerMap,
    participation ?? undefined
  );
}

export async function createAdminLiveSession(input: LiveSessionCreateInput) {
  const normalized = normalizeCreateInput(input);

  const [course, trainer] = await Promise.all([
    db.orm.public.Course.first({ id: normalized.courseId }),
    db.orm.public.TrainerProfile.first({ id: normalized.trainerId }),
  ]);

  if (!course) {
    throw new LiveSessionError("Course not found.", 404);
  }

  if (!trainer) {
    throw new LiveSessionError("Trainer not found.", 404);
  }

  return db.orm.public.LiveSession.create(normalized);
}

export async function createTrainerLiveSession(
  userId: number,
  input: Omit<LiveSessionCreateInput, "trainerId">
) {
  const trainer = await getTrainerProfileOrThrow(userId);

  return createAdminLiveSession({
    ...input,
    trainerId: trainer.id,
  });
}

export async function updateAdminLiveSession(
  sessionId: number,
  input: LiveSessionUpdateInput
) {
  await getSessionOrThrow(sessionId);

  const changes: LiveSessionUpdateInput = {};

  if (input.courseId !== undefined) {
    changes.courseId = validatePositiveInt(input.courseId, "courseId");

    const course = await db.orm.public.Course.first({ id: changes.courseId });

    if (!course) {
      throw new LiveSessionError("Course not found.", 404);
    }
  }

  if (input.trainerId !== undefined) {
    changes.trainerId = validatePositiveInt(input.trainerId, "trainerId");

    const trainer = await db.orm.public.TrainerProfile.first({
      id: changes.trainerId,
    });

    if (!trainer) {
      throw new LiveSessionError("Trainer not found.", 404);
    }
  }

  if (input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      throw new LiveSessionError("title cannot be empty.");
    }

    changes.title = input.title.trim();
  }

  if (input.description !== undefined) {
    changes.description = cleanOptionalString(input.description) ?? null;
  }

  if (input.meetingUrl !== undefined) {
    changes.meetingUrl = cleanOptionalString(input.meetingUrl) ?? null;
    validateUrl(changes.meetingUrl, "meetingUrl");
  }

  if (input.recordingUrl !== undefined) {
    changes.recordingUrl = cleanOptionalString(input.recordingUrl) ?? null;
    validateUrl(changes.recordingUrl, "recordingUrl");
  }

  if (input.startAt !== undefined) {
    changes.startAt = parseDate(input.startAt, "startAt");
  }

  if (input.endAt !== undefined) {
    changes.endAt = parseDate(input.endAt, "endAt");
  }

  if (changes.startAt !== undefined || changes.endAt !== undefined) {
    const existing = await getSessionOrThrow(sessionId);

    validateTimeRange(
      changes.startAt ?? existing.startAt,
      changes.endAt ?? existing.endAt
    );
  }

  if (input.status !== undefined) {
    const allowedStatuses: LiveSessionStatus[] = [
      "SCHEDULED",
      "LIVE",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(input.status)) {
      throw new LiveSessionError("Invalid live session status.");
    }

    changes.status = input.status;
  }

  if (input.isPublished !== undefined) {
    if (typeof input.isPublished !== "boolean") {
      throw new LiveSessionError("isPublished must be a boolean.");
    }

    changes.isPublished = input.isPublished;
  }

  if (Object.keys(changes).length === 0) {
    throw new LiveSessionError("No changes were provided.");
  }

  const updated = await db.orm.public.LiveSession.where({ id: sessionId }).update(
    changes
  );

  if (!updated) {
    throw new LiveSessionError("Live session not found.", 404);
  }

  return updated;
}

export async function updateTrainerLiveSession(
  sessionId: number,
  userId: number,
  input: LiveSessionUpdateInput
) {
  const session = await getSessionOrThrow(sessionId);
  const trainer = await getTrainerProfileOrThrow(userId);

  if (session.trainerId !== trainer.id) {
    throw new LiveSessionError("You do not have access to this session.", 403);
  }

  const safeInput: LiveSessionUpdateInput = {
  ...input,
};

delete safeInput.trainerId;

return updateAdminLiveSession(sessionId, safeInput);

}

export async function deleteAdminLiveSession(sessionId: number) {
  const deleted = await db.orm.public.LiveSession.where({ id: sessionId }).delete();

  if (!deleted) {
    throw new LiveSessionError("Live session not found.", 404);
  }

  return deleted;
}

export async function deleteTrainerLiveSession(
  sessionId: number,
  userId: number
) {
  const session = await getSessionOrThrow(sessionId);
  const trainer = await getTrainerProfileOrThrow(userId);

  if (session.trainerId !== trainer.id) {
    throw new LiveSessionError("You do not have access to this session.", 403);
  }

  return deleteAdminLiveSession(sessionId);
}

export async function joinLiveSession(
  sessionId: number,
  userId: number
) {
  const session = await getSessionOrThrow(sessionId);

  const courseIds = await getStudentCourseIds(userId);

  if (!courseIds.has(session.courseId) || !session.isPublished) {
    throw new LiveSessionError("You do not have access to this session.", 403);
  }

  if (session.status === "CANCELLED") {
    throw new LiveSessionError("This session has been cancelled.", 400);
  }

  if (session.status === "COMPLETED" || Date.now() >= new Date(session.endAt).getTime()) {
    throw new LiveSessionError("This live session has already ended.", 400);
  }

  if (!session.meetingUrl) {
    throw new LiveSessionError("A meeting link is not configured for this session.");
  }

  const now = new Date().toISOString();

  const participation = await db.orm.public.LiveSessionParticipation.upsert({
    create: {
      sessionId,
      userId,
      joinedAt: now,
      leftAt: null,
      participated: true,
    },
    update: {
      joinedAt: now,
      leftAt: null,
      participated: true,
    },
    conflictOn: {
      sessionId,
      userId,
    },
  });

  return {
    sessionId: session.id,
    meetingUrl: session.meetingUrl,
    joinedAt: participation.joinedAt,
    participationId: participation.id,
  };
}

export async function leaveLiveSession(
  sessionId: number,
  userId: number
) {
  const session = await getSessionOrThrow(sessionId);

  const courseIds = await getStudentCourseIds(userId);

  if (!courseIds.has(session.courseId) || !session.isPublished) {
    throw new LiveSessionError("You do not have access to this session.", 403);
  }

  const participation = await db.orm.public.LiveSessionParticipation.first({
    sessionId,
    userId,
  });

  if (!participation) {
    throw new LiveSessionError("No participation record was found for this session.", 404);
  }

  const updated = await db.orm.public.LiveSessionParticipation.where({
    id: participation.id,
  }).update({
    leftAt: new Date().toISOString(),
    participated: true,
  });

  return updated;
}

export async function getSessionParticipants(
  sessionId: number,
  userId: number,
  role: "ADMIN" | "TRAINER"
) {
  const session = await getSessionOrThrow(sessionId);

  if (role === "TRAINER") {
    const trainer = await getTrainerProfileOrThrow(userId);

    if (session.trainerId !== trainer.id) {
      throw new LiveSessionError("You do not have access to this session.", 403);
    }
  }

  const [participations, users] = await Promise.all([
    db.orm.public.LiveSessionParticipation.where({ sessionId }).all(),
    db.orm.public.User.all(),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user]));

  return participations.map((participation) => {
    const user = userMap.get(participation.userId);

    return {
      id: participation.id,
      sessionId: participation.sessionId,
      userId: participation.userId,
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? null,
      joinedAt: participation.joinedAt,
      leftAt: participation.leftAt,
      participated: participation.participated,
    };
  });
}
