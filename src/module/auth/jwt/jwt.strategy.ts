import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Payload } from './jwt.payload';
import { Request } from 'express';
import { UserRepository } from '../../../domain/user/user.repository';
import { User } from '../../../domain/user/user.entity';
import { UserNotFoundException } from '../../../domain/user/user.exception';

/**
 * jwt 인증 전략
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.Authentication;
        },
      ]),
      secretOrKey: 'secretKey',
      ignoreExpiration: false,
    });
  }

  async validate({ email }: Payload): Promise<User> {
    const user = await this.userRepository.findOneBy({ email });

    if (user) return user;

    throw new UserNotFoundException();
  }
}
