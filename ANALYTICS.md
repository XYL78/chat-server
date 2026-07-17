# Vercel Web Analytics Configuration

## Installation

The `@vercel/analytics` package has been installed in this project:

```bash
npm install @vercel/analytics
```

## Important Limitations

⚠️ **This is a backend-only WebSocket server project without a frontend interface.**

Vercel Web Analytics is designed specifically for frontend/web applications that serve HTML pages to browsers. It tracks:
- Page views
- Visitor interactions
- Browser/device information
- User demographics

Since this project only provides WebSocket API endpoints (`/ws`) and has no user-facing web interface, **Web Analytics cannot actively track any metrics**.

## What This Means

1. **No Analytics Data**: Without HTML pages being loaded in browsers, no analytics data will be collected
2. **Package Available**: The `@vercel/analytics` package is installed and available should you add a frontend
3. **Future Use**: If you add a web interface (HTML pages) to this project in the future, you can integrate analytics by following the Vercel documentation

## For Backend Monitoring

For monitoring this WebSocket server, consider using:
- **Vercel Logs**: Track function invocations and errors
- **Vercel Observability**: Monitor serverless function performance
- **Custom Logging**: Implement application-level logging for WebSocket connections and messages

## Enabling Analytics Dashboard

To enable the analytics dashboard (even though no data will be collected currently):
1. Go to your Vercel project dashboard
2. Navigate to the **Analytics** tab in the sidebar
3. Click **Enable** to activate the feature

## Future Integration

If you add a frontend to this project, integrate analytics based on your framework:

### For Static HTML
Add to your HTML file:
```html
<script>
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
</script>
<script defer src="/_vercel/insights/script.js"></script>
```

### For React/Next.js Frontend
```javascript
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

For more details, see: https://vercel.com/docs/analytics/quickstart
