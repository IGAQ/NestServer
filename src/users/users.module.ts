import { Module } from "@nestjs/common";
import { UsersService } from './services/UsersService/users.service';
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
