import {
  Injectable,
  UnprocessableEntityException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from '../users/users.repository';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserRole } from '../users/user-roles.enum';
import { CredentialsDto } from './dto/credentials.dto';
import { JwtPayload } from './jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { MailerService } from '@nest-modules/mailer';
import { ChangePasswordDto } from './dto/change-password.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private mailService: MailerService,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<User> {
    if (createUserDto.password != createUserDto.passwordConfirmation) {
      throw new UnprocessableEntityException('As senhas não conferem');
    } else {
      const user = await this.userRepository.createUser(
        createUserDto,
        UserRole.USER,
      );
      const mail = {
        from: 'UUEBI <nao-responda@uuebi.com>',
        to: user.email,
        subject: 'Confirme seu email',
        template: 'email-confirmation',
        context: {
          emailTitle: 'Confirme seu email',
          token: user.confirmationToken,
        },
      };
      this.mailService.sendMail(mail);
      return user;
    }
  }

  async signIn(credentialsDto: CredentialsDto): Promise<{ token: string }> {
    const user = await this.userRepository.checkCredentials(credentialsDto);

    if (user === null) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.confirmationToken)
      throw new UnauthorizedException(
        'Confirme seu endereço de email para poder realizar login',
      );

    const jwtPayload: JwtPayload = {
      id: user.id.toString(),
    };
    const token = await this.jwtService.sign(jwtPayload);

    return { token };
  }

  async confirmEmail(confirmationToken: string): Promise<User> {
    const user = await this.userRepository.findOne(
      {
        confirmationToken,
        status: true,
      },
      {
        select: ['name', 'email', 'role'],
      },
    );

    if (!user) throw new NotFoundException('Usuário não cadastrado.');

    user.confirmationToken = null;
    await user.save();

    return user;
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { password, passwordConfirmation } = changePasswordDto;

    if (password != passwordConfirmation)
      throw new UnprocessableEntityException('As senhas não conferem');

    await this.userRepository.changePassword(id, password);
  }

  async sendRecoverPasswordEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ email });

    if (!user)
      throw new NotFoundException('Não há usuário cadastrado com esse email.');

    user.recoverToken = randomBytes(32).toString('hex');
    user.save();
    const mail = {
      from: 'UUEBI <nao-responda@uuebi.com>',
      to: user.email,
      subject: 'Alteração de senha',
      template: 'recover-password',
      context: {
        emailTitle: 'Alteração de senha',
        token: user.recoverToken,
      },
    };
    this.mailService.sendMail(mail);
  }

  async resetPassword(
    recoverToken: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne(
      { recoverToken },
      {
        select: ['id'],
      },
    );
    if (!user) throw new NotFoundException('Token inválido.');

    try {
      await this.changePassword(user.id.toString(), changePasswordDto);
      user.recoverToken = null;
      await user.save();
    } catch (error) {
      throw error;
    }
  }
}
