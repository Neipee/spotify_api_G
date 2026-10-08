interface UserProfile {
  country: string;
  display_name: string;
  email: string;
  explicit_content: {
    filter_enabled: boolean,
    filter_locked: boolean
  },
  external_urls: { spotify: string; };
  followers: { href: string; total: number; };
  href: string;
  id: string;
  images: Image[];
  product: string;
  type: string;
  uri: string;
}

interface Image {
  url: string;
  height: number;
  width: number;
}

interface Artist {
  external_urls: { spotify: string; };
  href: string;
  id: string;
  images: Image[];
  name: string;
  type: string;
  uri: string;
}

interface UserTopArtists {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: Artist[];
}

interface Track {
  album: { name: string; images: Image[]; };
  artists: { name: string; id: string; }[];
  external_urls: { spotify: string; };
  href: string;
  id: string;
  name: string;
  uri: string;
}

interface UserTopTracks {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: Track[];
}

interface SearchTracks {
  tracks: {
    href: string;
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
    items: Track[];
  };
}

interface UserFollowedArtists {
  artists: {
    href: string;
    limit: number;
    next: string | null;
    cursors: { after: string | null; before?: string | null; };
    total: number;
    items: Artist[];
  };
}
