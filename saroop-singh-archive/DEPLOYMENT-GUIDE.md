# Saroop Singh Archive - Deployment Guide

## Overview

The Saroop Singh Archive is a modern Next.js 15 application with a markdown-based CMS that can be deployed on multiple platforms. This guide covers deployment to Vercel (recommended) and other platforms.

## Prerequisites

- Node.js 18 or later
- npm or yarn package manager
- Git repository access

## Architecture Overview

The application uses:
- **Next.js 15** with App Router
- **Static Site Generation (SSG)** with Incremental Static Regeneration (ISR)
- **Markdown-based CMS** for content management
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Server Components** for optimal performance

## Deployment on Vercel (Recommended)

### 1. Initial Setup

1. Fork or clone the repository
2. Push to your GitHub account
3. Connect to Vercel:
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `packages/web` directory as the project root

### 2. Environment Variables

Set the following environment variables in Vercel:

```bash
# Required for content revalidation
REVALIDATE_SECRET=your-secure-random-string-here

# Optional: Custom domain configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 3. Build Configuration

Vercel automatically detects Next.js projects. The build configuration in `next.config.js` is already optimized for deployment.

### 4. Domain Setup

1. In Vercel dashboard, go to your project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed by Vercel

### 5. Deployment

- **Automatic**: Push to main branch triggers deployment
- **Manual**: Use Vercel CLI or dashboard to deploy

## Content Management Workflow

### Adding New Articles

1. Create a new markdown file in `shared/data/articles/`
2. Follow the naming convention: `YYYY-MM-DD_publication_title-slug.md`
3. Include proper frontmatter (see CMS.md for schema)
4. Commit and push changes
5. Trigger revalidation (optional, or wait for next deployment)

### Content Revalidation

The application supports on-demand revalidation via API endpoint:

```bash
POST /api/revalidate?secret=YOUR_REVALIDATE_SECRET
```

Optional parameters:
- `path=/articles` - Revalidate specific path
- `tag=articles` - Revalidate by cache tag

### Environment-specific Configuration

#### Production
- ISR enabled with 1-hour revalidation
- Image optimization enabled
- Metadata properly configured

#### Development
- Hot reload for content changes
- Debug information available
- Local image serving

## Alternative Deployment Options

### Static Export (GitHub Pages, Netlify)

1. Enable static export in `next.config.js`:
```javascript
output: 'export',
trailingSlash: true,
```

2. Build static files:
```bash
npm run build
```

3. Deploy the `out` directory to your static hosting service

### Docker Deployment

1. Use the provided Dockerfile (if available) or create:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Self-hosted

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Performance Optimization

The application is optimized for performance:

- **Static Generation**: All articles pre-rendered at build time
- **ISR**: Content updates without full rebuilds
- **Image Optimization**: Next.js Image component (recommended upgrade)
- **Bundle Optimization**: Code splitting and tree shaking
- **Caching**: Proper cache headers and revalidation strategy

## Monitoring and Maintenance

### Build Verification

Always verify successful builds:
```bash
npm run build
npm run start
```

### Content Validation

The application includes content validation:
- Markdown parsing verification
- Frontmatter schema validation
- Image path verification

### Performance Monitoring

Use Vercel Analytics or similar tools to monitor:
- Page load times
- Core Web Vitals
- User engagement metrics

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors
   - Verify markdown frontmatter syntax
   - Ensure all images exist

2. **Content Not Updating**
   - Verify revalidation endpoint
   - Check ISR configuration
   - Clear cache if necessary

3. **Image Loading Issues**
   - Verify image paths in markdown
   - Check Next.js image configuration
   - Ensure images are accessible

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

## Security Considerations

- REVALIDATE_SECRET should be strong and unique
- Enable CORS protection in production
- Use HTTPS for all production deployments
- Regularly update dependencies

## Backup and Recovery

### Content Backup
- Git repository contains all content
- Regular automated backups recommended
- Export content periodically

### Database-free Architecture
The markdown-based approach provides:
- Version control for all content
- Easy migration between platforms
- No database maintenance requirements

## Future Enhancements

Consider these improvements:
- Image optimization with Next.js Image component
- Search functionality
- Comment system integration
- Analytics implementation
- CDN optimization for images

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify build process locally
3. Review configuration files
4. Check environment variables

The application is designed to be deployment-friendly with minimal configuration required for most hosting platforms.