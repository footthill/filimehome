import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Narrators from './pages/Narrators';
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Umusobanuzi from './pages/umusobanuzi';
import MovieDetails from './pages/movedetails';
import MovieWatch from './pages/watch';
import Subscription from './pages/subscription';
import SidebarResizeListener from './components/isopen';
import AppComingSoon from './pages/app';
import AppRegister from './pages/register';
import RouteTracker from './components/RouterTracker';

function App() {
  return (
    <Router>
         <RouteTracker />
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/browse" element={<Layout><Browse /></Layout>} />
          <Route path="/umusobanuzi/:id" element={<Layout><Umusobanuzi /></Layout>} />
          <Route path="/narrators" element={<Layout><Narrators /></Layout>} />
          <Route path="/details/:id" element={<Layout><MovieDetails/></Layout>} />
          <Route path="/subscription" element={<Layout><Subscription/></Layout>} />
          <Route path="/watch" element={<MovieWatch/>} />
          <Route path="/Appcoming" element={<AppComingSoon/>} />
          <Route path="/register" element={<AppRegister />} />
          </Routes>
        <SidebarResizeListener />
    </Router>
  );
}

export default App;
