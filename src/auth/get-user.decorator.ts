import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "src/entities/user.entity";

export const GetUser = createParamDecorator((data, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest();
    if(req.user){
        return req.user;
    } else {
        const user : User = new User()
        user.username = "guest"
        return user;
    }
    
});