import TutorDetailsClient from './TutorDetailsClient';

export function generateStaticParams() {
    return [{ id: '1' }];
}

export default function Page() {
    return <TutorDetailsClient />;
}
