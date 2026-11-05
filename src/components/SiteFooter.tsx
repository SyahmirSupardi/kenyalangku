/* Full document links are required: Home is a standalone WebGL document. */
/* eslint-disable @next/next/no-html-link-for-pages */
import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="kk-footer7" aria-label="KenyalangKu footer">
      <div className="kk-footer7__inner">
        <div className="kk-footer7__top">
          <div className="kk-footer7__identity">
            <a className="kk-footer7__brand" href="/" aria-label="KenyalangKu home">
              <Image src="/images/kenyalangku/kenyalangku-logo.png" alt="" width={48} height={48} />
              <span><small lang="ms-Arab" dir="rtl">کڽالڠکو</small>KenyalangKu</span>
            </a>
          </div>
          <nav className="kk-footer7__column" aria-label="Footer navigation">
            <h2>Navigation</h2>
            <a href="/projects">Projects</a>
            <a href="/about">Studio</a>
            <a href="/collaboration">Collaboration</a>
            <a href="/contact">Contact</a>
          </nav>
          <div className="kk-footer7__column kk-footer7__about">
            <h2>Who we are</h2>
            <p>An independent Malaysian game studio building worlds shaped by curiosity and imagination.</p>
          </div>
          <div className="kk-footer7__column kk-footer7__connect">
            <h2>Connect</h2>
            <a href="mailto:kenyalangku@gmail.com">Email the studio ↗</a>
          </div>
        </div>
        <div className="kk-footer7__bottom">
          <div className="kk-footer7__legal">
            <span>© {new Date().getFullYear()} KenyalangKu · Kuching, Sarawak</span>
            <a href="#main">Back to top ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
