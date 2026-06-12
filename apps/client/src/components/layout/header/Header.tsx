import Logo from '../Logo';
import HeaderActions from './components/HeaderActions';
import MobileHeaderTrigger from './components/MobileHeaderTrigger';
import NavItems from './components/NavItems';

const Header = () => {
  return (
    <header className="h-16 border-b border-neutral-800">
      <div className="container-fluid flex h-full items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <NavItems />
        </div>
        <HeaderActions />
        <MobileHeaderTrigger />
      </div>
    </header>
  );
};

export default Header;
