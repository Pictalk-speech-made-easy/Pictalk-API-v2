import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "src/entities/user.entity";

// Update last_connection only if it's been more than 1 h
const UPDATE_THRESHOLD_MS = 3600_000; // 1 h

export const GetUser = createParamDecorator(async (data, ctx: ExecutionContext): Promise<User> => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    
    // Update last_connection if user exists and threshold has passed
    if (user && user.id) {
        const now = new Date();
        const last_connection = user.last_connection ? new Date(user.last_connection) : null;
        
        // Only update if last_connection is null or older than threshold
        if (!last_connection || (now.getTime() - last_connection.getTime()) > UPDATE_THRESHOLD_MS) {
            User.update(user.id, { last_connection: now })
                .catch((error) => {
                    console.error('Error updating last connection:', error);
                });
        }
    }
    
    return user;
});