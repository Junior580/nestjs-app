export enum Role {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  USER = 'USER',
}

export type CurrentUser = {
  id: string;
  role: Role;
};
