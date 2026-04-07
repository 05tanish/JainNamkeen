import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import '../index.css';

export default function PageView() {
    const { slug } = useParams();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        API.get(`/pages/${slug}`)
            .then(res => {
                setPage(res.data);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [slug]);

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    if (error || !page) return <Navigate to="/" replace />; // Alternatively show a 404 component

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main className="container animate-fadeIn" style={{ flex: 1, padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '40px' }}>
                    <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', marginBottom: '32px', textAlign: 'center', fontSize: '2.5rem' }}>
                        {page.title}
                    </h1>

                    {/* Render raw HTML content from CMS */}
                    <div
                        className="page-content"
                        style={{ lineHeight: '1.8', color: 'var(--text-primary)', fontSize: '1.05rem' }}
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                </div>
            </main>
        </div>
    );
}
