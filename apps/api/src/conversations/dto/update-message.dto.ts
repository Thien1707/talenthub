import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content: string;
}
