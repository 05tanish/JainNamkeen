import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';

// Public pages
import Home from './pages/public/Home';
import Products from './pages/public/Products';
import ProductDetail from './pages/public/ProductDetail';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import About from './pages/public/About';
import Offers from './pages/public/Offers';
import PageView from './pages/PageView';

// User pages
import Cart from './pages/user/Cart';
import Checkout from './pages/user/Checkout';
import UserOrders from './pages/user/UserOrders';

// Admin & Staff panels
import AdminPanel from './pages/admin/AdminPanel';
import StaffPanel from './pages/staff/StaffPanel';
import Profile from './pages/shared/Profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" />
          <Navbar />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/pages/:slug" element={<PageView />} />

            {/* User */}
            <Route path="/cart" element={<ProtectedRoute roles={['user']}><Cart /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute roles={['user']}><Checkout /></ProtectedRoute>} />
            <Route path="/my-orders" element={<ProtectedRoute roles={['user']}><UserOrders /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />

            {/* Staff */}
            <Route path="/staff/*" element={<ProtectedRoute roles={['staff']}><StaffPanel /></ProtectedRoute>} />
            {/* Shared Profile */}
            <Route path="/profile" element={<ProtectedRoute roles={['user', 'admin', 'staff']}><Profile /></ProtectedRoute>} />
          </Routes>
          <Footer />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
