import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class AdminUpdateUserStatusDto {
  @ApiProperty({ enum: [UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.BANNED] })
  @IsIn([UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.BANNED])
  status: UserStatus;
}
