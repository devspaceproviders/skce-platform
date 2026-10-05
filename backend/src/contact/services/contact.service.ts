import { db } from "../../prisma/db";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "IN_PROGRESS"
  | "CONVERTED"
  | "CLOSED";

export type ContactMessageStatus =
  | "NEW"
  | "READ"
  | "REPLIED"
  | "CLOSED";

export interface ContactSettingsInput {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  mapUrl?: string | null;
}

export interface DemoRequestInput {
  name: string;
  phone: string;
  email?: string;
  courseSlug?: string;
  message?: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const DEFAULT_CONTACT_SETTINGS = {
  phone: "+91 98854 22483",
  email: "admissions@skce.in",
  address:
    "Door NO: 22-8-215/2a, Old Grand world, Marasa Sarovar Premium, SLV Nagar, Tirupati, Andhra Pradesh 517501",
  workingHours: "Contact us for current timings",
  mapUrl: null,
};

function clean(value: string | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/* -------------------------------------------------------------------------- */
/* CONTACT SETTINGS                                                           */
/* -------------------------------------------------------------------------- */

export async function getContactSettings() {
  let settings = await db.orm.public.ContactSetting.first();

  if (!settings) {
    settings = await db.orm.public.ContactSetting.create({
      phone: DEFAULT_CONTACT_SETTINGS.phone,
      email: DEFAULT_CONTACT_SETTINGS.email,
      address: DEFAULT_CONTACT_SETTINGS.address,
      workingHours: DEFAULT_CONTACT_SETTINGS.workingHours,
      mapUrl: null,
    });
  }

  return settings;
}

export async function updateContactSettings(
  input: ContactSettingsInput
) {
  const phone = clean(input.phone);
  const email = clean(input.email);
  const address = clean(input.address);
  const workingHours = clean(input.workingHours);

  if (!phone) {
    throw new Error("Phone number is required");
  }

  if (!email) {
    throw new Error("Email address is required");
  }

  if (!address) {
    throw new Error("Address is required");
  }

  if (!workingHours) {
    throw new Error("Working hours are required");
  }

  const existing = await db.orm.public.ContactSetting.first();

  if (existing) {
    return db.orm.public.ContactSetting
      .where({
        id: existing.id,
      })
      .update({
        phone,
        email,
        address,
        workingHours,
        mapUrl:
          input.mapUrl === undefined
            ? existing.mapUrl
            : clean(input.mapUrl) || null,
      });
  }

  return db.orm.public.ContactSetting.create({
    phone,
    email,
    address,
    workingHours,
    mapUrl:
      input.mapUrl === undefined
        ? null
        : clean(input.mapUrl) || null,
  });
}

/* -------------------------------------------------------------------------- */
/* COURSES                                                                    */
/* -------------------------------------------------------------------------- */

export async function getActiveCourses() {
  const courses = await db.orm.public.Course.all();

  return courses
    .filter((course) => course.isActive)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
    }));
}

/* -------------------------------------------------------------------------- */
/* DEMO REQUESTS                                                              */
/* -------------------------------------------------------------------------- */

export async function createDemoRequest(
  input: DemoRequestInput
) {
  const name = clean(input.name);
  const phone = clean(input.phone);
  const email = clean(input.email);
  const courseSlug = clean(input.courseSlug);
  const message = clean(input.message);

  if (!name) {
    throw new Error("Name is required");
  }

  if (!phone) {
    throw new Error("Phone number is required");
  }

  if (!courseSlug) {
    throw new Error("Course is required");
  }

  const course = await db.orm.public.Course
    .where({
      slug: courseSlug,
    })
    .first();

  if (!course || !course.isActive) {
    throw new Error("Selected course is not available");
  }

  return db.orm.public.DemoRequest.create({
    name,
    phone,
    email: email || null,
    courseId: course.id,
    courseSlug: course.slug,
    message: message || null,
    status: "NEW",
  });
}

export async function listDemoRequests() {
  const requests = await db.orm.public.DemoRequest.all();

  return requests.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );
}

export async function updateDemoRequestStatus(
  id: number,
  status: LeadStatus
) {
  const request = await db.orm.public.DemoRequest
    .where({
      id,
    })
    .first();

  if (!request) {
    throw new Error("Demo request not found");
  }

  return db.orm.public.DemoRequest
    .where({
      id,
    })
    .update({
      status,
    });
}

/* -------------------------------------------------------------------------- */
/* CONTACT MESSAGES                                                           */
/* -------------------------------------------------------------------------- */

export async function createContactMessage(
  input: ContactMessageInput
) {
  const name = clean(input.name);
  const email = clean(input.email);
  const phone = clean(input.phone);
  const message = clean(input.message);

  if (!name) {
    throw new Error("Name is required");
  }

  if (!email) {
    throw new Error("Email address is required");
  }

  if (!phone) {
    throw new Error("Phone number is required");
  }

  if (!message) {
    throw new Error("Message is required");
  }

  return db.orm.public.ContactMessage.create({
    name,
    email,
    phone,
    message,
    status: "NEW",
  });
}

export async function listContactMessages() {
  const messages = await db.orm.public.ContactMessage.all();

  return messages.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );
}

export async function updateContactMessageStatus(
  id: number,
  status: ContactMessageStatus
) {
  const message = await db.orm.public.ContactMessage
    .where({
      id,
    })
    .first();

  if (!message) {
    throw new Error("Contact message not found");
  }

  return db.orm.public.ContactMessage
    .where({
      id,
    })
    .update({
      status,
    });
}