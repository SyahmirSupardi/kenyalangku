import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import AssetGallery, { type GalleryAsset } from "@/src/components/AssetGallery";
import styles from "./assets.module.css";

export const metadata: Metadata = {
  title: "Nazreen's 3D assets",
  description:
    "Explore interactive 3D game assets created by KenyalangKu 3D Asset Designer Nazreen Bin Abdul Radzak.",
};

const assetDetails: Record<string, Pick<GalleryAsset, "title" | "project" | "description">> = {
  "pavilion-pusaka.glb": {
    title: "Pavilion",
    project: "PUSAKA",
    description:
      "A pavilion asset for the world of PUSAKA. Rotate and zoom to examine its form and construction from every angle.",
  },
  "watchtower-pusaka.glb": {
    title: "Watchtower",
    project: "PUSAKA",
    description:
      "A watchtower asset for the world of PUSAKA. Turn the model to examine its form, textures, and construction from every angle.",
  },
};

const assetOrder: Record<string, number> = {
  "pavilion-pusaka.glb": 0,
  "watchtower-pusaka.glb": 1,
};

// The gallery lists its models explicitly so the page needs no file-system access
// at runtime (Cloudflare Workers has none). Add new models to assetDetails and assetOrder.
function getAssets(): GalleryAsset[] {
  return Object.keys(assetDetails)
    .sort((a, b) => (assetOrder[a] ?? Number.MAX_SAFE_INTEGER) - (assetOrder[b] ?? Number.MAX_SAFE_INTEGER))
    .map((filename) => ({
      id: filename,
      url: `/models/nazreen/${encodeURIComponent(filename)}`,
      ...assetDetails[filename],
    }));
}

export default function NazreenAssetsPage() {
  const assets = getAssets();

  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.topline}>
          <Link href="/about" className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to About Us
          </Link>
          <span>KENYALANGKU / ASSET STUDIO</span>
        </div>

        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}><i aria-hidden="true" /> NAZREEN BIN ABDUL RADZAK / 3D ASSET DESIGNER</p>
            <h1>Worlds begin <em>with details.</em></h1>
          </div>
          <p className={styles.heroCopy}>
            Explore Nazreen&apos;s game assets in 3D. Choose a model, drag to turn it,
            and zoom in to see the details behind the world.
          </p>
        </header>

        <AssetGallery assets={assets} />

        <div className={styles.closing}>
          <span>ROOTED IN CULTURE · BUILT FOR PLAY</span>
          <Link href="/projects/pusaka">
            Discover PUSAKA <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}
