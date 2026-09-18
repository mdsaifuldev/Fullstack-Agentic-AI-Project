// import { descopeMcpAuthRouter, DescopeMcpProvider } from "@descope/mcp-express";
// import { listUpcomingMeetingsTools } from "./calendar-tools.js";
// import type { Express } from "express";

// export function mountMcpServer(app: Express) {
//   const wellKnown = process.env.DESCOPE_MCP_SERVER_WELL_KNOWN_URL;

//   if (!wellKnown) {
//     console.warn("DESCOPE_MCP_SERVER_WELL_KNOWN_URL is disabled");
//     return;
//   }

//   const serverUrl = process.env.SERVER_URL;

//   const provider = new DescopeMcpProvider({
//     serverUrl,
//     descopeMcpServerWellKnownUrl: wellKnown,
//     projectId: process.env.DESCOPE_PROJECT_ID,
//   });

//   app.use(
//     descopeMcpAuthRouter((server) => {
//       // register all out tools
//       listUpcomingMeetingsTools(server);
//     }, provider),
//   );

//   // cursor -> sends GET /mcp

//   app.get("/mcp", (_req, res) => {
//     res.status(405).set("Allow", "Post").send("Method not allowed");
//   });

//   console.log(`MCP endpoint: POST ${serverUrl}/mcp`);
// }



import { descopeMcpAuthRouter, DescopeMcpProvider } from "@descope/mcp-express";
import type { Express } from "express";
import {
  listUpcomingMeetingsTool,
  createMeetingTool,
  cancelMeetingTool,
  rescheduleMeetingTool,
  checkCalendarBusyTool,
} from "./calendar-tools.js";

export function mountMcpServer(app: Express) {
  const serverUrl = process.env.SERVER_URL;

  if (!serverUrl) {
    console.warn("SERVER_URL is not set — MCP server not mounted");
    return;
  }

  const provider = new DescopeMcpProvider({
    projectId: process.env.DESCOPE_PROJECT_ID,
    serverUrl,
    baseUrl: process.env.DESCOPE_BASE_URL,
  });

  app.use(
    descopeMcpAuthRouter((server) => {
      listUpcomingMeetingsTool(server);
      createMeetingTool(server);
      cancelMeetingTool(server);
      rescheduleMeetingTool(server);
      checkCalendarBusyTool(server);
    }, provider),
  );

  console.log(`MCP endpoint: POST ${serverUrl}/mcp`);  

}









