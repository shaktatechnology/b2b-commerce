"use client";

import {
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
  FaTwitter,
  FaLinkedin,
  FaTiktok,
} from "react-icons/fa6";
import { Send } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SocialLinks {
  facebook_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  tiktok_url?: string;
  whatsapp_number?: string;
}

interface FooterProps {
  logo?: string | null;
  metaDescription?: string;
  socialLinks?: SocialLinks;
  categories?: Category[];
}

export default function Footer({
  logo,
  metaDescription,
  socialLinks = {},
  categories = [],
}: FooterProps) {
  return (
    <footer className="bg-gradient-to-r from-purple-500 to-purple-400 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* LEFT */}
        <div>
          {logo ? (
            <img src={logo} alt="logo" className="h-10 mb-4" />
          ) : (
            <div className="bg-gray-200 text-black w-[120px] text-center py-1 font-semibold mb-4">
              LOGO
            </div>
          )}

          <p className="text-sm leading-6 text-white/90">
            {metaDescription || "Your trusted B2B platform."}
          </p>
        </div>

        {/* MIDDLE */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm text-white/90">
            {categories.slice(0, 6).map((cat) => (
              <li
                key={cat.id}
                className="hover:text-white cursor-pointer transition"
              >
                <a href={`/category/${cat.slug}`}>{cat.name}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Follow us on:</h3>

          <div className="flex gap-4 mb-6 text-xl">
            {socialLinks.facebook_url && (
              <a
                href={socialLinks.facebook_url}
                target="_blank"
                rel="noreferrer"
              >
                <FaFacebook />
              </a>
            )}

            {socialLinks.instagram_url && (
              <a
                href={socialLinks.instagram_url}
                target="_blank"
                rel="noreferrer"
              >
                <FaInstagram />
              </a>
            )}

            {socialLinks.youtube_url && (
              <a
                href={socialLinks.youtube_url}
                target="_blank"
                rel="noreferrer"
              >
                <FaYoutube />
              </a>
            )}

            {socialLinks.twitter_url && (
              <a
                href={socialLinks.twitter_url}
                target="_blank"
                rel="noreferrer"
              >
                <FaTwitter />
              </a>
            )}

            {socialLinks.linkedin_url && (
              <a
                href={socialLinks.linkedin_url}
                target="_blank"
                rel="noreferrer"
              >
                <FaLinkedin />
              </a>
            )}

            {socialLinks.tiktok_url && (
              <a href={socialLinks.tiktok_url} target="_blank" rel="noreferrer">
                <FaTiktok />
              </a>
            )}

            {socialLinks.whatsapp_number && (
              <a
                href={`https://wa.me/${socialLinks.whatsapp_number}`}
                target="_blank"
                rel="noreferrer"
              >
                <FaWhatsapp />
              </a>
            )}
          </div>

          <h3 className="text-lg font-semibold mb-2">Subscribe</h3>
          <p className="text-sm text-white/90 mb-3">
            Get 10% off your first order
          </p>

          <div className="flex border border-white rounded-md overflow-hidden">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-3 py-2 bg-transparent outline-none placeholder-white/70 text-sm"
            />
            <button className="bg-white text-purple-500 px-4 font-semibold  cursor-pointer hover:bg-white/90 transition">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-200 text-black text-center py-3 text-sm">
        <div>Copyright © {new Date().getFullYear()} All Rights Reserved</div>

        <div className="mt-1">
          Designed & Developed by{" "}
          <a
            href="https://shaktatechnology.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline  cursor-pointer hover:text-primary/50 text-primary "
          >
            Shakta Technology
          </a>
        </div>
      </div>
    </footer>
  );
}
