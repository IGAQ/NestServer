import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";

/**
 * Use this guard when the user has to be logged-in.
 * This guard will reject the request if the user is not authenticated (logged-in).
 */
@Injectable()
export class AuthGuard implements CanActivate {
    public canActivate(
        context: ExecutionContext
    ): boolean | Promise<boolean> | Observable<boolean> {
        return new Promise<boolean>(resolve => {
            const request = context.switchToHttp().getRequest();

            // If the `request.user` exists, pass; Otherwise, reject.
            if (request.user !== undefined) resolve(true);
            else resolve(false);
        });
    }
}
