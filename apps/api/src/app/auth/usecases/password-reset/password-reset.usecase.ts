import { Injectable } from '@nestjs/common';
import { UserRepository } from '@novu/dal';
import * as bcrypt from 'bcrypt';
import { isBefore, subDays } from 'date-fns';
import { PasswordResetCommand } from './password-reset.command';
import { ApiException } from '../../../shared/exceptions/api.exception';
import { AuthService } from '../../services/auth.service';
import { CacheKeyPrefixEnum, CacheService, invalidateCache } from '../../../shared/services/cache';

@Injectable()
export class PasswordReset {
  constructor(
    private cacheService: CacheService,
    private userRepository: UserRepository,
    private authService: AuthService
  ) {}

  async execute(command: PasswordResetCommand): Promise<{ token: string }> {
    const user = await this.userRepository.findUserByToken(command.token);
    if (!user) {
      throw new ApiException('Bad token provided');
    }

    if (isBefore(new Date(user.resetTokenDate), subDays(new Date(), 7))) {
      throw new ApiException('Token has expired');
    }

    const passwordHash = await bcrypt.hash(command.password, 10);

    invalidateCache({
      service: this.cacheService,
      storeKeyPrefix: [CacheKeyPrefixEnum.USER],
      credentials: {
        _id: user._id,
      },
    });

    await this.userRepository.update(
      {
        _id: user._id,
      },
      {
        $set: {
          password: passwordHash,
        },
        $unset: {
          resetToken: 1,
          resetTokenDate: 1,
          resetTokenCount: '',
        },
      }
    );

    return {
      token: await this.authService.generateUserToken(user),
    };
  }
}
