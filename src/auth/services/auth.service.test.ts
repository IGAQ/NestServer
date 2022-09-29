import { Injectable } from "@nestjs/common";
import { IAuthService } from "./auth.service.interface";

@Injectable({})
export class AuthServiceTest implements IAuthService {
    signup() {
        return { msg: "I am signed up" };
    }

    signin() {
        return { msg: "I am signed in" };
    }
}
