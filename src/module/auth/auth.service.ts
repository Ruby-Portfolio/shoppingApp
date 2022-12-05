import { Injectable } from '@nestjs/common';
import { OAuth2User } from './auth.dto';
import { UserRepository } from '../../domain/user/user.repository';
import { User } from '../../domain/user/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async authLogin(oAuth2User: OAuth2User): Promise<User | null> {
    const { providerId } = oAuth2User;

    const user = await this.userRepository
      .findByProviderId(providerId)
      .then((user: User) => user || this.userRepository.save(oAuth2User));

    if (this.isUpdateState(oAuth2User, user)) {
      const updateResult = await this.userRepository.update(
        user.id,
        oAuth2User,
      );

      return updateResult.raw[0];
    }

    return user;
  }

  isUpdateState(updateObj, entity): boolean {
    if (!entity) return true;
    return Object.keys(updateObj).some((key) => updateObj[key] !== entity[key]);
  }
}
