import { Injectable } from '@nestjs/common';
import { UserRepository } from '@novu/dal';
import { UpdateOnBoardingCommand } from './update-on-boarding.command';
import { CacheKeyPrefixEnum, CacheService, invalidateCache } from '../../../shared/services/cache';

@Injectable()
export class UpdateOnBoardingUsecase {
  constructor(private cacheService: CacheService, private readonly userRepository: UserRepository) {}

  async execute(command: UpdateOnBoardingCommand) {
    invalidateCache({
      service: this.cacheService,
      storeKeyPrefix: [CacheKeyPrefixEnum.USER],
      credentials: {
        _id: command.userId,
      },
    });

    await this.userRepository.update(
      {
        _id: command.userId,
      },
      {
        $set: {
          showOnBoarding: command.showOnBoarding,
        },
      }
    );

    return await this.userRepository.findById(command.userId);
  }
}
