import { User } from '@/app/types';

export const dispatchUserLogin = (user: User): void => {
  window.dispatchEvent(
    new CustomEvent('user-login', { 
      detail: user 
    })
  );
};

export const dispatchUserLogout = (): void => {
  window.dispatchEvent(new Event('user-logout'));
};
