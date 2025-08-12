
import Header from '../components/Header';
import WelcomeBanner from '../components/WelcomeBanner';
import PopularVenues from '../components/PopularVenues';
import PopularSports from '../components/PopularSports';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <WelcomeBanner />
      <PopularVenues />
      <PopularSports />
      <Footer />
    </div>
  );
}
