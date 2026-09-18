
import 'dotenv/config'
import cors from 'cors'
import express, { type Express } from "express";
import { connectionRouter } from './routes/connection.routes';
import { getPool } from './db/pool';
import { agentRoutes } from './routes/agent.routes';
import { mountMcpServer } from "./mcp/mount.js";





const app: Express = express();
app.disable("x-powered-by");

const port = Number(process.env.PORT) || 4000;
const appOrigin = process.env.APP_URL ?? "http://localhost:3000"
 
app.use(
    cors({
        origin: appOrigin,
        credentials: true
    })
)


app.use(express.json());
mountMcpServer(app);

app.get("/health", async(_req, res)=>{
    try{
        await getPool().query("SELECT 1")
        res.json({status: "Ok", Service: "ai-agentic-calendar", database: "up"})

    }catch{
        res.status(503).json({
            status: "error",
            Service: "ai-agentic-calendar",
            database: "down"
        })
    }
});

app.use("/api/connections", connectionRouter);
app.use("/api/agent", agentRoutes)


app.listen(port, ()=>{
    console.log(`Agentic Calendar APP is running on port ${port}`)
})













