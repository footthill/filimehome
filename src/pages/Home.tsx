import MovieHeroSection from "../components/Hero";
import Listing from "../components/ListingSection";
// import MadeForU from "../components/madeforusection";
import MovieSwiper from "../components/MovieSwiper";

const Home = () => (
  <div>
    <MovieHeroSection/>
    <Listing/>
    {/* <MadeForU/> */}
<>
  <MovieSwiper title="Hot Seasons You Can't Miss" genres={['Serie']} />
  <MovieSwiper title="Steamy Romance Hits" genres={['Romance']} />
  <MovieSwiper title="Classic Korean Gems" genres={['South Korea']} />
  <MovieSwiper title="Timeless Indian Classics" genres={['India']} />
  <MovieSwiper title="Horror Nights to Chill You" genres={['Horror']} />
  <MovieSwiper title="Sci-Fi Zone: Futuristic Adventures" genres={['Sci-Fi']} />
  <MovieSwiper title="Cartoon Craze: Fun for All Ages" genres={['Animation']} />
  <MovieSwiper title="Dramatic Tales That Move You" genres={['Drama']} />
  {/* Additional Swipers */}
  <MovieSwiper title="Mystery & Thrills to Keep You Guessing" genres={['Mystery', 'Thriller']} />
  <MovieSwiper title="Laugh Out Loud Comedies" genres={['Comedy']} />
  <MovieSwiper title="Action-Packed Adventures" genres={['Action']} />
  <MovieSwiper title="Mind-Bending Indies" genres={['Independent', 'Drama']} />
  <MovieSwiper title="Fantasy Realms Await" genres={['Fantasy']} />
  <MovieSwiper title="Historical Epics" genres={['History', 'Drama']} />
  <MovieSwiper title="Teen & Young Adult Favorites" genres={['Teen', 'Romance']} />
</>

  </div>
);

export default Home;
