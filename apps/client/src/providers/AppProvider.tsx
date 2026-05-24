import { ReactNode } from 'react';
import StoreProvider from './StoreProvider';

const AppProvider = ({ children }: { children: ReactNode }) => {
  return <StoreProvider>{children}</StoreProvider>;
};

export default AppProvider;
