import { db } from "../../prisma/db";

import {

  createTrainerActivity,

  type TrainerActivityAction,

} from "../../trainers/services/trainer-activity.service";







export type MeetingType =



  | "BATCH_MEETING"



  | "STUDENT_MEETING"



  | "INTERNAL_MEETING"



  | "ONE_TO_ONE"



  | "OTHER";







export type MeetingStatus =



  | "SCHEDULED"



  | "COMPLETED"



  | "CANCELLED";





export type MeetingPlatform =



  | "GOOGLE_MEET"



  | "MICROSOFT_TEAMS"



  | "ZOOM"



  | "WHATSAPP"



  | "OTHER";







export interface CreateMeetingInput {



  title: string;



  description?: string | null;



  startAt: string;



  endAt: string;



  meetingUrl?: string | null;



  meetingPlatform?: MeetingPlatform | null;



  meetingType: MeetingType;



  status?: MeetingStatus;



  courseId?: number | null;



  batchId?: number | null;



  participantUserIds?: number[];



}







export interface UpdateMeetingInput {



  title?: string;



  description?: string | null;



  startAt?: string;



  endAt?: string;



  meetingUrl?: string | null;



  meetingPlatform?: MeetingPlatform | null;



  meetingType?: MeetingType;



  status?: MeetingStatus;



  courseId?: number | null;



  batchId?: number | null;



  participantUserIds?: number[];



}







export class MeetingError extends Error {



  statusCode: number;







  constructor(message: string, statusCode = 400) {



    super(message);



    this.name = "MeetingError";



    this.statusCode = statusCode;



  }



}







const MEETING_TYPES: MeetingType[] = [



  "BATCH_MEETING",



  "STUDENT_MEETING",



  "INTERNAL_MEETING",



  "ONE_TO_ONE",



  "OTHER",



];







const MEETING_STATUSES: MeetingStatus[] = [



  "SCHEDULED",



  "COMPLETED",



  "CANCELLED",



];





const MEETING_PLATFORMS: MeetingPlatform[] = [



  "GOOGLE_MEET",



  "MICROSOFT_TEAMS",



  "ZOOM",



  "WHATSAPP",



  "OTHER",



];







function isMeetingType(value: unknown): value is MeetingType {



  return (



    typeof value === "string" &&



    MEETING_TYPES.includes(value as MeetingType)



  );



}







function isMeetingStatus(value: unknown): value is MeetingStatus {



  return (



    typeof value === "string" &&



    MEETING_STATUSES.includes(value as MeetingStatus)



  );



}





function isMeetingPlatform(



  value: unknown



): value is MeetingPlatform {



  return (



    typeof value === "string" &&



    MEETING_PLATFORMS.includes(value as MeetingPlatform)



  );



}







function parsePositiveInt(



  value: unknown,



  fieldName: string



): number {



  const parsed =



    typeof value === "number"



      ? value



      : Number(value);







  if (!Number.isInteger(parsed) || parsed <= 0) {



    throw new MeetingError(



      `${fieldName} must be a positive integer.`,



      400



    );



  }







  return parsed;



}







function parseOptionalPositiveInt(



  value: unknown,



  fieldName: string



): number | null {



  if (value === undefined || value === null || value === "") {



    return null;



  }







  return parsePositiveInt(value, fieldName);



}







function parseDate(



  value: unknown,



  fieldName: string



): string {



  if (typeof value !== "string" || !value.trim()) {



    throw new MeetingError(



      `${fieldName} is required.`,



      400



    );



  }







  const date = new Date(value);







  if (Number.isNaN(date.getTime())) {



    throw new MeetingError(



      `${fieldName} must be a valid date/time.`,



      400



    );



  }







  return date.toISOString();



}







function validateTimeRange(



  startAt: string,



  endAt: string



): void {



  const start = new Date(startAt).getTime();



  const end = new Date(endAt).getTime();







  if (end <= start) {



    throw new MeetingError(



      "End time must be after start time.",



      400



    );



  }



}







function normalizeTitle(value: unknown): string {



  if (typeof value !== "string" || !value.trim()) {



    throw new MeetingError(



      "Meeting title is required.",



      400



    );



  }







  const title = value.trim();







  if (title.length > 255) {



    throw new MeetingError(



      "Meeting title cannot exceed 255 characters.",



      400



    );



  }







  return title;



}







function normalizeOptionalText(



  value: unknown,



  fieldName: string,



  maxLength: number



): string | null {



  if (value === undefined || value === null) {



    return null;



  }







  if (typeof value !== "string") {



    throw new MeetingError(



      `${fieldName} must be a string.`,



      400



    );



  }







  const text = value.trim();







  if (!text) {



    return null;



  }







  if (text.length > maxLength) {



    throw new MeetingError(



      `${fieldName} cannot exceed ${maxLength} characters.`,



      400



    );



  }







  return text;



}







function normalizeMeetingUrl(



  value: unknown



): string | null {



  const url = normalizeOptionalText(



    value,



    "Meeting URL",



    1000



  );







  if (!url) {



    return null;



  }







  try {



    const parsed = new URL(url);







    if (



      parsed.protocol !== "http:" &&



      parsed.protocol !== "https:"



    ) {



      throw new Error("Invalid protocol");



    }



  } catch {



    throw new MeetingError(



      "Meeting URL must be a valid HTTP or HTTPS URL.",



      400



    );



  }







  return url;



}







function normalizeParticipantIds(



  value: unknown



): number[] {



  if (value === undefined || value === null) {



    return [];



  }







  if (!Array.isArray(value)) {



    throw new MeetingError(



      "participantUserIds must be an array.",



      400



    );



  }







  const ids = value.map((item) =>



    parsePositiveInt(item, "Participant user ID")



  );







  return [...new Set(ids)];



}







function assertMeetingTypeRules(



  meetingType: MeetingType,



  batchId: number | null,



  participantUserIds: number[]



): void {



  if (



    meetingType === "BATCH_MEETING" &&



    !batchId



  ) {



    throw new MeetingError(



      "Batch meetings require a batch.",



      400



    );



  }







  if (



    meetingType === "INTERNAL_MEETING" &&



    batchId



  ) {



    throw new MeetingError(



      "Internal meetings cannot be linked to a batch.",



      400



    );



  }







  if (



    meetingType === "INTERNAL_MEETING" &&



    participantUserIds.length === 0



  ) {



    throw new MeetingError(



      "Internal meetings require at least one participant.",



      400



    );



  }







  if (



    (meetingType === "STUDENT_MEETING" ||



      meetingType === "ONE_TO_ONE") &&



    participantUserIds.length === 0



  ) {



    throw new MeetingError(



      `${meetingType === "ONE_TO_ONE" ? "One-to-one" : "Student"} meetings require at least one participant.`,



      400



    );



  }



}







async function getUserById(userId: number) {



  const user = await db.orm.public.User



    .where({ id: userId })



    .first();







  if (!user) {



    throw new MeetingError(



      `User ${userId} was not found.`,



      404



    );



  }







  return user;



}







async function getCourseById(courseId: number) {



  const course = await db.orm.public.Course



    .where({ id: courseId })



    .first();







  if (!course) {



    throw new MeetingError(



      `Course ${courseId} was not found.`,



      404



    );



  }







  return course;



}







async function getBatchById(batchId: number) {



  const batch = await db.orm.public.Batch



    .where({ id: batchId })



    .first();







  if (!batch) {



    throw new MeetingError(



      `Batch ${batchId} was not found.`,



      404



    );



  }







  return batch;



}







async function getTrainerProfileByUserId(



  userId: number



) {



  const trainer = await db.orm.public.TrainerProfile



    .where({ userId })



    .first();







  if (!trainer) {



    throw new MeetingError(



      "Trainer profile was not found for the authenticated user.",



      404



    );



  }







  return trainer;



}







async function getTrainerIdsForMeeting(

  meeting: any

): Promise<number[]> {

  const trainerIds = new Set<number>();



  if (meeting.batchId) {

    const batch = await db.orm.public.Batch

      .where({ id: meeting.batchId })

      .first();



    if (batch?.trainerId) {

      trainerIds.add(batch.trainerId);

    }

  }



  const participants =

    await db.orm.public.MeetingParticipant

      .where({ meetingId: meeting.id })

      .all();



  if (participants.length > 0) {

    const users = await db.orm.public.User.all();

    const trainers = await db.orm.public.TrainerProfile.all();



    const userById = new Map(

      users.map((user: any) => [user.id, user])

    );



    const trainerByUserId = new Map(

      trainers.map((trainer: any) => [

        trainer.userId,

        trainer.id,

      ])

    );



    for (const participant of participants) {

      const user = userById.get(participant.userId);



      if (user?.role !== "TRAINER") {

        continue;

      }



      const trainerId = trainerByUserId.get(user.id);



      if (trainerId) {

        trainerIds.add(trainerId);

      }

    }

  }



  return [...trainerIds];

}



async function recordMeetingTrainerActivity(

  actorUserId: number,

  meeting: any,

  action: TrainerActivityAction,

  description: string,

  additionalTrainerIds: number[] = [],

  metadata?: Record<string, unknown>

) {

  try {

    const trainerIds = new Set<number>(

      additionalTrainerIds

    );



    const actor = await getUserById(actorUserId);



    if (actor.role === "TRAINER") {

      const trainer =

        await getTrainerProfileByUserId(actorUserId);



      trainerIds.add(trainer.id);

    }



    for (const trainerId of

      await getTrainerIdsForMeeting(meeting)) {

      trainerIds.add(trainerId);

    }



    for (const trainerId of trainerIds) {

      try {

        await createTrainerActivity({

          trainerId,

          actorUserId,

          action,

          entityType: "MEETING",

          entityId: meeting.id,

          description,

          ...(metadata !== undefined ? { metadata } : {}),

        });

      } catch (error) {

        console.error(

          "Failed to record meeting trainer activity:",

          error

        );

      }

    }

  } catch (error) {

    console.error(

      "Failed to prepare meeting trainer activity:",

      error

    );

  }

}





async function getStudentProfileByUserId(



  userId: number



) {



  return db.orm.public.StudentProfile



    .where({ userId })



    .first();



}







async function getBatchStudentUserIds(



  batchId: number



): Promise<number[]> {



  const batchStudents = await db.orm.public.BatchStudent



    .where({ batchId })



    .all();







  if (batchStudents.length === 0) {



    return [];



  }







  const studentProfileIds = batchStudents.map(



    (item: any) => item.studentId



  );







  const studentProfiles =



    await db.orm.public.StudentProfile.all();







  const profileById = new Map(



    studentProfiles.map((profile: any) => [



      profile.id,



      profile,



    ])



  );







  const userIds: number[] = [];







  for (const profileId of studentProfileIds) {



    const profile = profileById.get(profileId);







    if (profile?.userId) {



      userIds.push(profile.userId);



    }



  }







  return [...new Set(userIds)];



}







async function validateParticipantUsers(



  organizerUserId: number,



  participantUserIds: number[],



  meetingType: MeetingType



): Promise<any[]> {



  if (participantUserIds.length === 0) {



    return [];



  }







  const users = await db.orm.public.User.all();







  const userById = new Map(



    users.map((user: any) => [user.id, user])



  );







  const participants: any[] = [];







  for (const userId of participantUserIds) {



    const user = userById.get(userId);







    if (!user) {



      throw new MeetingError(



        `Participant user ${userId} was not found.`,



        404



      );



    }







    if (!user.isActive) {



      throw new MeetingError(



        `Participant user ${userId} is inactive.`,



        400



      );



    }







    if (user.id === organizerUserId) {



      continue;



    }







    if (



      meetingType === "STUDENT_MEETING" ||



      meetingType === "ONE_TO_ONE" ||



      meetingType === "BATCH_MEETING"



    ) {



      if (user.role !== "STUDENT") {



        throw new MeetingError(



          `User ${userId} must be a student for this meeting type.`,



          400



        );



      }



    }







    participants.push(user);



  }







  return participants;



}







async function validateTrainerBatchAccess(



  userId: number,



  batchId: number,



  courseId: number | null



): Promise<any> {



  const trainer = await getTrainerProfileByUserId(userId);



  const batch = await getBatchById(batchId);







  if (batch.trainerId !== trainer.id) {



    throw new MeetingError(



      "You are not the trainer assigned to this batch.",



      403



    );



  }







  if (



    courseId !== null &&



    batch.courseId !== courseId



  ) {



    throw new MeetingError(



      "The selected course does not belong to the selected batch.",



      400



    );



  }







  return batch;



}







async function validateTrainerStudentParticipants(



  trainerUserId: number,



  participantUserIds: number[],



  batchId: number | null



): Promise<void> {



  if (participantUserIds.length === 0) {



    return;



  }







  const trainer = await getTrainerProfileByUserId(



    trainerUserId



  );







  if (batchId) {



    const batchStudentUserIds =



      await getBatchStudentUserIds(batchId);







    const allowed = new Set(batchStudentUserIds);







    for (const userId of participantUserIds) {



      if (!allowed.has(userId)) {



        throw new MeetingError(



          `Student ${userId} is not assigned to the selected batch.`,



          403



        );



      }



    }







    return;



  }







  const batches = await db.orm.public.Batch



    .where({ trainerId: trainer.id })



    .all();







  if (batches.length === 0) {



    throw new MeetingError(



      "You do not have any assigned batches.",



      403



    );



  }







  const allowedStudentUserIds = new Set<number>();







  for (const batch of batches as any[]) {



    const studentUserIds =



      await getBatchStudentUserIds(batch.id);







    for (const userId of studentUserIds) {



      allowedStudentUserIds.add(userId);



    }



  }







  for (const userId of participantUserIds) {



    if (!allowedStudentUserIds.has(userId)) {



      throw new MeetingError(



        `Student ${userId} is not associated with your assigned batches.`,



        403



      );



    }



  }



}







interface ConflictContext {



  organizerUserId: number;

  role: "ADMIN" | "TRAINER";



  participantUserIds: number[];



  batchId: number | null;



  startAt: string;



  endAt: string;



  excludeMeetingId?: number;



}







interface ExistingMeetingConflict {



  meeting: any;



  userId?: number;



  batchId?: number;



  reason: string;



}







function overlaps(



  newStart: number,



  newEnd: number,



  existingStart: number,



  existingEnd: number



): boolean {



  return (



    newStart < existingEnd &&



    newEnd > existingStart



  );



}







async function getAffectedUserIds(



  meeting: any



): Promise<number[]> {



  const ids = new Set<number>();







  if (meeting.organizerUserId) {

    // The organizer is a calendar resource. An organizer cannot attend
    // two overlapping meetings at the same time.
    //
    // This applies to ADMIN meetings as well: the admin who schedules the
    // meeting is expected to conduct/attend it, so different participants
    // do not make two overlapping admin meetings valid.
    ids.add(meeting.organizerUserId);
  }







  const participants =



    await db.orm.public.MeetingParticipant



      .where({ meetingId: meeting.id })



      .all();







  for (const participant of participants as any[]) {



    ids.add(participant.userId);



  }







  if (meeting.batchId) {



    const batchUserIds =



      await getBatchStudentUserIds(meeting.batchId);







    for (const userId of batchUserIds) {



      ids.add(userId);



    }







    const batch =



      await db.orm.public.Batch



        .where({ id: meeting.batchId })



        .first();







    if (batch?.trainerId) {



      const trainer =



        await db.orm.public.TrainerProfile



          .where({ id: batch.trainerId })



          .first();







      if (trainer?.userId) {



        ids.add(trainer.userId);



      }



    }



  }







  return [...ids];



}







async function checkMeetingConflicts(



  context: ConflictContext



): Promise<void> {



  const newStart = new Date(



    context.startAt



  ).getTime();







  const newEnd = new Date(



    context.endAt



  ).getTime();







  const scheduledMeetings =



    await db.orm.public.Meeting



      .where({ status: "SCHEDULED" })



      .all();







  const relevantUserIds = new Set<number>([
    // The organizer is always a required scheduling resource.
    // Different participant lists do not make overlapping meetings valid
    // when the same organizer would have to attend both.
    context.organizerUserId,
    ...context.participantUserIds,
  ]);







  if (context.batchId) {



    const batchUserIds =



      await getBatchStudentUserIds(context.batchId);







    for (const userId of batchUserIds) {



      relevantUserIds.add(userId);



    }







    const batch =



      await db.orm.public.Batch



        .where({ id: context.batchId })



        .first();







    if (batch?.trainerId) {



      const trainer =



        await db.orm.public.TrainerProfile



          .where({ id: batch.trainerId })



          .first();







      if (trainer?.userId) {



        relevantUserIds.add(trainer.userId);



      }



    }



  }







  for (const existing of scheduledMeetings as any[]) {



    if (



      context.excludeMeetingId &&



      existing.id === context.excludeMeetingId



    ) {



      continue;



    }







    if (!overlaps(



      newStart,



      newEnd,



      new Date(existing.startAt).getTime(),



      new Date(existing.endAt).getTime()



    )) {



      continue;



    }







    if (



      context.batchId &&



      existing.batchId === context.batchId



    ) {



      throw new MeetingError(



        `The selected batch already has another scheduled meeting "${existing.title}" during this time.`,



        409



      );



    }







    const existingUserIds =



      await getAffectedUserIds(existing);







    for (const userId of existingUserIds) {



      if (relevantUserIds.has(userId)) {



        throw new MeetingError(



          `There is already a scheduled meeting "${existing.title}" involving the organizer or a participant during this time.`,



          409



        );



      }



    }



  }



}







async function buildMeetingResult(



  meeting: any



) {



  const participants =



    await db.orm.public.MeetingParticipant



      .where({ meetingId: meeting.id })



      .all();







  const users = await db.orm.public.User.all();







  const userById = new Map(



    users.map((user: any) => [



      user.id,



      user,



    ])



  );







  const participantDetails =



    (participants as any[]).map((participant) => {



      const user = userById.get(



        participant.userId



      );







      return {



        id: participant.id,



        userId: participant.userId,



        name: user?.name ?? null,



        email: user?.email ?? null,



        role: user?.role ?? null,



        createdAt: participant.createdAt,



      };



    });







  const organizer =



    userById.get(meeting.organizerUserId);







  let course = null;







  if (meeting.courseId) {



    course =



      await db.orm.public.Course



        .where({ id: meeting.courseId })



        .first();



  }







  let batch = null;







  if (meeting.batchId) {



    batch =



      await db.orm.public.Batch



        .where({ id: meeting.batchId })



        .first();



  }







  return {



    ...meeting,



    organizer: organizer



      ? {



          id: organizer.id,



          name: organizer.name,



          email: organizer.email,



          role: organizer.role,



        }



      : null,



    participants: participantDetails,



    course: course



      ? {



          id: course.id,



          slug: course.slug,



          title: course.title,



        }



      : null,



    batch: batch



      ? {



          id: batch.id,



          name: batch.name,



          courseId: batch.courseId,



          trainerId: batch.trainerId,



        }



      : null,



  };



}







async function getMeetingOrThrow(



  meetingId: number



) {



  const meeting =



    await db.orm.public.Meeting



      .where({ id: meetingId })



      .first();







  if (!meeting) {



    throw new MeetingError(



      `Meeting ${meetingId} was not found.`,



      404



    );



  }







  return meeting;



}







async function validateOrganizer(



  userId: number,



  role: "ADMIN" | "TRAINER" | "STUDENT"



): Promise<any> {



  const user = await getUserById(userId);







  if (user.role !== role) {



    throw new MeetingError(



      "Authenticated user role does not match the requested operation.",



      403



    );



  }







  if (!user.isActive) {



    throw new MeetingError(



      "The authenticated user is inactive.",



      403



    );



  }







  return user;



}







export async function createMeeting(



  userId: number,



  role: "ADMIN" | "TRAINER",



  input: CreateMeetingInput



) {



  const organizer =



    await validateOrganizer(userId, role);







  const title = normalizeTitle(input.title);







  const startAt = parseDate(



    input.startAt,



    "Start time"



  );







  const endAt = parseDate(



    input.endAt,



    "End time"



  );







  validateTimeRange(startAt, endAt);







  if (!isMeetingType(input.meetingType)) {



    throw new MeetingError(



      "Invalid meeting type.",



      400



    );



  }







  const status =



    input.status ?? "SCHEDULED";







  if (!isMeetingStatus(status)) {



    throw new MeetingError(



      "Invalid meeting status.",



      400



    );



  }







  const meetingPlatform =



    input.meetingPlatform ?? null;







  if (



    meetingPlatform !== null &&



    !isMeetingPlatform(meetingPlatform)



  ) {



    throw new MeetingError(



      "Invalid meeting platform.",



      400



    );



  }







  const description =



    normalizeOptionalText(



      input.description,



      "Description",



      5000



    );







  const meetingUrl =



    normalizeMeetingUrl(



      input.meetingUrl



    );







  const courseId =



    parseOptionalPositiveInt(



      input.courseId,



      "Course ID"



    );







  const batchId =



    parseOptionalPositiveInt(



      input.batchId,



      "Batch ID"



    );







  const participantUserIds =



    normalizeParticipantIds(



      input.participantUserIds



    );







  assertMeetingTypeRules(



    input.meetingType,



    batchId,



    participantUserIds



  );







  if (



    input.meetingType === "BATCH_MEETING" &&



    !batchId



  ) {



    throw new MeetingError(



      "Batch meeting requires a batch.",



      400



    );



  }







  if (courseId) {



    await getCourseById(courseId);



  }







  let batch = null;







  if (batchId) {



    batch = await getBatchById(batchId);







    if (



      courseId !== null &&



      batch.courseId !== courseId



    ) {



      throw new MeetingError(



        "The selected course does not match the selected batch.",



        400



      );



    }



  }







  const participants =



    await validateParticipantUsers(



      userId,



      participantUserIds,



      input.meetingType



    );







  if (role === "TRAINER") {



    if (batchId) {



      await validateTrainerBatchAccess(



        userId,



        batchId,



        courseId



      );



    }







    if (



      input.meetingType === "STUDENT_MEETING" ||



      input.meetingType === "ONE_TO_ONE" ||



      input.meetingType === "BATCH_MEETING"



    ) {



      await validateTrainerStudentParticipants(



        userId,



        participantUserIds,



        batchId



      );



    }



  }







  const finalParticipantUserIds =



    input.meetingType === "BATCH_MEETING"



      ? []



      : participants.map(



          (participant: any) => participant.id



        );







  await checkMeetingConflicts({



    organizerUserId: userId,



    role,

    participantUserIds:



      finalParticipantUserIds,



    batchId,



    startAt,



    endAt,



  });







  const created =



    await db.transaction(



      async (tx: any) => {



        const meeting =



          await tx.orm.public.Meeting.create({



            organizerUserId: userId,



            title,



            description,



            startAt,



            endAt,



            meetingUrl,



            meetingPlatform,



            meetingType: input.meetingType,



            status,



            courseId,



            batchId,



          });







        if (



          finalParticipantUserIds.length > 0



        ) {



          for (



            const participantUserId of



              finalParticipantUserIds



          ) {



            await tx.orm.public.MeetingParticipant.create(



              {



                meetingId: meeting.id,



                userId: participantUserId,



              }



            );



          }



        }







        return meeting;



      }



    );







  const createActivityAction: TrainerActivityAction =

    status === "CANCELLED"

      ? "CANCELLED"

      : status === "COMPLETED"

        ? "COMPLETED"

        : "SCHEDULED";



  await recordMeetingTrainerActivity(

    userId,

    created,

    createActivityAction,

    `Meeting ${createActivityAction.toLowerCase()}: ${created.title}`

  );



  return buildMeetingResult(created);



}







export async function getMeeting(



  meetingId: number



) {



  const id = parsePositiveInt(



    meetingId,



    "Meeting ID"



  );







  const meeting =



    await getMeetingOrThrow(id);







  return buildMeetingResult(meeting);



}







export async function listMeetings(



  startAt?: string,



  endAt?: string



) {



  let meetings =



    await db.orm.public.Meeting.all();







  if (startAt) {



    const parsedStart =



      parseDate(startAt, "Start time");







    const startTime =



      new Date(parsedStart).getTime();







    meetings = meetings.filter(



      (meeting: any) =>



        new Date(meeting.endAt).getTime() >



        startTime



    );



  }







  if (endAt) {



    const parsedEnd =



      parseDate(endAt, "End time");







    const endTime =



      new Date(parsedEnd).getTime();







    meetings = meetings.filter(



      (meeting: any) =>



        new Date(meeting.startAt).getTime() <



        endTime



    );



  }







  meetings.sort(



    (a: any, b: any) =>



      new Date(a.startAt).getTime() -



      new Date(b.startAt).getTime()



  );







  const results = [];







  for (const meeting of meetings as any[]) {



    results.push(



      await buildMeetingResult(meeting)



    );



  }







  return results;



}







export async function listAdminMeetings(



  startAt?: string,



  endAt?: string



) {



  return listMeetings(startAt, endAt);



}







export async function getTrainerMeetingOptions(

  userId: number

) {

  await validateOrganizer(userId, "TRAINER");



  const trainer = await getTrainerProfileByUserId(userId);



  const [

    batches,

    courses,

    trainerProfiles,

    studentProfiles,

    users,

    batchStudents,

  ] = await Promise.all([

    db.orm.public.Batch.all(),

    db.orm.public.Course.all(),

    db.orm.public.TrainerProfile.all(),

    db.orm.public.StudentProfile.all(),

    db.orm.public.User.all(),

    db.orm.public.BatchStudent.all(),

  ]);



  const assignedBatches = batches

    .filter((batch: any) => batch.trainerId === trainer.id)

    .sort(

      (a: any, b: any) =>

        new Date(a.startDate).getTime() -

        new Date(b.startDate).getTime()

    );



  const assignedBatchIds = new Set(

    assignedBatches.map((batch: any) => batch.id)

  );



  const courseById = new Map(

    courses.map((course: any) => [course.id, course])

  );



  const userById = new Map(

    users.map((user: any) => [user.id, user])

  );



  const assignedStudentProfileIds = new Set<number>();



  for (const assignment of batchStudents as any[]) {

    if (assignedBatchIds.has(assignment.batchId)) {

      assignedStudentProfileIds.add(assignment.studentId);

    }

  }



  const students = studentProfiles

    .filter((student: any) =>

      assignedStudentProfileIds.has(student.id)

    )

    .map((student: any) => {

      const user = userById.get(student.userId);



      return {

        id: student.id,

        userId: student.userId,

        studentId: student.studentId,

        name: user?.name || "Student",

        email: user?.email || "",

        phone: user?.phone || null,

        isActive: user?.isActive ?? false,

      };

    })

    .filter((student: any) => student.isActive)

    .sort((a: any, b: any) => a.name.localeCompare(b.name));



  const trainers = trainerProfiles

    .map((profile: any) => {

      const user = userById.get(profile.userId);



      if (!user || user.role !== "TRAINER" || !user.isActive) {

        return null;

      }



      return {

        id: profile.id,

        userId: profile.userId,

        name: user.name || "Trainer",

        email: user.email || "",

        isActive: true,

      };

    })

    .filter(

      (item: any): item is NonNullable<typeof item> =>

        item !== null

    )

    .sort((a: any, b: any) => a.name.localeCompare(b.name));



  const assignedCourseIds = new Set(

    assignedBatches.map((batch: any) => batch.courseId)

  );



  const assignedCourses = courses

    .filter(

      (course: any) =>

        assignedCourseIds.has(course.id) && course.isActive

    )

    .map((course: any) => ({

      id: course.id,

      slug: course.slug,

      title: course.title,

    }))

    .sort((a: any, b: any) => a.title.localeCompare(b.title));



  const batchOptions = assignedBatches.map((batch: any) => {

    const course = courseById.get(batch.courseId);



    return {

      id: batch.id,

      displayId: batch.displayId ?? null,

      name: batch.name,

      courseId: batch.courseId,

      course: course

        ? {

            id: course.id,

            slug: course.slug,

            title: course.title,

          }

        : null,

      trainerId: batch.trainerId ?? null,

      status: batch.status,

      startDate: batch.startDate,

      endDate: batch.endDate,

    };

  });



  return {

    courses: assignedCourses,

    batches: batchOptions,

    students,

    trainers,

  };

}



export async function listTrainerMeetings(



  userId: number,



  startAt?: string,



  endAt?: string



) {



  await validateOrganizer(



    userId,



    "TRAINER"



  );







  const allMeetings =



    await listMeetings(startAt, endAt);







  const trainer =



    await getTrainerProfileByUserId(userId);







  const trainerBatchIds =



    new Set<number>(



      (



        await db.orm.public.Batch



          .where({ trainerId: trainer.id })



          .all()



      ).map((batch: any) => batch.id)



    );







  return allMeetings.filter(



    (meeting: any) => {



      if (



        meeting.organizerUserId === userId



      ) {



        return true;



      }







      if (



        meeting.participants?.some(



          (participant: any) =>



            participant.userId === userId



        )



      ) {



        return true;



      }







      if (



        meeting.batchId &&



        trainerBatchIds.has(meeting.batchId)



      ) {



        return true;



      }







      return false;



    }



  );



}







export async function listStudentMeetings(



  userId: number,



  startAt?: string,



  endAt?: string



) {



  await validateOrganizer(



    userId,



    "STUDENT"



  );







  const allMeetings =



    await listMeetings(startAt, endAt);







  const batchStudents =



    await db.orm.public.BatchStudent.all();







  const studentProfile =



    await getStudentProfileByUserId(userId);







  const studentBatchIds = new Set<number>();







  if (studentProfile) {



    for (



      const batchStudent of



        batchStudents as any[]



    ) {



      if (



        batchStudent.studentId ===



        studentProfile.id



      ) {



        studentBatchIds.add(



          batchStudent.batchId



        );



      }



    }



  }







  return allMeetings.filter(



    (meeting: any) => {



      if (



        meeting.organizerUserId === userId



      ) {



        return true;



      }







      if (



        meeting.participants?.some(



          (participant: any) =>



            participant.userId === userId



        )



      ) {



        return true;



      }







      if (



        meeting.batchId &&



        studentBatchIds.has(meeting.batchId)



      ) {



        return true;



      }







      return false;



    }



  );



}







export async function updateMeeting(



  userId: number,



  role: "ADMIN" | "TRAINER",



  meetingId: number,



  input: UpdateMeetingInput



) {



  await validateOrganizer(



    userId,



    role



  );







  const id = parsePositiveInt(



    meetingId,



    "Meeting ID"



  );







  const existing =



    await getMeetingOrThrow(id);







  if (



    role === "TRAINER" &&



    existing.organizerUserId !== userId



  ) {



    throw new MeetingError(



      "You can only update meetings that you organized.",



      403



    );



  }







  const title =



    input.title !== undefined



      ? normalizeTitle(input.title)



      : existing.title;







  const startAt =



    input.startAt !== undefined



      ? parseDate(



          input.startAt,



          "Start time"



        )



      : existing.startAt;







  const endAt =



    input.endAt !== undefined



      ? parseDate(



          input.endAt,



          "End time"



        )



      : existing.endAt;







  validateTimeRange(



    startAt,



    endAt



  );







  const meetingType =



    input.meetingType ??



    existing.meetingType;







  if (!isMeetingType(meetingType)) {



    throw new MeetingError(



      "Invalid meeting type.",



      400



    );



  }







  const status =



    input.status ??



    existing.status;







  if (!isMeetingStatus(status)) {



    throw new MeetingError(



      "Invalid meeting status.",



      400



    );



  }







  const meetingPlatform =



    input.meetingPlatform !== undefined



      ? input.meetingPlatform



      : existing.meetingPlatform;







  if (



    meetingPlatform !== null &&



    !isMeetingPlatform(meetingPlatform)



  ) {



    throw new MeetingError(



      "Invalid meeting platform.",



      400



    );



  }







  const description =



    input.description !== undefined



      ? normalizeOptionalText(



          input.description,



          "Description",



          5000



        )



      : existing.description;







  const meetingUrl =



    input.meetingUrl !== undefined



      ? normalizeMeetingUrl(



          input.meetingUrl



        )



      : existing.meetingUrl;







  const courseId =



    input.courseId !== undefined



      ? parseOptionalPositiveInt(



          input.courseId,



          "Course ID"



        )



      : existing.courseId;







  const batchId =



    input.batchId !== undefined



      ? parseOptionalPositiveInt(



          input.batchId,



          "Batch ID"



        )



      : existing.batchId;







  const participantUserIds =



    input.participantUserIds !== undefined



      ? normalizeParticipantIds(



          input.participantUserIds



        )



      : (



          await db.orm.public.MeetingParticipant



            .where({ meetingId: id })



            .all()



        ).map(



          (participant: any) =>



            participant.userId



        );







  assertMeetingTypeRules(



    meetingType,



    batchId,



    participantUserIds



  );







  if (courseId) {



    await getCourseById(courseId);



  }







  let batch = null;







  if (batchId) {



    batch = await getBatchById(batchId);







    if (



      courseId !== null &&



      batch.courseId !== courseId



    ) {



      throw new MeetingError(



        "The selected course does not match the selected batch.",



        400



      );



    }



  }







  const participants =



    await validateParticipantUsers(



      userId,



      participantUserIds,



      meetingType



    );







  if (role === "TRAINER") {



    if (batchId) {



      await validateTrainerBatchAccess(



        userId,



        batchId,



        courseId



      );



    }







    if (



      meetingType === "STUDENT_MEETING" ||



      meetingType === "ONE_TO_ONE" ||



      meetingType === "BATCH_MEETING"



    ) {



      await validateTrainerStudentParticipants(



        userId,



        participantUserIds,



        batchId



      );



    }



  }







  const finalParticipantUserIds =



    meetingType === "BATCH_MEETING"



      ? []



      : participants.map(



          (participant: any) =>



            participant.id



        );







  const previousTrainerIds =

    await getTrainerIdsForMeeting(existing);



  if (status === "SCHEDULED") {



    await checkMeetingConflicts({



      organizerUserId:



        existing.organizerUserId,



      role,

      participantUserIds:



        finalParticipantUserIds,



      batchId,



      startAt,



      endAt,



      excludeMeetingId: id,



    });



  }







  const updated =



    await db.transaction(



      async (tx: any) => {



        const meeting =



          await tx.orm.public.Meeting



            .where({ id })



            .update({



              title,



              description,



              startAt,



              endAt,



              meetingUrl,



              meetingPlatform,



              meetingType,



              status,



              courseId,



              batchId,



            });







        await tx.orm.public.MeetingParticipant



          .where({ meetingId: id })



          .delete();







        for (



          const participantUserId of



            finalParticipantUserIds



        ) {



          await tx.orm.public.MeetingParticipant



            .create({



              meetingId: id,



              userId: participantUserId,



            });



        }







        return meeting;



      }



    );







  const activityAction: TrainerActivityAction =

    status === "CANCELLED"

      ? "CANCELLED"

      : status === "COMPLETED"

        ? "COMPLETED"

        : "UPDATED";



  await recordMeetingTrainerActivity(

    userId,

    updated,

    activityAction,

    `Meeting ${activityAction.toLowerCase()}: ${updated.title}`,

    previousTrainerIds

  );



  return buildMeetingResult(updated);



}







export async function cancelMeeting(



  userId: number,



  role: "ADMIN" | "TRAINER",



  meetingId: number



) {



  await validateOrganizer(



    userId,



    role



  );







  const id = parsePositiveInt(



    meetingId,



    "Meeting ID"



  );







  const existing =



    await getMeetingOrThrow(id);







  if (



    role === "TRAINER" &&



    existing.organizerUserId !== userId



  ) {



    throw new MeetingError(



      "You can only cancel meetings that you organized.",



      403



    );



  }







  const updated =



    await db.orm.public.Meeting



      .where({ id })



      .update({



        status: "CANCELLED",



      });







  await recordMeetingTrainerActivity(

    userId,

    updated,

    "CANCELLED",

    `Meeting cancelled: ${existing.title}`

  );



  return buildMeetingResult(updated);



}







export async function deleteMeeting(



  userId: number,



  role: "ADMIN" | "TRAINER",



  meetingId: number



) {



  await validateOrganizer(



    userId,



    role



  );







  const id = parsePositiveInt(



    meetingId,



    "Meeting ID"



  );







  const existing =



    await getMeetingOrThrow(id);







  if (



    role === "TRAINER" &&



    existing.organizerUserId !== userId



  ) {



    throw new MeetingError(



      "You can only delete meetings that you organized.",



      403



    );



  }







  const trainerIds =

    await getTrainerIdsForMeeting(existing);



  await recordMeetingTrainerActivity(

    userId,

    existing,

    "DELETED",

    `Meeting deleted: ${existing.title}`,

    trainerIds

  );





  await db.orm.public.Meeting



    .where({ id })



    .delete();







  return {



    success: true,



    message: "Meeting deleted successfully.",



  };



}