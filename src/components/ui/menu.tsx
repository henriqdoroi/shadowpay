import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { FaUser } from "react-icons/fa";
import { AuthProvider } from "@/contexts/AuthContext";

function Menu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root {...props} />;
}

function MenuTrigger({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      className={cn(
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        className
      )}
      {...props}
    />
  );
}

function MenuContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Content
      className={cn(
        "bg-white dark:bg-gray-800 rounded-md shadow-md p-2 min-w-[150px] z-50",
        className
      )}
      {...props}
    />
  );
}

function MenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "cursor-pointer px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700",
        className
      )}
      {...props}
    />
  );
}

function MenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("h-px bg-gray-200 dark:bg-gray-700 my-1", className)}
      {...props}
    />
  );
}

export { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator };

const handleProfileClick = () => {
  // handle profile click
};

const router = useRouter();

<Menu>
  <MenuTrigger asChild>
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2 cursor-pointer"
    >
      <FaUser className="h-4 w-4" />
      Perfil
    </Button>
  </MenuTrigger>
  <MenuContent>
    <MenuItem onClick={handleProfileClick}>Meu Perfil</MenuItem>
    <MenuItem onClick={() => router.push("/v1/settings")}>Configurações</MenuItem>
    <MenuItem onClick={() => router.push("/logout")}>Sair</MenuItem>
  </MenuContent>
</Menu>;

export default function App({
  Component,
  pageProps,
}: {
  Component: React.ComponentType<any>;
  pageProps: Record<string, unknown>;
}) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
