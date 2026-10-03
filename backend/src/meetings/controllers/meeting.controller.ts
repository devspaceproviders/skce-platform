import type { Request, Response } from "express";

import {

  cancelMeeting,

  createMeeting,

  deleteMeeting,

  getMeeting,

  listAdminMeetings,

  listStudentMeetings,

  listTrainerMeetings,

  getTrainerMeetingOptions,

  MeetingError,

  updateMeeting,

} from "../services/meeting.service";



type AuthenticatedRequest = Request & {

  user?: {

    userId: number;

    role: "ADMIN" | "STUDENT" | "TRAINER";

  };

};



function currentUser(req: AuthenticatedRequest) {

  if (!req.user) {

    throw new MeetingError(

      "Authentication required.",

      401

    );

  }



  return req.user;

}



function parsePositiveInt(

  value: unknown,

  fieldName: string

): number {

  const parsed = Number(value);



  if (

    !Number.isInteger(parsed) ||

    parsed <= 0

  ) {

    throw new MeetingError(

      `${fieldName} must be a positive integer.`,

      400

    );

  }



  return parsed;

}



function sendError(

  res: Response,

  error: unknown

) {

  if (error instanceof MeetingError) {

    return res.status(error.statusCode).json({

      success: false,

      message: error.message,

    });

  }



  console.error(

    "Meeting controller error:",

    error

  );



  return res.status(500).json({

    success: false,

    message: "An unexpected error occurred.",

  });

}



function getOptionalQueryString(

  value: unknown

): string | undefined {

  if (

    typeof value !== "string" ||

    !value.trim()

  ) {

    return undefined;

  }



  return value.trim();

}



/* =========================================================

   ADMIN

   ========================================================= */



export async function createAdminMeetingController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "ADMIN") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const meeting = await createMeeting(

      user.userId,

      "ADMIN",

      req.body

    );



    return res.status(201).json({

      success: true,

      message: "Meeting scheduled successfully.",

      data: meeting,

    });

  } catch (error) {

    return sendError(res, error);

  }

}



export async function listAdminMeetingsController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "ADMIN") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const startAt =

      getOptionalQueryString(

        req.query.startAt

      );



    const endAt =

      getOptionalQueryString(

        req.query.endAt

      );



    const meetings =

      await listAdminMeetings(

        startAt,

        endAt

      );



    return res.json({

      success: true,

      data: meetings,

    });

  } catch (error) {

    return sendError(res, error);

  }

}



export async function getAdminMeetingController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "ADMIN") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const meetingId = parsePositiveInt(

      req.params.id,

      "Meeting ID"

    );



    const meeting =

      await getMeeting(meetingId);



    return res.json({

      success: true,

      data: meeting,

    });

  } catch (error) {

    return sendError(res, error);

  }

}



export async function updateAdminMeetingController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "ADMIN") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const meetingId = parsePositiveInt(

      req.params.id,

      "Meeting ID"

    );



    const meeting =

      await updateMeeting(

        user.userId,

        "ADMIN",

        meetingId,

        req.body

      );



    return res.json({

      success: true,

      message: "Meeting updated successfully.",

      data: meeting,

    });

  } catch (error) {

    return sendError(res, error);

  }

}



export async function cancelAdminMeetingController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "ADMIN") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const meetingId = parsePositiveInt(

      req.params.id,

      "Meeting ID"

    );



    const meeting =

      await cancelMeeting(

        user.userId,

        "ADMIN",

        meetingId

      );



    return res.json({

      success: true,

      message: "Meeting cancelled successfully.",

      data: meeting,

    });

  } catch (error) {

    return sendError(res, error);

  }

}



export async function deleteAdminMeetingController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "ADMIN") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const meetingId = parsePositiveInt(

      req.params.id,

      "Meeting ID"

    );



    const result =

      await deleteMeeting(

        user.userId,

        "ADMIN",

        meetingId

      );



    return res.json(result);

  } catch (error) {

    return sendError(res, error);

  }

}



/* =========================================================

   TRAINER

   ========================================================= */



export async function createTrainerMeetingController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "TRAINER") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const meeting = await createMeeting(

      user.userId,

      "TRAINER",

      req.body

    );



    return res.status(201).json({

      success: true,

      message: "Meeting scheduled successfully.",

      data: meeting,

    });

  } catch (error) {

    return sendError(res, error);

  }

}



export async function listTrainerMeetingsController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "TRAINER") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const startAt =

      getOptionalQueryString(

        req.query.startAt

      );



    const endAt =

      getOptionalQueryString(

        req.query.endAt

      );



    const meetings =

      await listTrainerMeetings(

        user.userId,

        startAt,

        endAt

      );



    return res.json({

      success: true,

      data: meetings,

    });

  } catch (error) {

    return sendError(res, error);

  }

}



export async function getTrainerMeetingOptionsController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = currentUser(req);

    if (user.role !== "TRAINER") {
      throw new MeetingError("Access denied.", 403);
    }

    const options = await getTrainerMeetingOptions(user.userId);

    return res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getTrainerMeetingController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "TRAINER") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const meetingId = parsePositiveInt(

      req.params.id,

      "Meeting ID"

    );



    const meetings =

      await listTrainerMeetings(

        user.userId

      );



    const meeting = meetings.find(

      (item: any) =>

        item.id === meetingId

    );



    if (!meeting) {

      throw new MeetingError(

        "Meeting not found or access denied.",

        404

      );

    }



    return res.json({

      success: true,

      data: meeting,

    });

  } catch (error) {

    return sendError(res, error);

  }

}



export async function updateTrainerMeetingController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "TRAINER") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const meetingId = parsePositiveInt(

      req.params.id,

      "Meeting ID"

    );



    const meeting =

      await updateMeeting(

        user.userId,

        "TRAINER",

        meetingId,

        req.body

      );



    return res.json({

      success: true,

      message: "Meeting updated successfully.",

      data: meeting,

    });

  } catch (error) {

    return sendError(res, error);

  }

}



export async function cancelTrainerMeetingController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "TRAINER") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const meetingId = parsePositiveInt(

      req.params.id,

      "Meeting ID"

    );



    const meeting =

      await cancelMeeting(

        user.userId,

        "TRAINER",

        meetingId

      );



    return res.json({

      success: true,

      message: "Meeting cancelled successfully.",

      data: meeting,

    });

  } catch (error) {

    return sendError(res, error);

  }

}



export async function deleteTrainerMeetingController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "TRAINER") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const meetingId = parsePositiveInt(

      req.params.id,

      "Meeting ID"

    );



    const result =

      await deleteMeeting(

        user.userId,

        "TRAINER",

        meetingId

      );



    return res.json(result);

  } catch (error) {

    return sendError(res, error);

  }

}



/* =========================================================

   STUDENT

   ========================================================= */



export async function listStudentMeetingsController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "STUDENT") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const startAt =

      getOptionalQueryString(

        req.query.startAt

      );



    const endAt =

      getOptionalQueryString(

        req.query.endAt

      );



    const meetings =

      await listStudentMeetings(

        user.userId,

        startAt,

        endAt

      );



    return res.json({

      success: true,

      data: meetings,

    });

  } catch (error) {

    return sendError(res, error);

  }

}



export async function getStudentMeetingController(

  req: AuthenticatedRequest,

  res: Response

) {

  try {

    const user = currentUser(req);



    if (user.role !== "STUDENT") {

      throw new MeetingError(

        "Access denied.",

        403

      );

    }



    const meetingId = parsePositiveInt(

      req.params.id,

      "Meeting ID"

    );



    const meetings =

      await listStudentMeetings(

        user.userId

      );



    const meeting = meetings.find(

      (item: any) =>

        item.id === meetingId

    );



    if (!meeting) {

      throw new MeetingError(

        "Meeting not found or access denied.",

        404

      );

    }



    return res.json({

      success: true,

      data: meeting,

    });

  } catch (error) {

    return sendError(res, error);

  }

}