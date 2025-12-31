import { CommunityPost } from '@/types/article';

const STORAGE_KEY = 'wnc_community_posts';

const MOCK_POSTS: CommunityPost[] = [
  {
    id: 'p1',
    userId: 'u2',
    userName: 'Traffic Watch',
    content: 'Avoid I-40 East near Exit 50. Major accident, traffic backed up for 3 miles.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    likes: 15,
    comments: 4,
    type: 'alert',
    location: { lat: 35.55, lng: -82.55, name: 'I-40 Exit 50' }
  },
  {
    id: 'p2',
    userId: 'u3',
    userName: 'Sarah Jenkins',
    content: 'Anyone know a good plumber available on weekends? My sink is leaking!',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    likes: 2,
    comments: 8,
    type: 'question',
    location: { lat: 35.58, lng: -82.56, name: 'North Asheville' }
  },
  {
    id: 'p3',
    userId: 'u4',
    userName: 'River Arts District',
    content: 'Gallery walk starts tonight at 5PM! Come enjoy free wine and local art.',
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    likes: 45,
    comments: 2,
    type: 'event',
    location: { lat: 35.59, lng: -82.57, name: 'River Arts District' }
  },
  {
    id: 'p4',
    userId: 'u5',
    userName: 'APD Scanner',
    content: 'Vehicle break-ins reported in downtown parking garage on College St. Multiple cars targeted overnight.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    likes: 28,
    comments: 12,
    type: 'crime',
    location: { lat: 35.596, lng: -82.551, name: 'Downtown Asheville' }
  },
  {
    id: 'p5',
    userId: 'u6',
    userName: 'Community Member',
    content: 'The new coffee shop on Merrimon is excellent. Great local roast and friendly staff!',
    timestamp: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    likes: 18,
    comments: 5,
    type: 'general'
  }
];

export const communityService = {
  getPosts: (): CommunityPost[] => {
    if (typeof window === 'undefined') return MOCK_POSTS;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_POSTS));
      return MOCK_POSTS;
    }
    return JSON.parse(stored);
  },

  createPost: (post: Omit<CommunityPost, 'id' | 'timestamp' | 'likes' | 'comments'>): CommunityPost => {
    const posts = communityService.getPosts();
    const newPost: CommunityPost = {
      ...post,
      id: `post-${Date.now()}`,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0
    };

    const updatedPosts = [newPost, ...posts];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    }
    return newPost;
  }
};
