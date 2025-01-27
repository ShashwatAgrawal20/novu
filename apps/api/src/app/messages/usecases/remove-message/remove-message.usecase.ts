import { Injectable } from '@nestjs/common';
import { DalException, MessageRepository } from '@novu/dal';
import { RemoveMessageCommand } from './remove-message.command';
import { ApiException } from '../../../shared/exceptions/api.exception';
import { CacheKeyPrefixEnum, CacheService, invalidateCache } from '../../../shared/services/cache';

@Injectable()
export class RemoveMessage {
  constructor(private cacheService: CacheService, private messageRepository: MessageRepository) {}

  async execute(command: RemoveMessageCommand) {
    try {
      const message = await this.messageRepository.findSubscriberById({
        _environmentId: command.environmentId,
        _id: command.messageId,
      });

      invalidateCache({
        service: this.cacheService,
        storeKeyPrefix: [CacheKeyPrefixEnum.MESSAGE_COUNT, CacheKeyPrefixEnum.FEED],
        credentials: {
          subscriberId: message.subscriber.subscriberId,
          environmentId: command.environmentId,
        },
      });

      await this.messageRepository.delete({
        _environmentId: command.environmentId,
        _id: command.messageId,
      });
    } catch (e) {
      if (e instanceof DalException) {
        throw new ApiException(e.message);
      }
      throw e;
    }

    return {
      acknowledged: true,
      status: 'deleted',
    };
  }
}
