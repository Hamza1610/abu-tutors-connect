import ResetPasswordClient from './ResetPasswordClient';

export function generateStaticParams() {
    return [{ token: 'id' }];
}

export default function Page() {
    return <ResetPasswordClient />;
}
