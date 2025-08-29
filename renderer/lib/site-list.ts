export interface Site {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: 'communication' | 'professional' | 'productivity';
}

export const defaultSites: Site[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    url: 'https://mail.google.com',
    icon: '📧',
    description: 'Google Mail - 이메일 관리',
    category: 'communication'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: 'https://www.linkedin.com',
    icon: '💼',
    description: 'LinkedIn - 전문 네트워킹',
    category: 'professional'
  },
  {
    id: 'slack',
    name: 'Slack',
    url: 'https://slack.com',
    icon: '💬',
    description: 'Slack - 팀 커뮤니케이션',
    category: 'communication'
  }
];

export const getSiteById = (id: string): Site | undefined => {
  return defaultSites.find(site => site.id === id);
};

export const getSitesByCategory = (category: Site['category']): Site[] => {
  return defaultSites.filter(site => site.category === category);
};
