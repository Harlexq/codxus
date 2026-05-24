import Logo from '../Logo';
import HeaderActions from './more/HeaderActions';
import NavItems from './more/NavItems';

const Header = () => {
  return (
    <header className="h-16 border border-b-neutral-800">
      <div className="container-fluid flex h-full items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <NavItems />
        </div>
        <HeaderActions />
      </div>
    </header>
  );
};

export default Header;
