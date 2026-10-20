import HeroSection from "./HeroSection";
import Categories from "./Categories";
import Footer from "./Footer";

const UserDashboard = () => {
  return (
    <div className="flex min-h-screen flex-col justify-between">
      <div>
        <HeroSection />
        <Categories />
      </div>
      <Footer />
    </div>
  );
};

export default UserDashboard;
