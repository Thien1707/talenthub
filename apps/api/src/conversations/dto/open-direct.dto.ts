import { IsString } from 'class-validator';

export class OpenDirectDto {
  @IsString()
  otherUserId: string;
}
