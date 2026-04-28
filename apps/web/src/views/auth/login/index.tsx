import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { env } from "next-runtime-env";
import { useEffect, useState } from "react";

import { authClient } from "@kan/auth/client";

import { Auth } from "~/components/AuthForm";
import LoadingSpinner from "~/components/LoadingSpinner";
import { PageHead } from "~/components/PageHead";
import PatternedBackground from "~/components/PatternedBackground";

export default function LoginPage() {
  const router = useRouter();
  const isSignUpDisabled = env("NEXT_PUBLIC_DISABLE_SIGN_UP") === "true";
  const [isMagicLinkSent, setIsMagicLinkSent] = useState<boolean>(false);
  const [magicLinkRecipient, setMagicLinkRecipient] = useState<string>("");

  const redirect = useSearchParams().get("next");

  const handleMagicLinkSent = (value: boolean, recipient: string) => {
    setIsMagicLinkSent(value);
    setMagicLinkRecipient(recipient);
  };

  const { data, isPending } = authClient.useSession();
  const isAuthed = !!data?.user?.id;

  useEffect(() => {
    if (isAuthed) router.push("/boards");
  }, [isAuthed, router]);

  return (
    <>
      <PageHead title={t`Login | kan.bn`} />
      <main className="h-screen bg-light-100 pt-20 dark:bg-dark-50 sm:pt-0">
        <div className="justify-top flex h-full flex-col items-center px-4 sm:justify-center">
          <div className="z-10 flex w-full flex-col items-center">
            <Link href="/" className="mb-6 flex items-center gap-2 text-light-1000 dark:text-dark-1000">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_dwello_login_logo)">
                  <circle cx="10" cy="19" r="1" fill="currentColor" />
                  <mask
                    id="mask0_dwello_login_logo"
                    style={{ maskType: "alpha" }}
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="24"
                    height="24"
                  >
                    <path
                      d="M24 24H15.5996V14.4004H12.5996C10.9202 14.4004 10.0801 14.3999 9.43848 14.7266C8.87399 15.0142 8.41457 15.4736 8.12695 16.0381C7.8 16.6798 7.7998 17.5201 7.7998 19.2002V24H0V0H24V24Z"
                      fill="#D9D9D9"
                    />
                  </mask>
                  <g mask="url(#mask0_dwello_login_logo)">
                    <path
                      d="M0 15.9C0 11.4265 3.62649 7.80005 8.1 7.80005H15.9C20.3735 7.80005 24 11.4265 24 15.9C24 20.3736 20.3735 24 15.9 24H8.1C3.62649 24 0 20.3736 0 15.9Z"
                      fill="currentColor"
                    />
                    <path
                      d="M15.6 8.39999C15.6 3.7608 19.3608 0 24 0V16.2H15.6V8.39999Z"
                      fill="currentColor"
                    />
                  </g>
                </g>
                <defs>
                  <clipPath id="clip0_dwello_login_logo">
                    <rect width="24" height="24" fill="currentColor" />
                  </clipPath>
                </defs>
              </svg>
              <h1 className="text-lg font-bold tracking-tight">dwello</h1>
            </Link>
            {isPending || isAuthed ? (
              <div className="mt-10 flex items-center text-light-1000 dark:text-dark-1000">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                <p className="mb-10 text-3xl font-bold tracking-tight text-light-1000 dark:text-dark-1000">
                  {isMagicLinkSent ? t`Check your inbox` : t`Welcome back`}
                </p>
                {isMagicLinkSent ? (
                  <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <p className="text-md mt-2 text-center text-light-1000 dark:text-dark-1000">
                      <Trans>
                        Click on the link we've sent to {magicLinkRecipient} to
                        sign in.
                      </Trans>
                    </p>
                  </div>
                ) : (
                  <div className="w-full rounded-lg border border-light-500 bg-light-300 px-4 py-10 dark:border-dark-400 dark:bg-dark-200 sm:max-w-md lg:px-10">
                    <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                      <Auth setIsMagicLinkSent={handleMagicLinkSent} />
                    </div>
                  </div>
                )}
                {(!isSignUpDisabled || redirect?.startsWith("/invite/")) && (
                  <p className="mt-4 text-sm text-light-1000 dark:text-dark-1000">
                    <Trans>
                      Don't have an account?{" "}
                      <span className="underline">
                        <Link
                          href={redirect ? `/signup?next=${redirect}` : "/signup"}
                        >
                          Sign up
                        </Link>
                      </span>
                    </Trans>
                  </p>
                )}
              </>
            )}
          </div>
          <PatternedBackground />
        </div>
      </main>
    </>
  );
}
