import { IsEnum } from 'class-validator';
import { UserRole } from '@e-com/shared';

export class UpdateRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
