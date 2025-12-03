export const prisma: PrismaClient<{
    log: ("query" | "warn" | "error")[];
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export function connectDatabase(): Promise<void>;
export function disconnectDatabase(): Promise<void>;
import { PrismaClient } from ".prisma/client";
//# sourceMappingURL=database.d.ts.map