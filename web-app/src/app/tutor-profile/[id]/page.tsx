import TutorProfileClient from './TutorProfileClient';

export function generateStaticParams() {
    return [{ id: '1' }];
}

export default function Page() {
    return <TutorProfileClient />;
}
