import 'express';

import { CurrentUser } from '@/modules/auth/types/current-user';

declare module 'express' {
  export interface Request {
    user: CurrentUser;
  }
}
