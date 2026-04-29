import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Menu, X, Github, Play } from 'lucide-react';

const navLinks = [
  { label: '功能', href: '#features' },
  { label: '技术', href: '#tech-stack' },
  { label: '快速开始', href: '#quickstart' },
  { label: '文档', href: 'docs/', external: true },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector<HTMLElement>(href);
    if (element) {
      const offset = 88;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-lg border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Activity className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <div className="absolute inset-0 bg-blue-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              MetaHuman
            </span>
            <span className="hidden sm:inline-flex text-xs bg-blue-500/20 px-2 py-0.5 rounded text-blue-300 border border-blue-500/30">
              ENGINE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              )
            )}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://github.com/LessUp/meta-human"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-blue-600/20"
            >
              <Play className="w-4 h-4" />
              立即体验
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mx-auto max-w-7xl space-y-3 border-t border-white/10 bg-black/95 px-4 py-4 backdrop-blur-lg">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                className="block w-full text-left py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className="block w-full text-left py-2 text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
              </button>
            )
          )}
          <div className="pt-3 border-t border-white/10 flex items-center gap-3">
            <a
              href="https://github.com/LessUp/meta-human"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
            <Link
              to="/app"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Play className="w-4 h-4" />
              立即体验
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
