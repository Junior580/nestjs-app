import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

@Injectable()
export class BcryptjsHashProvider {
  async generateHash(payload: string): Promise<string> {
    return hash(payload, 6);
  }

  async compareHash(payload: string, hash: string): Promise<boolean> {
    return compare(payload, hash);
  }
}
