import { Providers } from './providers'
import './globals.css'

export const metadata = {
  title: 'Habit Tracker',
  description: 'Track your habits and tasks',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
