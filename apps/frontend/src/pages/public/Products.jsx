import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiFilter, FiX, FiChevronDown, FiTrendingUp, FiClock, FiStar } from 'react-icons/fi';
import { Skeleton } from '@heroui/react';
import { Pagination } from '@heroui/react';
import API from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import './Products.css';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'price_asc', label: 'Price: Low → High' },
    { value: 'price_desc', label: 'Price: High → Low' },
    { value: 'name_asc', label: 'Name: A → Z' },
];

const WEIGHT_OPTIONS = ['200g', '250g', '300g', '350g', '400g', '500g', '1.5 kg'];

// Memoized Skeleton component for product cards
const ProductCardSkeleton = memo(() => (
    <div className="product-card">
        <Skeleton height={240} style={{ borderRadius: 'var(--radius)', marginBottom: 16 }} />
        <div style={{ padding: 16 }}>
            <Skeleton height={20} width="60%" style={{ marginBottom: 8, borderRadius: 'var(--radius-sm)' }} />
            <Skeleton height={24} width="80%" style={{ marginBottom: 12, borderRadius: 'var(--radius-sm)' }} />
            <Skeleton height={20} width="40%" style={{ borderRadius: 'var(--radius-sm)' }} />
        </div>
    </div>
));
ProductCardSkeleton.displayName = 'ProductCardSkeleton';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const { user } = useAuth();
    const { addToCart } = useCart();
    const searchRef = useRef(null);
    const suggestTimer = useRef(null);
    const productsPerPage = 12;

    // Filters from URL params
    const activeCategory = searchParams.get('category') || '';
    const activeTag = searchParams.get('tag') || '';
    const activeSort = searchParams.get('sort') || 'newest';
    const activeMinPrice = searchParams.get('minPrice') || '';
    const activeMaxPrice = searchParams.get('maxPrice') || '';
    const activeWeight = searchParams.get('weight') || '';

    // Load categories and tags once
    useEffect(() => {
        API.get('/categories').then(res => setCategories(res.data));
        API.get('/products/tags').then(res => setTags(res.data));
    }, []);

    // Load recently viewed from localStorage
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
            if (stored.length > 0) {
                setRecentlyViewed(stored);
            }
        } catch { /* ignore */ }
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Fetch products based on filters
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const params = new URLSearchParams();
            if (activeCategory) params.set('category', activeCategory);
            if (activeTag) params.set('tag', activeTag);
            if (activeSort) params.set('sort', activeSort);
            if (activeMinPrice) params.set('minPrice', activeMinPrice);
            if (activeMaxPrice) params.set('maxPrice', activeMaxPrice);
            if (activeWeight) params.set('weight', activeWeight);
            if (search) params.set('search', search);
            params.set('limit', '50');

            const res = await API.get(`/products?${params}`);
            setProducts(res.data.products);
            setLoading(false);
        };
        fetchProducts();
    }, [activeCategory, activeTag, activeSort, activeMinPrice, activeMaxPrice, activeWeight, search]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory, activeTag, activeSort, activeMinPrice, activeMaxPrice, activeWeight, search]);

    // Auto-suggest debounced
    const handleSearchInput = useCallback((val) => {
        setSearch(val);
        if (suggestTimer.current) clearTimeout(suggestTimer.current);
        if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }

        suggestTimer.current = setTimeout(() => {
            API.get(`/products/suggest?q=${encodeURIComponent(val)}`).then(res => {
                setSuggestions(res.data);
                setShowSuggestions(res.data.length > 0);
            });
        }, 250);
    }, []);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const updateFilter = (key, value) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);
        setSearchParams(params);
    };

    const clearAllFilters = () => {
        setSearch('');
        setSearchParams({});
    };

    const hasFilters = activeCategory || activeTag || activeMinPrice || activeMaxPrice || activeWeight || activeSort !== 'newest';

    const handleAddToCart = async (productId) => {
        if (!user) {
            window.location.assign('/login');
            return;
        }
        await addToCart(productId);
    };

    const activeFilterCount = [activeCategory, activeTag, activeMinPrice || activeMaxPrice, activeWeight].filter(Boolean).length;

    // Memoize pagination calculations
    const paginationData = useMemo(() => {
        const indexOfLastProduct = currentPage * productsPerPage;
        const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
        const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
        const totalPages = Math.ceil(products.length / productsPerPage);
        
        return { currentProducts, totalPages, indexOfFirstProduct, indexOfLastProduct };
    }, [currentPage, products, productsPerPage]);

    const { currentProducts, totalPages } = paginationData;

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="page container">
            <div className="page-header" style={{
                background: 'var(--surface-container)',
                padding: '40px', borderRadius: 'var(--radius-lg)',
                marginBottom: '40px'
            }}>
                <h1 style={{ color: 'var(--text-primary)' }}>Our Collection</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Explore our premium range of namkeen, sweets & snacks</p>
            </div>

            {/* Search + Sort Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search with Auto-suggest */}
                <div ref={searchRef} style={{ position: 'relative', flex: '1 1 320px' }}>
                    <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                    <input
                        className="form-control"
                        placeholder="Search products... (try 'bhujia', 'spicy', 'sweet')"
                        value={search}
                        onChange={e => handleSearchInput(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        style={{ paddingLeft: 40 }}
                    />
                    {search && (
                        <button
                            onClick={() => { setSearch(''); setSuggestions([]); setShowSuggestions(false); }}
                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)', fontSize: '1rem' }}
                        ><FiX /></button>
                    )}
                    {/* Suggestions Dropdown */}
                    {showSuggestions && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 100,
                            background: 'var(--surface-container-lowest)', backdropFilter: 'blur(20px)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden'
                        }}>
                            {suggestions.length > 0 ? suggestions.map(s => (
                                <Link
                                    key={s._id}
                                    to={`/product/${s._id}`}
                                    onClick={() => setShowSuggestions(false)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 16,
                                        padding: '12px 20px', borderBottom: '1px solid var(--border)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'var(--primary-glow)';
                                        e.currentTarget.style.paddingLeft = '24px';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.paddingLeft = '20px';
                                    }}
                                >
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-surface)', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '1.5rem', overflow: 'hidden', flexShrink: 0,
                                        border: '1px solid var(--border)'
                                    }}>
                                        {(s.images && s.images.length > 0) || s.image ? <img src={s.images && s.images.length > 0 ? s.images[0].url : s.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍿'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{s.category?.name} <span style={{ color: 'var(--text-muted)' }}>· {s.weight}</span></div>
                                    </div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>₹{s.price}</div>
                                </Link>
                            )) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No products found</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sort Dropdown */}
                <div style={{ position: 'relative' }}>
                    <select
                        className="form-control"
                        value={activeSort}
                        onChange={e => updateFilter('sort', e.target.value)}
                        style={{ paddingRight: 36, minWidth: 180, appearance: 'none', cursor: 'pointer' }}
                    >
                        {SORT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <FiChevronDown style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>

                {/* Filter Toggle */}
                <button
                    className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ position: 'relative' }}
                >
                    <FiFilter /> Filters
                    {activeFilterCount > 0 && (
                        <span style={{
                            position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                            borderRadius: '50%', background: 'var(--primary)', color: '#fff',
                            fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                        }}>{activeFilterCount}</span>
                    )}
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="animate-fadeIn" style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: 24, marginBottom: 24
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>🔍 Refine Results</h3>
                        {hasFilters && (
                            <button className="btn btn-sm btn-secondary" onClick={clearAllFilters}>
                                <FiX /> Clear All
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                        {/* Category */}
                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category</label>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <button
                                    className={`btn btn-sm ${!activeCategory ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => updateFilter('category', '')}
                                    style={{ fontSize: '0.8rem' }}
                                >All</button>
                                {categories.map(cat => (
                                    <button
                                        key={cat._id}
                                        className={`btn btn-sm ${activeCategory === cat._id ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => updateFilter('category', cat._id)}
                                        style={{ fontSize: '0.8rem' }}
                                    >{cat.name}</button>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Price Range (₹)</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Min"
                                    value={activeMinPrice}
                                    onChange={e => updateFilter('minPrice', e.target.value)}
                                    style={{ width: 100 }}
                                    min="0"
                                />
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Max"
                                    value={activeMaxPrice}
                                    onChange={e => updateFilter('maxPrice', e.target.value)}
                                    style={{ width: 100 }}
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Weight */}
                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Weight / Size</label>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <button
                                    className={`btn btn-sm ${!activeWeight ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => updateFilter('weight', '')}
                                    style={{ fontSize: '0.8rem' }}
                                >All</button>
                                {WEIGHT_OPTIONS.map(w => (
                                    <button
                                        key={w}
                                        className={`btn btn-sm ${activeWeight === w ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => updateFilter('weight', w)}
                                        style={{ fontSize: '0.8rem' }}
                                    >{w}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tags</label>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {activeTag && (
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => updateFilter('tag', '')}
                                        style={{ fontSize: '0.78rem' }}
                                    ><FiX size={12} /> Clear tag</button>
                                )}
                                {tags.map(tag => (
                                    <button
                                        key={tag}
                                        className={`btn btn-sm ${activeTag === tag ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => updateFilter('tag', tag)}
                                        style={{
                                            fontSize: '0.78rem', padding: '5px 12px',
                                            borderRadius: 20, textTransform: 'capitalize'
                                        }}
                                    >#{tag}</button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Active Filters Summary */}
            {hasFilters && !showFilters && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active:</span>
                    {activeCategory && (
                        <span className="badge badge-confirmed" style={{ cursor: 'pointer' }} onClick={() => updateFilter('category', '')}>
                            {categories.find(c => c._id === activeCategory)?.name} ✕
                        </span>
                    )}
                    {activeTag && (
                        <span className="badge badge-processing" style={{ cursor: 'pointer' }} onClick={() => updateFilter('tag', '')}>
                            #{activeTag} ✕
                        </span>
                    )}
                    {(activeMinPrice || activeMaxPrice) && (
                        <span className="badge badge-pending" style={{ cursor: 'pointer' }} onClick={() => { updateFilter('minPrice', ''); updateFilter('maxPrice', ''); }}>
                            ₹{activeMinPrice || 0} - ₹{activeMaxPrice || '∞'} ✕
                        </span>
                    )}
                    {activeWeight && (
                        <span className="badge badge-shipped" style={{ cursor: 'pointer' }} onClick={() => updateFilter('weight', '')}>
                            {activeWeight} ✕
                        </span>
                    )}
                    <button onClick={clearAllFilters} style={{ background: 'none', color: 'var(--danger)', fontSize: '0.82rem', fontWeight: 600 }}>
                        Clear all
                    </button>
                </div>
            )}

            {/* Results count */}
            <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
            </div>

            {/* Product Grid */}
            {loading ? (
                <div className="grid grid-4">
                    {[...Array(8)].map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🔍</div>
                    <h3>No products found</h3>
                    <p>Try adjusting your filters or search term</p>
                    <button className="btn btn-primary btn-sm" onClick={clearAllFilters}>Clear Filters</button>
                </div>
            ) : (
                <div className="grid grid-4" style={{ marginTop: '20px' }}>
                    {currentProducts.map(product => (
                        <div key={product._id} className="product-card animate-fadeIn">
                            <Link to={`/product/${product._id}`} style={{ display: 'block' }}>
                                <div className="product-image">
                                    {(product.images && product.images.length > 0) || product.image ? (
                                        <img src={product.images && product.images.length > 0 ? product.images[0].url : (product.image?.startsWith('http') ? product.image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${product.image}`)} alt={product.name} />
                                    ) : (
                                        <span style={{ filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.1))' }}>🍿</span>
                                    )}
                                    {product.isFeatured && (
                                        <span style={{
                                            position: 'absolute', top: 12, left: 12, padding: '4px 12px',
                                            background: 'var(--primary)',
                                            borderRadius: 30, fontSize: '0.7rem', fontWeight: 800, color: '#FFF',
                                            textTransform: 'uppercase', letterSpacing: 1, boxShadow: '0 2px 10px rgba(160,65,0,0.4)'
                                        }}><FiStar style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Featured</span>
                                    )}
                                    {product.totalSold > 200 && (
                                        <span style={{
                                            position: 'absolute', top: 12, right: 12, padding: '4px 12px',
                                            background: 'var(--success)', borderRadius: 30,
                                            fontSize: '0.7rem', fontWeight: 800, color: '#FFF',
                                            textTransform: 'uppercase', letterSpacing: 1, boxShadow: '0 2px 10px rgba(16,185,129,0.3)'
                                        }}><FiTrendingUp style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Trending</span>
                                    )}
                                </div>
                                <div className="product-info">
                                    <div className="product-category">{product.category?.name || 'Snacks'}</div>
                                    <div className="product-name">{product.name}</div>
                                    <div className="product-price">₹{product.price}<span className="product-weight">{product.weight}</span></div>
                                    {product.tags && product.tags.length > 0 && (
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                                            {product.tags.slice(0, 3).map(tag => (
                                                <span
                                                    key={tag}
                                                    onClick={(e) => { e.preventDefault(); updateFilter('tag', tag); }}
                                                    style={{
                                                        fontSize: '0.7rem', padding: '4px 10px', borderRadius: 20,
                                                        background: 'var(--primary-glow)', color: 'var(--primary)',
                                                        cursor: 'pointer', textTransform: 'capitalize', border: '1px solid rgba(160,65,0,0.15)'
                                                    }}
                                                >#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <div className="product-actions" style={{ paddingTop: product.tags?.length > 0 ? 0 : 24 }}>
                                <button className="btn btn-primary" style={{ flex: 1, padding: '10px 0' }} onClick={(e) => { e.preventDefault(); handleAddToCart(product._id); }}>Add to Cart</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && products.length > productsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}>
                    <Pagination
                        total={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        size="lg"
                        showControls
                        showShadow
                    />
                </div>
            )}

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
                <div style={{ marginTop: 80, borderTop: '1px solid var(--border)', paddingTop: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
                        <FiClock style={{ color: 'var(--primary)', fontSize: '1.5rem' }} />
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--text-primary)' }}>Recently Viewed</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 16 }}>
                        {recentlyViewed.map(item => (
                            <Link
                                key={item._id}
                                to={`/product/${item._id}`}
                                style={{
                                    minWidth: 220, background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)', overflow: 'hidden', flexShrink: 0,
                                    transition: 'var(--transition)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                                <div style={{
                                    height: 160, background: 'var(--bg-surface)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '3rem', overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    {(item.images && item.images.length > 0) || item.image ? <img src={item.images && item.images.length > 0 ? item.images[0].url : (item.image?.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${item.image}`)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍿'}
                                </div>
                                <div style={{ padding: 16 }}>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{item.name}</div>
                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>₹{item.price}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
