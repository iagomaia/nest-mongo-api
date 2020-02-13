import { UserRole } from '../user-roles.enum';

export class UpdateUserDto {
  name: string;
  email: string;
  role: UserRole;
}
