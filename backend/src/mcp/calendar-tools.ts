// import { AuthenticatedExtra, defineTool } from "@descope/mcp-express";
// import { z } from "zod";
// import { listUpcomingMeetings } from "../services/calendar.service.js";

// function textResult(data: unknown) {
//   return {
//     content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
//   };
// }

// function authUserIdFromToken(token: string): string {
//   const payload = JSON.parse(
//     Buffer.from(token.split(".")[1] ?? "", "base64").toString("utf8"),
//   ) as { sub?: string };

//   if (!payload.sub) {
//     throw new Error("MCP token has no user id");
//   }

//   return String(payload.sub);
// }

// const defineMcpTool = defineTool as (cfg: {
//   name: string;
//   description: string;
//   input?: Record<string, unknown>;
//   scopes?: string[];
//   handler: (
//     args: Record<string, unknown>,
//     extra: AuthenticatedExtra,
//   ) => ReturnType<typeof textResult> | Promise<ReturnType<typeof textResult>>;
// }) => ReturnType<typeof defineTool>;

// export const listUpcomingMeetingsTools = defineMcpTool({
//   name: "listUpcomingMeetings",
//   description:
//     "List Google Calendar events. Set todayOnly=true for today's agenda only.",
//   input: {
//     maxResults: z.number().int().min(1).max(20).optional(),

//     todayOnly: z
//       .boolean()
//       .optional()
//       .describe("If true, only return events for today"),
//   },
//   scopes: ["profile"],
//   handler: async (args, extra) => {
//     try {
//       const authUserId = authUserIdFromToken(extra.authInfo.token);

//       const meetings = await listUpcomingMeetings({
//         authUserId,
//         maxResults:
//           typeof args.maxResults === "number" ? args.maxResults : undefined,
//         todayOnly:
//           typeof args.todayOnly === "boolean" ? args.todayOnly : undefined,
//       });

//       return textResult({ meetings });
//     } catch (error) {
//       const message = error instanceof Error ? error.message : "List Failed";
//       return textResult({ error: message });
//     }
//   },
// });







import { defineTool as defineToolRaw, type AuthenticatedExtra } from "@descope/mcp-express";
import { z } from "zod/v3";
import {
  listUpcomingMeetings,
  createMeeting,
  cancelMeeting,
  rescheduleMeeting,
  checkCalendarBusy,
} from "../services/calendar-service.js";

// Bypasses the SDK's deep Zod-derived generic inference, which blows up
// TypeScript's compiler when combined with this project's Zod v4 install.
// Runtime validation still happens via the `input` schemas below — this
// only relaxes compile-time typing.
const defineTool = defineToolRaw as (config: {
  name: string;
  description: string;
  input?: Record<string, unknown>;
  scopes?: string[];
  handler: (
    args: any,
    extra: AuthenticatedExtra,
  ) => Promise<{ content: { type: "text"; text: string }[] }>;
}) => ReturnType<typeof defineToolRaw>;

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function authUserIdFromToken(token: string): string {
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1] ?? "", "base64").toString("utf8"),
  ) as { sub?: string };

  if (!payload.sub) {
    throw new Error("MCP token has no user id");
  }

  return String(payload.sub);
}

function authUserId(extra: AuthenticatedExtra): string {
  return authUserIdFromToken(extra.authInfo.token);
}

export const listUpcomingMeetingsTool = defineTool({
  name: "listUpcomingMeetings",
  description:
    "List Google Calendar events. Set todayOnly=true for today's agenda only.",
  input: {
    maxResults: z.number().int().min(1).max(20).optional(),
    todayOnly: z
      .boolean()
      .optional()
      .describe("If true, only return events for today"),
  },
  scopes: ["profile"],
  handler: async (args, extra) => {
    try {
      const meetings = await listUpcomingMeetings({
        authUserId: authUserId(extra),
        maxResults: args.maxResults,
        todayOnly: args.todayOnly,
      });
      return textResult({ meetings });
    } catch (error) {
      const message = error instanceof Error ? error.message : "List failed";
      return textResult({ error: message });
    }
  },
});

export const createMeetingTool = defineTool({
  name: "createMeeting",
  description:
    "Create a new meeting on the user's primary Google Calendar, optionally inviting attendees and adding a Google Meet link.",
  input: {
    title: z.string().min(1).describe("Meeting title"),
    startIso: z.string().describe("Start time, ISO 8601"),
    endIso: z.string().describe("End time, ISO 8601"),
    attendeeEmails: z
      .array(z.string().email())
      .optional()
      .describe("Attendee email addresses to invite"),
    description: z.string().optional().describe("Meeting description"),
    addGoogleMeet: z
      .boolean()
      .optional()
      .describe("Whether to add a Google Meet link (default true)"),
  },
  scopes: ["profile"],
  handler: async (args, extra) => {
    try {
      const meeting = await createMeeting({
        authUserId: authUserId(extra),
        title: args.title,
        startIso: args.startIso,
        endIso: args.endIso,
        attendeeEmails: args.attendeeEmails,
        description: args.description,
        addGoogleMeet: args.addGoogleMeet,
      });
      return textResult({ meeting });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Create failed";
      return textResult({ error: message });
    }
  },
});

export const cancelMeetingTool = defineTool({
  name: "cancelMeeting",
  description: "Cancel (delete) a meeting on the user's primary calendar by event ID.",
  input: {
    eventId: z.string().min(1).describe("The calendar event ID to cancel"),
  },
  scopes: ["profile"],
  handler: async (args, extra) => {
    try {
      const result = await cancelMeeting({
        authUserId: authUserId(extra),
        eventId: args.eventId,
      });
      return textResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cancel failed";
      return textResult({ error: message });
    }
  },
});

export const rescheduleMeetingTool = defineTool({
  name: "rescheduleMeeting",
  description: "Change the start/end time of an existing meeting.",
  input: {
    eventId: z.string().min(1).describe("The calendar event ID to reschedule"),
    startIso: z.string().describe("New start time, ISO 8601"),
    endIso: z.string().describe("New end time, ISO 8601"),
  },
  scopes: ["profile"],
  handler: async (args, extra) => {
    try {
      const meeting = await rescheduleMeeting({
        authUserId: authUserId(extra),
        eventId: args.eventId,
        startIso: args.startIso,
        endIso: args.endIso,
      });
      return textResult({ meeting });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Reschedule failed";
      return textResult({ error: message });
    }
  },
});

export const checkCalendarBusyTool = defineTool({
  name: "checkCalendarBusy",
  description: "Check the user's busy time blocks on their primary calendar within a time range.",
  input: {
    startIso: z.string().describe("Range start, ISO 8601"),
    endIso: z.string().describe("Range end, ISO 8601"),
  },
  scopes: ["profile"],
  handler: async (args, extra) => {
    try {
      const busy = await checkCalendarBusy({
        authUserId: authUserId(extra),
        startIso: args.startIso,
        endIso: args.endIso,
      });
      return textResult(busy);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Check failed";
      return textResult({ error: message });
    }
  },
});








