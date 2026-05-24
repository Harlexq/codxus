import Logo from "../Logo";
import HeaderActions from "./more/HeaderActions";
import NavItems from "./more/NavItems";

const Header = () => {
  return (
    <header className="border border-b-neutral-800 h-16">
      <div className="container-fluid flex items-center justify-between h-full">
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
