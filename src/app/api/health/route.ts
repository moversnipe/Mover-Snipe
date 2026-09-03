import { createHandler } from "@/lib/api/handler"
import { apiSuccess } from "@/lib/api/response"

/** Liveness probe for uptime monitors and load balancers. No dependencies. */
export const GET = createHandler(() => apiSuccess({ status: "ok" }))
