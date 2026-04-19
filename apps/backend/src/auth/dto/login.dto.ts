import { ILoginDto } from '@e-com/shared';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto implements ILoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
