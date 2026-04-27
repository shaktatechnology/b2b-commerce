'use client';

import * as React from 'react';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedinIn, 
  FaYoutube, 
  FaGithub, 
  FaGlobe,
  FaEnvelope,
  FaPhone
} from 'react-icons/fa';
import { getSocialLinks, SocialLink } from '@/src/lib/social-links';
import { cn } from '@/src/lib/utils';

const iconMap: Record<string, any> = {
  facebook: FaFacebookF,
  twitter: FaTwitter,
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
  youtube: FaYoutube,
  github: FaGithub,
  mail: FaEnvelope,
  phone: FaPhone,
  website: FaGlobe,
};

interface SocialLinksProps {
  className?: string;
  itemClassName?: string;
}

export function SocialLinks({ className, itemClassName }: SocialLinksProps) {
  const [links, setLinks] = React.useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    getSocialLinks()
      .then((res) => setLinks(res.data))
      .catch((err) => console.error('Failed to fetch social links:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || links.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {links.map((link) => {
        const Icon = iconMap[link.platform.toLowerCase()] || FaGlobe;
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300',
              itemClassName
            )}
            aria-label={link.label || link.platform}
          >
            <Icon className="size-5" />
          </a>
        );
      })}
    </div>
  );
}
