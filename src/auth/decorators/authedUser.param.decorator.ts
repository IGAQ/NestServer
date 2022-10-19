import { createParamDecorator } from "@nestjs/common";

export const AuthedUser = createParamDecorator((data, req) => {
    return req.user;
});