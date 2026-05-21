declare module '@vercel/analytics/next' {
  import * as React from 'react'
  type AnalyticsProps = React.ComponentProps<'div'> & {
    [key: string]: any
  }
  export const Analytics: React.ComponentType<AnalyticsProps>
  export default Analytics
}
