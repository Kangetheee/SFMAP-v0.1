import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { ClerkLoaded, ClerkLoading, SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left section with light green background */}
      <div className="h-full lg:flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-4 pt-16">
          <h1 className="font-extrabold text-3xl sm:text-4xl text-[#2E2A47]">
            Welcome Back!
          </h1>
          <p className="text-base sm:text-lg text-[#7EBCA0] font-semibold">
            Log in or Create account to get back to your dashboard!
          </p>
        </div>
        <div className="flex items-center justify-center mt-8">
          <ClerkLoaded>
            <SignIn path="/sign-in" />
          </ClerkLoaded>
          <ClerkLoading>
            <Loader2 className="animate-spin text-muted-foreground" />
          </ClerkLoading>
        </div>
      </div>

      {/* Right section with centered logo */}
      <div className="h-full bg-green-600 hidden lg:flex items-center justify-center">
        <Image
          src="/logo.svg"
          height={350}
          width={350}
          alt="logo"
        />
      </div>
    </div>
  );
}
