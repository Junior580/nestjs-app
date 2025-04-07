import 'fastify';

import { CurrentUser } from '@/modules/auth/types/current-user';

declare module 'fastify' {
  export interface FastifyRequest {
    user: CurrentUser;
  }
}
