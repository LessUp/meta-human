import { Activity, Github, Twitter, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
  isRoute?: boolean;
  isAnchor?: boolean;
};

const footerLinks = {
  product: {
    title: '产品',
    links: [
      { label: '在线体验', href: '/app', isRoute: true },
      { label: '功能特性', href: '#features', isAnchor: true },
      { label: '技术架构', href: '#tech-stack', isAnchor: true },
      { label: '更新日志', href: 'CHANGELOG.md' },
    ] as FooterLink[],
  },
  resources: {
    title: '资源',
    links: [
      { label: '快速开始', href: 'docs/' },
      { label: 'API 文档', href: 'docs/api/' },
      { label: '架构设计', href: 'docs/architecture/' },
      { label: '贡献指南', href: 'docs/contributing/' },
    ] as FooterLink[],
  },
  community: {
    title: '社区',
    links: [
      { label: 'GitHub', href: 'https://github.com/LessUp/meta-human', external: true },
      { label: '讨论区', href: 'https://github.com/LessUp/meta-human/discussions', external: true },
      { label: '问题反馈', href: 'https://github.com/LessUp/meta-human/issues', external: true },
      { label: 'Twitter', href: 'https://x.com/LessUpHQ', external: true },
    ] as FooterLink[],
  },
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleAnchorClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const element = document.querySelector<HTMLElement>(href);
    if (element) {
      const offset = 88;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-[#050508] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Activity className="w-6 h-6 text-blue-400" />
              <span className="text-lg font-semibold text-white">MetaHuman</span>
            </Link>
            <p className="text-sm text-gray-500 mb-4">浏览器原生的 3D 数字人交互引擎</p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/LessUp/meta-human"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/LessUpHQ"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : link.isRoute ? (
                      <Link
                        to={link.href}
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : link.isAnchor ? (
                      <a
                        href={link.href}
                        onClick={(e) => handleAnchorClick(e, link.href)}
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-center text-sm text-gray-600 sm:text-left">
            © {currentYear} LessUp. Open source under MIT License.
          </p>
          <p className="flex items-center justify-center gap-1 text-center text-sm text-gray-600 sm:justify-end sm:text-right">
            Built with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> to make digital
            humans accessible
          </p>
        </div>
      </div>
    </footer>
  );
}
