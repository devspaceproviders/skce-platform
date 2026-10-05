import type { Request, Response } from "express";
import {
  createContactMessage,
  createDemoRequest,
  getActiveCourses,
  getContactSettings,
  listContactMessages,
  listDemoRequests,
  updateContactMessageStatus,
  updateContactSettings,
  updateDemoRequestStatus,
  type ContactMessageStatus,
  type LeadStatus,
} from "../services/contact.service";

/* -------------------------------------------------------------------------- */
/* PUBLIC                                                                     */
/* -------------------------------------------------------------------------- */

export async function getPublicContactSettings(
  _req: Request,
  res: Response
) {
  try {
    const settings = await getContactSettings();

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get contact settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load contact information",
    });
  }
}

export async function getPublicCourses(
  _req: Request,
  res: Response
) {
  try {
    const courses = await getActiveCourses();

    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Get contact courses error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load courses",
    });
  }
}

export async function submitDemoRequest(
  req: Request,
  res: Response
) {
  try {
    const demoRequest = await createDemoRequest(req.body);

    return res.status(201).json({
      success: true,
      message:
        "Your demo request has been submitted successfully.",
      data: demoRequest,
    });
  } catch (error) {
    console.error("Create demo request error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to submit demo request";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function submitContactMessage(
  req: Request,
  res: Response
) {
  try {
    const contactMessage = await createContactMessage(
      req.body
    );

    return res.status(201).json({
      success: true,
      message:
        "Your message has been submitted successfully.",
      data: contactMessage,
    });
  } catch (error) {
    console.error("Create contact message error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to submit contact message";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* ADMIN                                                                      */
/* -------------------------------------------------------------------------- */

export async function updatePublicContactSettings(
  req: Request,
  res: Response
) {
  try {
    const settings = await updateContactSettings(req.body);

    return res.status(200).json({
      success: true,
      message: "Contact information updated successfully.",
      data: settings,
    });
  } catch (error) {
    console.error("Update contact settings error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update contact information";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function getDemoRequests(
  _req: Request,
  res: Response
) {
  try {
    const requests = await listDemoRequests();

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get demo requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load demo requests",
    });
  }
}

export async function changeDemoRequestStatus(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid demo request ID",
      });
    }

    const { status } = req.body as {
      status?: LeadStatus;
    };

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses: LeadStatus[] = [
      "NEW",
      "CONTACTED",
      "IN_PROGRESS",
      "CONVERTED",
      "CLOSED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid demo request status",
      });
    }

    const request = await updateDemoRequestStatus(
      id,
      status
    );

    return res.status(200).json({
      success: true,
      message: "Demo request status updated successfully.",
      data: request,
    });
  } catch (error) {
    console.error(
      "Update demo request status error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update demo request status";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function getContactMessages(
  _req: Request,
  res: Response
) {
  try {
    const messages = await listContactMessages();

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Get contact messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load contact messages",
    });
  }
}

export async function changeContactMessageStatus(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact message ID",
      });
    }

    const { status } = req.body as {
      status?: ContactMessageStatus;
    };

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses: ContactMessageStatus[] = [
      "NEW",
      "READ",
      "REPLIED",
      "CLOSED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact message status",
      });
    }

    const message = await updateContactMessageStatus(
      id,
      status
    );

    return res.status(200).json({
      success: true,
      message:
        "Contact message status updated successfully.",
      data: message,
    });
  } catch (error) {
    console.error(
      "Update contact message status error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update contact message status";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}