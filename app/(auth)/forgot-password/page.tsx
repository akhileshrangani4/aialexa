import Link from "next/link";
import { Metadata } from "next";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import ForgotPasswordForm from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your password here",
};

export default async function ForgotPassword() {

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-4 top-4 md:left-8 md:top-8"
        )}
      >
        <>
          <Icons.chevronLeft className="mr-2 h-4 w-4" />
          Back
        </>
      </Link>
      <div data-aos="fade-up" data-aos-duration="1000" className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset your Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your registered email and then click on the button below to reset your password.
          </p>
          <div className="py-4">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
