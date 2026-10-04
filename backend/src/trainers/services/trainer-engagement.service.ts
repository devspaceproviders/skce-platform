import { db } from "../../prisma/db";
import { listTrainerMeetings } from "../../meetings/services/meeting.service";

export async function getTrainerEngagementsByTrainerId(
  trainerId: number
) {
  const trainer = await db.orm.public.TrainerProfile
    .where({ id: trainerId })
    .first();

  if (!trainer) {
    throw new Error("Trainer profile not found");
  }

  const [permissions, courses, batches, batchStudents, meetings] =
    await Promise.all([
      db.orm.public.TrainerCoursePermission
        .where({ trainerId })
        .all(),
      db.orm.public.Course.all(),
      db.orm.public.Batch
        .where({ trainerId })
        .all(),
      db.orm.public.BatchStudent.all(),
      listTrainerMeetings(trainer.userId),
    ]);

  const courseById = new Map<number, any>(
    (courses as any[]).map((course) => [
      Number(course.id),
      course,
    ])
  );

  const permissionRows = (permissions as any[]).map(
    (permission) => {
      const course = courseById.get(
        Number(permission.courseId)
      );

      return {
        id: permission.id,
        courseId: Number(permission.courseId),
        courseTitle: course?.title ?? "Course",
        courseSlug: course?.slug ?? null,
        canTeach: Boolean(permission.canTeach),
        canManageContent: Boolean(
          permission.canManageContent
        ),
        canCreateAssessments: Boolean(
          permission.canCreateAssessments
        ),
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      };
    }
  );

  const teachingCourseIds = new Set(
    permissionRows
      .filter((item) => item.canTeach)
      .map((item) => item.courseId)
  );

  const responsibleCourses = permissionRows.filter(
    (item) => item.canTeach
  );

  const studentIdsByBatch = new Map<number, Set<number>>();

  for (const row of batchStudents as any[]) {
    const batchId = Number(row.batchId);
    const studentId = Number(row.studentId);

    if (!studentIdsByBatch.has(batchId)) {
      studentIdsByBatch.set(
        batchId,
        new Set<number>()
      );
    }

    studentIdsByBatch
      .get(batchId)!
      .add(studentId);
  }

  const responsibleBatches = (batches as any[])
    .filter((batch) =>
      teachingCourseIds.has(
        Number(batch.courseId)
      )
    )
    .map((batch) => {
      const course = courseById.get(
        Number(batch.courseId)
      );

      return {
        id: Number(batch.id),
        name: batch.name,
        courseId: Number(batch.courseId),
        courseTitle: course?.title ?? "Course",
        startDate: batch.startDate,
        endDate: batch.endDate,
        mode: batch.mode,
        status: batch.status,
        studentCount:
          studentIdsByBatch.get(Number(batch.id))
            ?.size ?? 0,
      };
    });

  const uniqueResponsibleStudentIds =
    new Set<number>();

  for (const batch of responsibleBatches) {
    const ids = studentIdsByBatch.get(batch.id);

    if (!ids) {
      continue;
    }

    for (const studentId of ids) {
      uniqueResponsibleStudentIds.add(studentId);
    }
  }

  const now = Date.now();

  const normalizedMeetings = (meetings as any[]).map(
    (meeting) => ({
      id: Number(meeting.id),
      title: meeting.title,
      description: meeting.description ?? null,
      startAt: meeting.startAt,
      endAt: meeting.endAt,
      meetingUrl: meeting.meetingUrl ?? null,
      meetingPlatform:
        meeting.meetingPlatform ?? null,
      meetingType: meeting.meetingType,
      status: meeting.status,
      courseId:
        meeting.courseId != null
          ? Number(meeting.courseId)
          : null,
      courseTitle:
        meeting.course?.title ?? null,
      batchId:
        meeting.batchId != null
          ? Number(meeting.batchId)
          : null,
      batchName:
        meeting.batch?.name ?? null,
      organizer: meeting.organizer
        ? {
            id: meeting.organizer.id,
            name: meeting.organizer.name,
            email: meeting.organizer.email,
            role: meeting.organizer.role,
          }
        : null,
      participantCount:
        Array.isArray(meeting.participants)
          ? meeting.participants.length
          : 0,
    })
  );

  const upcomingMeetings = normalizedMeetings
    .filter(
      (meeting) =>
        meeting.status === "SCHEDULED" &&
        new Date(meeting.startAt).getTime() >= now
    )
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() -
        new Date(b.startAt).getTime()
    );

  return {
    trainer: {
      id: Number(trainer.id),
      userId: Number(trainer.userId),
    },

    summary: {
      responsibleCourses:
        responsibleCourses.length,
      assignedBatches:
        responsibleBatches.length,
      students:
        uniqueResponsibleStudentIds.size,
      upcomingMeetings:
        upcomingMeetings.length,
      totalMeetings:
        normalizedMeetings.length,
    },

    courses: responsibleCourses,

    permissions: permissionRows,

    batches: responsibleBatches,

    meetings: normalizedMeetings,

    upcomingMeetings,
  };
}

export async function getTrainerEngagementsByUserId(
  userId: number
) {
  const trainer = await db.orm.public.TrainerProfile
    .where({ userId })
    .first();

  if (!trainer) {
    throw new Error("Trainer profile not found");
  }

  return getTrainerEngagementsByTrainerId(
    Number(trainer.id)
  );
}
