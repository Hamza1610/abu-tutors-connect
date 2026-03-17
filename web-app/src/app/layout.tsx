import './globals.css'
import ClientHeader from '../components/ClientHeader'

export const metadata = {
    title: 'ABUTutorsConnect',
    description: 'ABU Peer-Tutoring Marketplace',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <ClientHeader />
                {children}
            </body>
        </html>
    )
}
