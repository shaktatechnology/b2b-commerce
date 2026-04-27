import { LoginForm } from '@/src/components/auth-components/login-form';
import { PageWrapper } from '@/src/components/layout-components/page-wrapper';

export default function LoginPage() {
  return (
    <PageWrapper className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <LoginForm />
      </div>
    </PageWrapper>
  );
}