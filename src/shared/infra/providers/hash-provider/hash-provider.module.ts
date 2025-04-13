import { Module } from '@nestjs/common';

import { BcryptjsHashProvider } from './bcrypt-hash.provider';

@Module({
  providers: [BcryptjsHashProvider],
  exports: [BcryptjsHashProvider],
})
export class HashProviderModule {}
