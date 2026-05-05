import './globals.css'
import ClientHeader from '../components/ClientHeader'
import Footer from '../components/Footer'
import { AlertProvider } from '../context/AlertContext'

export const metadata = {
    title: 'ABUTutorsConnect',
    description: 'ABU Peer-Tutoring Marketplace',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <AlertProvider>
                    <ClientHeader />
                    {children}
                    <Footer />
                </AlertProvider>
            </body>
        </html>
    )
}
