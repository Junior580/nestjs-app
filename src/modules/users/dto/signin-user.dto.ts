import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
