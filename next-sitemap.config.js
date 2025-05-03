/** next-sitemap.config.js **/
/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://diamond-diaries-next.vercel.app',
    generateRobotsTxt: true,
    changefreq: 'daily',
    priority: 0.7,
  
  
    additionalPaths: async (config) => [
      `${config.siteUrl}/login`,
      `${config.siteUrl}/signup`,
      `${config.siteUrl}/forgot-password`,
      `${config.siteUrl}/oauth2/redirect`,
    ],
  };
  