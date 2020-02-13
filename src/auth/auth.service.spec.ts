import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepository } from './../users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './../users/dto/create-user.dto';
import { UserRole } from '../users/user-roles.enum';
import {
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import { CredentialsDto } from './dto/credentials.dto';

const mockUsersRepository = () => ({
  createUser: jest.fn(),
  checkCredentials: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepository;
  let jwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useFactory: mockUsersRepository },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    service = await module.get<AuthService>(AuthService);
    userRepository = await module.get<UserRepository>(UserRepository);
    jwtService = await module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    let mockCreateUserDto: CreateUserDto;
    beforeEach(() => {
      mockCreateUserDto = {
        email: 'mock@email.com',
        name: 'Mock User',
        password: 'mockPassword',
        passwordConfirmation: 'mockPassword',
      };
    });

    it('should signs user up', async () => {
      userRepository.createUser.mockResolvedValue('newCreatedMockUser');
      expect(userRepository.createUser).not.toHaveBeenCalled();

      const result = await service.signUp(mockCreateUserDto);
      expect(userRepository.createUser).toHaveBeenCalledWith(
        mockCreateUserDto,
        UserRole.USER,
      );
      expect(result).toEqual('newCreatedMockUser');
    });

    it('should throw an error if passwords dont match', async () => {
      expect(service.signUp(mockCreateUserDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('signIn', () => {
    let mockCredentials: CredentialsDto;
    beforeEach(() => {
      mockCredentials = {
        email: 'mock@email.com',
        password: 'mockPassword',
      };
    });

    it('should check the user credentials, call the jwtService sign method and return the token', async () => {
      userRepository.checkCredentials.mockResolvedValue('mockUserId');
      jwtService.sign.mockResolvedValue('mockToken');

      const result = await service.signIn(mockCredentials);
      expect(userRepository.checkCredentials).toHaveBeenCalledWith(
        mockCredentials,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({ id: 'mockUserId' });
      expect(result).toEqual({ token: 'mockToken' });
    });

    it('should throw an error if provided credentials are invalid', async () => {
      userRepository.checkCredentials.mockResolvedValue(null);
      expect(service.signIn(mockCredentials)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
