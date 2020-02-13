import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Get,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/auth/role.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from './user-roles.enum';
import { ReturnUserDto } from './dto/return-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query-dto';
import { ReturnUsersDto } from './dto/return-users.dto';

@Controller('users')
@UseGuards(AuthGuard(), RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Role(UserRole.ADMIN)
  async findUsers(@Query() query: FindUsersQueryDto): Promise<ReturnUsersDto> {
    query.limit = query.limit > 100 ? 100 : query.limit;
    const found = await this.userService.findUsers(query);
    return {
      found,
      message: 'Usuários encontrados',
    };
  }

  @Get(':id')
  @Role(UserRole.ADMIN)
  async findUserById(@Param('id') id): Promise<ReturnUserDto> {
    const user = await this.userService.findUserById(id);
    return {
      user,
      message: 'Usuário encontrado',
    };
  }

  @Post()
  @Role(UserRole.ADMIN)
  async createAdminUser(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<ReturnUserDto> {
    const user = await this.userService.createAdminUser(createUserDto);
    return {
      user,
      message: 'Administrador cadastrado com sucesso',
    };
  }
}
