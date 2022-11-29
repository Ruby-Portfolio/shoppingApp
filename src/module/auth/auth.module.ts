import { Module } from '@nestjs/common';
import { CustomTypeOrmModule } from '../typeorm/typeorm.module';
import { UserRepository } from '../../domain/user/user.repository';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './auth.strategy';
import { JwtStrategy } from './jwt/jwt.strategy';

@Module({
  imports: [
    CustomTypeOrmModule.forCustomRepository([UserRepository]),
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '1y' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
})
export class AuthModule {}
