import { EntityRepository, MongoRepository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './user-roles.enum';
import * as bcrypt from 'bcrypt';
import {
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { CredentialsDto } from 'src/auth/dto/credentials.dto';
import { FindUsersQueryDto } from './dto/find-users-query-dto';

@EntityRepository(User)
export class UserRepository extends MongoRepository<User> {
  async findUsers(
    queryDto: FindUsersQueryDto,
  ): Promise<{ users: User[]; total: number }> {
    queryDto.status = queryDto.status === undefined ? true : queryDto.status;
    queryDto.page = queryDto.page < 1 ? 1 : queryDto.page;
    const { email, name, status, role } = queryDto;

    const [users, total] = await this.findAndCount({
      skip: (queryDto.page - 1) * queryDto.limit,
      take: +queryDto.limit,
      order: queryDto.sort ? JSON.parse(queryDto.sort) : undefined,
      where: {
        status: {
          $eq: status,
        },
        email: {
          $regex: email || '',
          $options: 'i',
        },
        name: {
          $regex: name || '',
          $options: 'i',
        },
        role: {
          $regex: role || '',
          $options: 'i',
        },
      },
      select: ['name', 'email', 'role', 'status'],
    });

    return { users, total };
  }

  async createUser(
    createUserDto: CreateUserDto,
    role: UserRole,
  ): Promise<User> {
    const { email, name, password } = createUserDto;

    const user = this.create();
    user.email = email;
    user.name = name;
    user.role = role;
    user.status = true;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);
    try {
      await user.save();
      delete user.password;
      delete user.salt;
      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Endereço de email já está em uso');
      } else {
        throw new InternalServerErrorException(
          'Erro ao salvar o usuário no banco de dados',
        );
      }
    }
  }

  async checkCredentials(credentialsDto: CredentialsDto): Promise<string> {
    const { email, password } = credentialsDto;
    const user = await this.findOne({ email });

    if (user && (await user.checkPassword(password))) {
      return user.id.toString();
    } else {
      return null;
    }
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}
