import 'fastify';

import { Role } from '@/modules/auth/types/current-user';

declare module 'fastify' {
  export interface FastifyRequest {
    user: { id: string; role: Role };
  }
}
