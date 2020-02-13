import { User } from '../user.entity';

export class ReturnUsersDto {
  found: { users: User[]; total: number };
  message: string;
}
