import { TestingModule, Test } from '@nestjs/testing';
import { UserRepository } from '../users/users.repository';
import { JwtStrategy } from './jwt.strategy';
import { JwtPayload } from './jwt-payload.interface';
import { UnauthorizedException } from '@nestjs/common';

const mockUsersRepository = () => ({
  findOne: jest.fn(),
});

describe('JwtStrategy', () => {
  let userRepository;
  let jwtStrategy;
  let jwtPayload: JwtPayload;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UserRepository, useFactory: mockUsersRepository },
      ],
    }).compile();

    userRepository = await module.get<UserRepository>(UserRepository);
    jwtStrategy = await module.get<JwtStrategy>(JwtStrategy);

    jwtPayload = {
      id: 'mockId',
    };
  });

  it('should be defined', () => {
    expect(userRepository).toBeDefined();
    expect(jwtStrategy).toBeDefined();
  });

  it('should validate the payload of the token, returning the user', async () => {
    userRepository.findOne.mockResolvedValue('mockUser');

    const result = await jwtStrategy.validate(jwtPayload);
    expect(userRepository.findOne).toHaveBeenCalledWith('mockId');
    expect(result).toEqual('mockUser');
  });

  it('should throw an error if no user is found', async () => {
    userRepository.findOne.mockResolvedValue(null);
    expect(jwtStrategy.validate(jwtPayload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
